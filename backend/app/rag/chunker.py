from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.config import settings
from app.utils.logger import get_logger

logger = get_logger("rag.chunker")

def chunk_pages(pages: list[dict]) -> list[dict]:
    """
    প্রতিটা page-এর text কে ছোট chunk-এ ভাগ করে।
    Metadata (page, source) preserve করে।
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP,
        length_function=len,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    
    chunks = []
    for page in pages:
        pieces = splitter.split_text(page["text"])
        for i, piece in enumerate(pieces):
            chunks.append({
                "text": piece,
                "page": page["page"],
                "source": page["source"],
                "chunk_index": i,
            })
    
    logger.info(f"Created {len(chunks)} chunks from {len(pages)} pages")
    return chunks