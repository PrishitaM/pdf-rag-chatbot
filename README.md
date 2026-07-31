# PDF RAG Chatbot

A full-stack AI chatbot that lets you upload PDFs and chat with them using RAG (Retrieval-Augmented Generation) with LLaMA3 via Ollama.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TailwindCSS |
| Backend | FastAPI (Python 3.11+) |
| Database | SQL Server (via pyodbc / SQLAlchemy) |
| Vector DB | ChromaDB (local persistent) |
| Embeddings | sentence-transformers/all-MiniLM-L6-v2 |
| LLM | LLaMA3 via Ollama (local) |

---

## Project Structure

```
pdf-rag-chatbot/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI route handlers
│   │   ├── core/         # Config, RAG engine
│   │   ├── db/           # SQLAlchemy setup
│   │   ├── models/       # DB table models
│   │   ├── schemas/      # Pydantic schemas
│   │   └── services/     # Business logic
│   ├── requirements.txt
│   ├── .env.example
│   └── main.py
├── frontend/
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── pages/        # Page components
│   │   ├── services/     # API calls
│   │   └── store/        # Zustand state
│   ├── package.json
│   └── vite.config.js
├── docker-compose.yml
└── README.md
```

---

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- [Ollama](https://ollama.ai) installed and running
- SQL Server (or use the Docker Compose setup)

### 1. Pull LLaMA3

```bash
ollama pull llama3
# Optional: faster alternative
ollama pull phi3:mini
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt

# Copy and edit env
cp .env.example .env
# Fill in your SQL Server connection string in .env
```

### 3. Database Setup

Run the SQL script to create tables:

```bash
# Using sqlcmd (SQL Server CLI)
sqlcmd -S localhost -d master -i docs/init_db.sql
```

### 4. Start Backend

```bash
cd backend
uvicorn main:app --reload --port 8000
```

### 5. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`

---

## Docker (Full Stack)

```bash
# Requires Docker Desktop
docker-compose up --build
```

> Note: Ollama must be running on your host machine (not inside Docker by default).

---

## Environment Variables

See `backend/.env.example` for all required variables.

Key ones:

```
SQL_SERVER=localhost
SQL_DATABASE=rag_chatbot
SQL_USERNAME=sa
SQL_PASSWORD=YourPassword123
OLLAMA_MODEL=llama3
CHROMA_DB_PATH=./chroma_db
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload a PDF |
| GET | `/api/documents` | List all uploaded docs |
| DELETE | `/api/documents/{id}` | Delete a document |
| POST | `/api/chat` | Send a message |
| GET | `/api/sessions` | List chat sessions |
| GET | `/api/sessions/{id}/history` | Get chat history |
| DELETE | `/api/sessions/{id}` | Delete a session |

---

## Features

- Upload multiple PDFs
- Chat with any uploaded document
- Full chat history saved to SQL Server
- Session management (create / switch / delete sessions)  
- Streaming responses
- MMR-based retrieval for diverse context
- Smart summary detection
- Page number citations in responses
