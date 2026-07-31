from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.schemas import DocumentOut
from app.services import document_service
from typing import List

router = APIRouter(prefix="/api/documents", tags=["documents"])


@router.post("", response_model=DocumentOut)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    return await document_service.upload_document(file, db)


@router.get("", response_model=List[DocumentOut])
def list_documents(db: Session = Depends(get_db)):
    return document_service.get_all_documents(db)


@router.delete("/{doc_id}")
def delete_document(doc_id: int, db: Session = Depends(get_db)):
    return document_service.delete_document(doc_id, db)
