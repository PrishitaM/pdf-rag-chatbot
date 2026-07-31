import os
from typing import List, Tuple
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_ollama import OllamaLLM
from langchain.schema import Document
from app.core.config import settings

# ─── Singleton embedding model ────────────────────────────────
_embedding_model = None


def get_embedding_model() -> HuggingFaceEmbeddings:
    global _embedding_model
    if _embedding_model is None:
        _embedding_model = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2",
            model_kwargs={"device": "cpu"},
            encode_kwargs={"batch_size": 64},
        )
    return _embedding_model


# ─── Singleton LLM ────────────────────────────────────────────
_llm = None


def get_llm() -> OllamaLLM:
    global _llm
    if _llm is None:
        _llm = OllamaLLM(
            model=settings.OLLAMA_MODEL,
            base_url=settings.OLLAMA_BASE_URL,
            temperature=settings.LLM_TEMPERATURE,
            num_predict=settings.LLM_NUM_PREDICT,
            num_ctx=settings.LLM_NUM_CTX,
        )
    return _llm


# ─── Summary keyword detection ────────────────────────────────
SUMMARY_KEYWORDS = {
    "summary", "summarize", "summarise", "overview",
    "entire pdf", "whole pdf", "index", "topics",
    "table of contents", "main ideas", "outline",
}


def is_summary_query(query: str) -> bool:
    q = query.lower()
    return any(kw in q for kw in SUMMARY_KEYWORDS)


def sample_chunks(chunks: List[Document], max_chunks: int = 15) -> List[Document]:
    """Evenly sample chunks across the document for summary queries."""
    if len(chunks) <= max_chunks:
        return chunks
    step = len(chunks) // max_chunks
    return chunks[::step][:max_chunks]


# ─── Ingest PDF ───────────────────────────────────────────────

def ingest_pdf(file_path: str, collection_name: str) -> int:
    """Load, split, embed and store a PDF. Returns page count."""
    loader = PyPDFLoader(file_path)
    documents = loader.load()

    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    chunks = splitter.split_documents(documents)

    embedding = get_embedding_model()
    Chroma.from_documents(
        documents=chunks,
        embedding=embedding,
        persist_directory=settings.CHROMA_DB_PATH,
        collection_name=collection_name,
    )

    page_count = len(documents)
    return page_count


# ─── Load existing collection ─────────────────────────────────

def load_vectorstore(collection_name: str) -> Chroma:
    return Chroma(
        persist_directory=settings.CHROMA_DB_PATH,
        embedding_function=get_embedding_model(),
        collection_name=collection_name,
    )


# ─── Delete collection ────────────────────────────────────────

def delete_collection(collection_name: str):
    try:
        import chromadb
        client = chromadb.PersistentClient(path=settings.CHROMA_DB_PATH)
        client.delete_collection(collection_name)
    except Exception:
        pass  # Already deleted or doesn't exist


# ─── RAG Query ────────────────────────────────────────────────

def build_prompt(query: str, context: str, history: str) -> str:
    return f"""You are a PDF assistant. Answer ONLY from the document context below.
If not found, say exactly: "I couldn't find this in the document."
Use bullet points where appropriate. Mention page numbers when citing information.

Conversation History:
{history if history else "No previous conversation."}

Document Context:
{context}

User Question: {query}

Answer:"""


def rag_query(
    query: str,
    collection_name: str,
    chat_history: List[dict],
) -> Tuple[str, List[int]]:
    """
    Run a RAG query. Returns (answer, pages_used).
    chat_history: list of {"role": "user"|"assistant", "content": str}
    """
    vectorstore = load_vectorstore(collection_name)

    # Load all chunks for summary queries; retrieve for normal queries
    if is_summary_query(query):
        retriever = vectorstore.as_retriever(search_kwargs={"k": 50})
        all_docs = retriever.invoke("document overview")
        docs = sample_chunks(all_docs, max_chunks=15)
    else:
        retriever = vectorstore.as_retriever(
            search_type="mmr",
            search_kwargs={"k": 4, "fetch_k": 15, "lambda_mult": 0.5},
        )
        docs = retriever.invoke(query)

    # Extract pages
    pages = sorted(set(doc.metadata.get("page", 0) + 1 for doc in docs))

    # Build context (capped at 3000 chars)
    context_parts = []
    total_chars = 0
    for doc in docs:
        part = f"[Page {doc.metadata.get('page', 0) + 1}]\n{doc.page_content}"
        total_chars += len(part)
        if total_chars > 3000:
            break
        context_parts.append(part)
    context = "\n\n".join(context_parts)

    # Build history string (last 3 turns)
    recent = chat_history[-6:]  # 3 user + 3 assistant
    history_str = "\n".join(
        f"{'User' if m['role'] == 'user' else 'Assistant'}: {m['content']}"
        for m in recent
    )

    prompt = build_prompt(query, context, history_str)
    llm = get_llm()
    answer = llm.invoke(prompt)

    return answer.strip(), pages


def rag_stream(
    query: str,
    collection_name: str,
    chat_history: List[dict],
):
    """Generator version of rag_query — yields text tokens."""
    vectorstore = load_vectorstore(collection_name)

    if is_summary_query(query):
        retriever = vectorstore.as_retriever(search_kwargs={"k": 50})
        all_docs = retriever.invoke("document overview")
        docs = sample_chunks(all_docs, max_chunks=15)
    else:
        retriever = vectorstore.as_retriever(
            search_type="mmr",
            search_kwargs={"k": 4, "fetch_k": 15, "lambda_mult": 0.5},
        )
        docs = retriever.invoke(query)

    pages = sorted(set(doc.metadata.get("page", 0) + 1 for doc in docs))

    context_parts = []
    total_chars = 0
    for doc in docs:
        part = f"[Page {doc.metadata.get('page', 0) + 1}]\n{doc.page_content}"
        total_chars += len(part)
        if total_chars > 3000:
            break
        context_parts.append(part)
    context = "\n\n".join(context_parts)

    recent = chat_history[-6:]
    history_str = "\n".join(
        f"{'User' if m['role'] == 'user' else 'Assistant'}: {m['content']}"
        for m in recent
    )

    prompt = build_prompt(query, context, history_str)
    llm = get_llm()

    # Yield pages metadata first as a special token
    yield f"__PAGES__:{','.join(map(str, pages))}\n"

    for token in llm.stream(prompt):
        yield token
