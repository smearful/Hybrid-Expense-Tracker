# ExpensePro 
### A dual database hybrid expense tracker that helps you budget and keeps track of miscellaneous objects like reciepts or notes.

This website uses Django Rest Framework and React to build an intuitive platform for keeping track of expenses. 

## API pipeline
          React (axios)
              │
              │  HTTP Request  e.g. POST /api/expenses/  { amount, category, date }
              ▼
          urls.py  — DefaultRouter
              │
              │  Matches /api/expenses/  →  ExpenseViewSet
              │  Matches /api/objects/   →  ObjectViewSet
              │  Matches /api/chat/      →  chat_parse (function view)
              ▼
          ViewSet  (views.py)
              │
              │  ModelViewSet gives you list / create / retrieve / update / destroy
              │  automatically — no manual CRUD code needed
              ▼
          Serializer  (serializers.py)
              │
              │  ExpenseSerializer  →  validates: amount (decimal), category (str),
              │                         date (date), description (str)
              │
              │  ObjectSerializer   →  validates: name (str), details (JSONField)
              │
              │  .is_valid()  →  rejects bad data before any DB write
              │  .save()      →  calls .create() or .update() on the model
              ▼
          Model  (models.py)
              │
              │  Expense  →  standard Django model, fields typed at DB level
              │  Object   →  Djongo model, uses ObjectIdField + JSONField
              ▼
          DatabaseRouter  (db_router.py)
              │
              │  Transparently redirects the query to the right database
              │  (see Pipeline 2 below)
              ▼
          Database  →  response back up the chain as JSON

## Database Routing
          Any DB operation  (.save(), .objects.all(), .filter(), etc.)
                  │
                  ▼
          DatabaseRouter.db_for_write(model)  /  db_for_read(model)
                  │
                  │  Checks:  model._meta.model_name
                  │
                  ├── model name in {'object', 'note', 'screenshot'}
                  │       └──▶  return 'mongodb'
                  │
                  └── anything else  (e.g. 'expense')
                          └──▶  return 'default'  (SQLite)

          POST /api/expenses/  { amount: 850, category: "Transport" }
        │
        ▼  ExpenseSerializer.save()
        │
        ▼  DatabaseRouter.db_for_write(Expense)
              model_name = 'expense'  →  NOT in NOSQL_MODELS
              returns 'default'
        │
        ▼  Django ORM  →  SQLite
              INSERT INTO quickstart_expense (amount, category, date, description)
              VALUES (850, 'Transport', '2026-05-11', '')

          POST /api/objects/  { name: "D-Mart Receipt", details: {...} }
        │
        ▼  ObjectSerializer.save()
        │
        ▼  DatabaseRouter.db_for_write(Object)
              model_name = 'object'  →  IN NOSQL_MODELS
              returns 'mongodb'
        │
        ▼  Djongo ORM  →  MongoDB
              db.quickstart_object.insertOne({
                _id: ObjectId("..."),
                name: "D-Mart Receipt",
                details: { milk: 40, eggs: 60, ... }
              })

## ChatBot pipeline
          User types in chatbot
                  ↓
          POST /api/chat/
                  ↓
          Django sanitizes input (length cap, strip special chars)
                  ↓
          Calls Ollama → expense-parser model (LLaMA 3.1 8B, LoRA fine-tuned)
                  ↓
          extract_json() pulls first valid {...} from raw output
                  ↓
          Smart routing:
            ├── Has amount + category at top level  →  SQL (Expense)
            ├── Has amount inside details           →  flatten → SQL (Expense)
            │     └── infer category from name keywords if missing
            └── Has name + details, no amount      →  MongoDB (Object)
                  ↓
          Serializer validates → saves to correct DB
                  ↓
          Frontend refreshes the correct tab automatically
