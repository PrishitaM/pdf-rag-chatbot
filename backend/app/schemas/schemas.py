from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


# ─── Document ─────────────────────────────────────────────────

class DocumentOut(BaseModel):
    id: int
    filename: str
    original_name: str
    file_size: int
    page_count: int
    uploaded_at: datetime
    status: str

    class Config:
        from_attributes = True


# ─── Message ──────────────────────────────────────────────────

class MessageOut(BaseModel):
    id: int
    session_id: int
    role: str
    content: str
    pages_used: str
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Chat Session ─────────────────────────────────────────────

class SessionCreate(BaseModel):
    document_id: int
    title: Optional[str] = "New Chat"


class SessionOut(BaseModel):
    id: int
    title: str
    document_id: int
    created_at: datetime
    updated_at: datetime
    document: Optional[DocumentOut] = None

    class Config:
        from_attributes = True


class SessionWithHistory(SessionOut):
    messages: List[MessageOut] = []


# ─── Chat ─────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    session_id: int
    message: str


class ChatResponse(BaseModel):
    answer: str
    pages_used: List[int]
    session_id: int
