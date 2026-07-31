from sqlalchemy import Column, Integer, String, DateTime, BigInteger
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    original_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(BigInteger, default=0)
    page_count = Column(Integer, default=0)
    chroma_collection = Column(String(255), nullable=False)  # collection name in ChromaDB
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    status = Column(String(50), default="processing")  # processing | ready | error

    sessions = relationship("ChatSession", back_populates="document")
