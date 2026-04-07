from django.shortcuts import render
from rest_framework import viewsets
from rest_framework import permissions
from .serializers import ExpenseSerializer, ObjectSerializer
from .models import Expense, Object

# Create your views here.
class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all().order_by('-date')
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.AllowAny]

class ObjectViewSet(viewsets.ModelViewSet):
    queryset = Object.objects.all().order_by('-name')
    serializer_class = ObjectSerializer
    permission_classes = [permissions.AllowAny]