# 📄 PDF RAG Chatbot

An AI-powered Retrieval-Augmented Generation (RAG) chatbot that allows users to upload PDF documents and ask natural language questions. The application retrieves relevant content from the uploaded PDFs and generates context-aware answers using a local Large Language Model (LLM).

---

## ✨ Features

- 📁 Upload one or more PDF documents
- 💬 Ask questions in natural language
- 🧠 Retrieval-Augmented Generation (RAG)
- 🔍 Semantic search using vector embeddings
- 📄 Displays source page numbers for responses
- 💾 SQL Server-based chat history and session management
- ⚡ FastAPI backend with React frontend
- 🖥️ Runs completely locally using Ollama

---

## 🛠️ Tech Stack

### Frontend
- React
- Vite
- Tailwind CSS
- Zustand

### Backend
- FastAPI
- Python
- SQLAlchemy

### AI & RAG
- LangChain
- Ollama (Llama 3)
- ChromaDB
- Sentence Transformers
- PyPDF

### Database
- SQL Server

---

## 🏗️ Architecture

```
            PDF Upload
                 │
                 ▼
        Text Extraction (PyPDF)
                 │
                 ▼
        Text Chunking (LangChain)
                 │
                 ▼
      Generate Embeddings
                 │
                 ▼
          ChromaDB Vector Store
                 │
                 ▼
         User Question
                 │
                 ▼
    Similarity Search (Top Chunks)
                 │
                 ▼
      Ollama (Llama 3 LLM)
                 │
                 ▼
        AI Generated Response
```

---

## 📂 Project Structure

```
pdf-rag-chatbot/
│
├── backend/
│   ├── app/
│   ├── uploads/
│   ├── chroma_db/
│   ├── requirements.txt
│   └── main.py
│
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
│
├── docker-compose.yml
└── README.md
```

---

## 🚀 Installation

### Clone the repository

```bash
git clone https://github.com/PrishitaM/pdf-rag-chatbot.git

cd pdf-rag-chatbot
```

---

### Backend

```bash
cd backend

python -m venv venv

# Windows
venv\Scripts\activate

pip install -r requirements.txt

python -m uvicorn main:app --reload
```

---

### Frontend

```bash
cd frontend

npm install

npm run dev
```

---

### Start Ollama

```bash
ollama serve
```

Download the model if needed:

```bash
ollama pull llama3
```

---

## 📸 Screenshots

### Chat Interface

> Add a screenshot here.

### PDF Upload

> Add another screenshot here.

---

## 📌 Future Enhancements

- Authentication & User Accounts
- Support for DOCX and TXT files
- Multi-document chat
- Streaming AI responses
- Cloud deployment
- Citation highlighting
- Chat export
- Conversation memory

---

## 👩‍💻 Author

**Prishita Matreja**

GitHub: https://github.com/PrishitaM

---

## ⭐ If you found this project useful, consider giving it a star!
