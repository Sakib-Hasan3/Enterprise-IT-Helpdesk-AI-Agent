import shutil
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.schemas import DocumentListResponse, DocumentInfo, IngestResponse
from app.config import DOCS_DIR
from app.rag.pipeline import ingest_pdf
from app.rag.vector_store import get_client
from app.config import settings
from app.utils.logger import get_logger

logger = get_logger("api.documents")
router = APIRouter(tags=["documents"])

MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB


@router.get("/documents", response_model=DocumentListResponse)
def list_documents():
    """কোন কোন PDF ingest করা হয়েছে সেটা দেখায়।"""
    try:
        client = get_client()
        info = client.get_collection(settings.QDRANT_COLLECTION)
        total_chunks = info.points_count
    except Exception:
        total_chunks = 0
    
    docs = []
    for pdf in DOCS_DIR.glob("*.pdf"):
        docs.append(DocumentInfo(
            id=pdf.stem,
            name=pdf.name,
            chunks=0,  # simplification — later per-doc counting
        ))
    
    return DocumentListResponse(total=len(docs), documents=docs)


@router.post("/ingest", response_model=IngestResponse)
async def ingest_document(file: UploadFile = File(...)):
    """
    Admin-only endpoint (later we'll add auth):
    নতুন PDF upload করে সাথে সাথেই ingest করে Qdrant এ save করে।
    """
    # Validate file type
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")
    
    # Save to disk
    save_path = DOCS_DIR / file.filename
    
    try:
        with save_path.open("wb") as f:
            shutil.copyfileobj(file.file, f)
    except Exception as e:
        logger.exception("File save failed")
        raise HTTPException(status_code=500, detail=f"Save failed: {e}")
    finally:
        await file.close()
    
    # Size check
    if save_path.stat().st_size > MAX_FILE_SIZE:
        save_path.unlink()
        raise HTTPException(status_code=400, detail="File too large (max 20MB)")
    
    # Ingest
    try:
        ingest_pdf(str(save_path))
    except Exception as e:
        logger.exception("Ingest failed")
        raise HTTPException(status_code=500, detail=f"Ingest failed: {e}")
    
    logger.info(f"Ingested: {file.filename}")
    
    return IngestResponse(
        message="Document ingested successfully",
        filename=file.filename,
        chunks_added=0,  # could return actual count
    )