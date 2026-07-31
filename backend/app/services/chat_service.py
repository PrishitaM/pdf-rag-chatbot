from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models.session import ChatSession
from app.models.message import Message
from app.models.document import Document
from app.core import rag


# ─── Sessions ────────────────────────────────────────────────

def create_session(document_id: int, title: str, db: Session) -> ChatSession:
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    if doc.status != "ready":
        raise HTTPException(status_code=400, detail="Document is not ready yet.")

    session = ChatSession(document_id=document_id, title=title or "New Chat")
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def get_sessions(db: Session):
    return (
        db.query(ChatSession)
        .order_by(ChatSession.updated_at.desc())
        .all()
    )


def get_session(session_id: int, db: Session) -> ChatSession:
    s = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Session not found.")
    return s


def delete_session(session_id: int, db: Session):
    s = get_session(session_id, db)
    db.delete(s)
    db.commit()
    return {"detail": "Session deleted."}


def get_session_history(session_id: int, db: Session):
    s = get_session(session_id, db)
    return s.messages


# ─── Chat ────────────────────────────────────────────────────

def _build_history_list(session: ChatSession):
    return [
        {"role": m.role, "content": m.content}
        for m in session.messages[-10:]   # last 5 turns
    ]


def chat(session_id: int, user_message: str, db: Session):
    """Non-streaming chat. Returns answer + pages."""
    session = get_session(session_id, db)
    doc = session.document

    history = _build_history_list(session)

    answer, pages = rag.rag_query(user_message, doc.chroma_collection, history)

    # Save user message
    db.add(Message(
        session_id=session_id,
        role="user",
        content=user_message,
        pages_used="",
    ))

    # Save assistant message
    db.add(Message(
        session_id=session_id,
        role="assistant",
        content=answer,
        pages_used=",".join(map(str, pages)),
    ))

    # Update session title if first message
    if session.title == "New Chat" and len(session.messages) == 0:
        session.title = user_message[:60]

    db.commit()

    return {"answer": answer, "pages_used": pages, "session_id": session_id}


def chat_stream_generator(session_id: int, user_message: str, db: Session):
    """SSE streaming generator."""
    session = get_session(session_id, db)
    doc = session.document
    history = _build_history_list(session)

    # Save user message immediately
    db.add(Message(session_id=session_id, role="user", content=user_message, pages_used=""))
    if session.title == "New Chat" and len(session.messages) == 0:
        session.title = user_message[:60]
    db.commit()

    full_answer = ""
    pages_used = []

    for token in rag.rag_stream(user_message, doc.chroma_collection, history):
        if token.startswith("__PAGES__:"):
            raw = token.replace("__PAGES__:", "").strip()
            pages_used = [int(p) for p in raw.split(",") if p.strip().isdigit()]
            yield f"data: {{\"type\":\"pages\",\"pages\":{pages_used}}}\n\n"
        else:
            full_answer += token
            # Escape for SSE
            safe = token.replace("\n", "\\n").replace('"', '\\"')
            yield f'data: {{"type":"token","text":"{safe}"}}\n\n'

    # Save assistant message after stream ends
    db.add(Message(
        session_id=session_id,
        role="assistant",
        content=full_answer,
        pages_used=",".join(map(str, pages_used)),
    ))
    db.commit()

    yield f'data: {{"type":"done","session_id":{session_id}}}\n\n'
