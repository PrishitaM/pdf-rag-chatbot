from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.schemas import (
    SessionCreate, SessionOut, SessionWithHistory,
    ChatRequest, ChatResponse, MessageOut,
)
from app.services import chat_service
from typing import List

router = APIRouter(prefix="/api", tags=["chat"])

# ─── Sessions ─────────────────────────────────────────────────

@router.post("/sessions", response_model=SessionOut)
def create_session(body: SessionCreate, db: Session = Depends(get_db)):
    return chat_service.create_session(body.document_id, body.title, db)


@router.get("/sessions", response_model=List[SessionOut])
def list_sessions(db: Session = Depends(get_db)):
    return chat_service.get_sessions(db)


@router.get("/sessions/{session_id}", response_model=SessionWithHistory)
def get_session(session_id: int, db: Session = Depends(get_db)):
    return chat_service.get_session(session_id, db)


@router.get("/sessions/{session_id}/history", response_model=List[MessageOut])
def get_history(session_id: int, db: Session = Depends(get_db)):
    return chat_service.get_session_history(session_id, db)


@router.delete("/sessions/{session_id}")
def delete_session(session_id: int, db: Session = Depends(get_db)):
    return chat_service.delete_session(session_id, db)


# ─── Chat (non-streaming) ─────────────────────────────────────

@router.post("/chat", response_model=ChatResponse)
def chat(body: ChatRequest, db: Session = Depends(get_db)):
    return chat_service.chat(body.session_id, body.message, db)


# ─── Chat (streaming SSE) ─────────────────────────────────────

@router.post("/chat/stream")
def chat_stream(body: ChatRequest, db: Session = Depends(get_db)):
    return StreamingResponse(
        chat_service.chat_stream_generator(body.session_id, body.message, db),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
