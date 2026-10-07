from pathlib import Path
from pypdf import PdfReader
from app.utils.logger import get_logger

logger = get_logger("rag.loader")

def load_pdf(file_path: str) -> list[dict]:
    """
    PDF থেকে প্রতিটা page-এর text বের করে।
    Return: [{"text": "...", "page": 1, "source": "vpn_manual.pdf"}]
    """
    path = Path(file_path)
    
    if not path.exists():
        raise FileNotFoundError(f"PDF পাওয়া যায়নি: {file_path}")
    
    logger.info(f"Loading PDF: {path.name}")
    
    reader = PdfReader(str(path))
    pages = []
    
    for page_num, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""
        text = text.strip()
        
        if not text:
            logger.warning(f"Page {page_num} empty, skipping")
            continue
        
        pages.append({
            "text": text,
            "page": page_num,
            "source": path.name,
        })
    
    logger.info(f"Loaded {len(pages)} pages from {path.name}")
    return pages