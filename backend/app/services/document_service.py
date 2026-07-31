import os
import uuid
import aiofiles
from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session
from app.models.document import Document
from app.core.config import settings
from app.core import rag


async def upload_document(file: UploadFile, db: Session) -> Document:
    """Save PDF to disk, ingest into ChromaDB, record in SQL Server."""

    # Validate
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    content = await file.read()
    size_mb = len(content) / (1024 * 1024)
    if size_mb > settings.MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Max size is {settings.MAX_FILE_SIZE_MB} MB.",
        )

    # Save file
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    unique_name = f"{uuid.uuid4().hex}_{file.filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_name)

    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    # Create DB record (status=processing)
    collection_name = f"doc_{uuid.uuid4().hex[:12]}"
    doc = Document(
        filename=unique_name,
        original_name=file.filename,
        file_path=file_path,
        file_size=len(content),
        chroma_collection=collection_name,
        status="processing",
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Ingest into ChromaDB
    try:
        page_count = rag.ingest_pdf(file_path, collection_name)
        doc.page_count = page_count
        doc.status = "ready"
    except Exception as e:
        doc.status = "error"
        db.commit()
        raise HTTPException(status_code=500, detail=f"Failed to process PDF: {str(e)}")

    db.commit()
    db.refresh(doc)
    return doc


def get_all_documents(db: Session):
    return db.query(Document).order_by(Document.uploaded_at.desc()).all()


def get_document(doc_id: int, db: Session) -> Document:
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    return doc


def delete_document(doc_id: int, db: Session):
    doc = get_document(doc_id, db)

    # Delete from ChromaDB
    rag.delete_collection(doc.chroma_collection)

    # Delete physical file
    try:
        if os.path.exists(doc.file_path):
            os.remove(doc.file_path)
    except Exception:
        pass

    db.delete(doc)
    db.commit()
    return {"detail": "Document deleted."}
