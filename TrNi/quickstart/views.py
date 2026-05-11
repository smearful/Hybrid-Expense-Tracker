from django.shortcuts import render
from django.conf import settings as django_settings
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .serializers import ExpenseSerializer, ObjectSerializer
from .models import Expense, Object
import requests
import json
import re


MAX_INPUT_LENGTH = 500  # characters — prevents prompt injection via huge inputs


def extract_json(text):
    """
    Safely extract the first complete JSON object from a string.
    Handles cases where the model wraps its output in extra prose.
    e.g. "Sure! Here is the result: {...} Let me know if..."
    Returns the parsed dict or raises ValueError.
    """
    # Find the first opening brace
    start = text.find('{')
    if start == -1:
        raise ValueError('No JSON object found in model output.')

    # Walk forward tracking brace depth to find the matching closing brace
    depth = 0
    for i, ch in enumerate(text[start:], start=start):
        if ch == '{':
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0:
                candidate = text[start:i + 1]
                return json.loads(candidate)  # raises json.JSONDecodeError if malformed

    raise ValueError('JSON object in model output is not closed properly.')


class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all().order_by('-date')
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.AllowAny]


class ObjectViewSet(viewsets.ModelViewSet):
    queryset = Object.objects.all().order_by('-name')
    serializer_class = ObjectSerializer
    permission_classes = [permissions.AllowAny]


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def chat_parse(request):
    """
    Accepts a natural language expense message, sends it to the local
    Ollama model, parses the JSON response, and saves it to the correct DB.
    """
    message = request.data.get('message', '').strip()
    if not message:
        return Response(
            {'error': 'Message is required.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # --- Input safety guard ---
    if len(message) > MAX_INPUT_LENGTH:
        return Response(
            {'error': f'Message too long. Please keep it under {MAX_INPUT_LENGTH} characters.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    # Strip any characters that could confuse the prompt (e.g. curly braces, backticks)
    message = re.sub(r'[`\\]', '', message)

    ollama_url = django_settings.OLLAMA_URL
    ollama_model = django_settings.OLLAMA_MODEL

    # --- Call Ollama ---
    # timeout=(connect, read): fail fast if Ollama is off, but wait up to 3 min
    # for the first inference (model cold-start loads ~4.7GB into RAM on CPU)
    CONNECT_TIMEOUT = 10
    READ_TIMEOUT = 180
    try:
        ollama_response = requests.post(
            f'{ollama_url}/api/generate',
            json={
                'model': ollama_model,
                'prompt': message,
                'stream': False,
                'options': {
                    'num_predict': 200,
                    'temperature': 0.1,
                    'top_p': 0.9,
                }
            },
            timeout=(CONNECT_TIMEOUT, READ_TIMEOUT)
        )
        ollama_response.raise_for_status()
        raw_output = ollama_response.json().get('response', '').strip()
    except requests.exceptions.ConnectionError:
        return Response(
            {'error': 'Ollama is not running. Please start Ollama and try again.'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
    except requests.exceptions.Timeout:
        return Response(
            {
                'error': 'The model is still loading into memory. '
                         'This only happens on the first request. Please wait 10 seconds and try again.'
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
    except Exception as e:
        return Response(
            {'error': f'Unexpected model error: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    # --- Extract + parse JSON from model output ---
    try:
        parsed = extract_json(raw_output)
    except (ValueError, json.JSONDecodeError) as e:
        return Response(
            {
                'error': 'Could not parse model output as JSON.',
                'detail': str(e),
                'raw': raw_output
            },
            status=status.HTTP_422_UNPROCESSABLE_ENTITY
        )

    # --- Sanitize model output ---
    DATE_PLACEHOLDERS = {'YYYY-MM-DD', 'yyyy-mm-dd', 'null', 'None', '', 'N/A', 'n/a'}
    if parsed.get('date') in DATE_PLACEHOLDERS:
        parsed['date'] = None

    # --- Route to correct serializer ---
    declared_target = parsed.pop('model', 'Expense')

    has_expense_fields = {'amount', 'category'}.issubset(parsed.keys())
    has_object_fields  = {'name', 'details'}.issubset(parsed.keys())

    # --- Handle model always using Object format ---
    # The fine-tuned model may always output {name, details} even for single expenses.
    # Detect this and flatten to Expense when possible.
    if has_object_fields and not has_expense_fields:
        details = parsed.get('details', {})
        if isinstance(details, dict) and 'amount' in details:

            # Stage 1: details has amount + category explicitly
            category = details.get('category')

            # Stage 2: no explicit category — infer from other detail fields or name
            if not category:
                # Check common alternate field names
                category = details.get('type') or details.get('fuel_type') or details.get('expense_type')

            if not category:
                # Keyword-match against the object name
                KEYWORD_MAP = {
                    'fuel': 'Transport',    'petrol': 'Transport', 'diesel': 'Transport',
                    'uber': 'Transport',    'taxi': 'Transport',   'travel': 'Transport',
                    'grocery': 'Groceries', 'groceries': 'Groceries', 'supermarket': 'Groceries',
                    'food': 'Food',         'restaurant': 'Food',  'cafe': 'Food',
                    'rent': 'Housing',      'electric': 'Utilities', 'bill': 'Utilities',
                    'medical': 'Healthcare','medicine': 'Healthcare', 'hospital': 'Healthcare',
                    'entertainment': 'Entertainment', 'movie': 'Entertainment',
                    'shopping': 'Shopping', 'clothes': 'Shopping',
                }
                name_lower = parsed.get('name', '').lower()
                for keyword, mapped in KEYWORD_MAP.items():
                    if keyword in name_lower:
                        category = mapped
                        break

            # Flatten to Expense structure
            parsed = {
                'amount':      details.get('amount'),
                'category':    category or 'General',
                'date':        details.get('date', parsed.get('date')),
                'description': details.get('description', parsed.get('name', '')),
            }
            if parsed.get('date') in DATE_PLACEHOLDERS:
                parsed['date'] = None
            has_expense_fields = True
            has_object_fields  = False
            print(f"[CHAT DEBUG] Flattened nested expense → {parsed}")

    if has_expense_fields and not has_object_fields:
        model_target = 'Expense'   # clear expense — route to SQL
    elif has_object_fields and not has_expense_fields:
        model_target = 'Object'    # clear object — route to MongoDB
    else:
        model_target = declared_target  # ambiguous — trust the model

    print(f"[CHAT DEBUG] final model_target: {model_target}\n")

    if model_target == 'Object':
        serializer = ObjectSerializer(data=parsed)
    else:
        serializer = ExpenseSerializer(data=parsed)

    if serializer.is_valid():
        serializer.save()
        return Response(
            {'status': 'saved', 'model': model_target, 'data': serializer.data},
            status=status.HTTP_201_CREATED
        )
    else:
        return Response(
            {'error': 'Validation failed.', 'details': serializer.errors, 'raw': raw_output},
            status=status.HTTP_400_BAD_REQUEST
        )