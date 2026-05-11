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
