"""
Ingest all PDFs from data/docs into Qdrant vector database.
"""
import sys
from pathlib import Path

# Add backend directory to path
sys.path.append(str(Path(__file__).resolve().parent))

from app.config import DOCS_DIR
from app.rag.pipeline import ingest_pdf
from app.rag.vector_store import get_client
from app.config import settings

def main():
    pdfs = sorted(list(DOCS_DIR.glob("*.pdf")))
    print(f"Found {len(pdfs)} PDFs in {DOCS_DIR}")
    
    for i, pdf in enumerate(pdfs, 1):
        print(f"\n[{i}/{len(pdfs)}] Ingesting {pdf.name}...")
        try:
            ingest_pdf(str(pdf))
        except Exception as e:
            print(f"❌ Error ingesting {pdf.name}: {e}")

    client = get_client()
    info = client.get_collection(settings.QDRANT_COLLECTION)
    print(f"\n✅ All done! Total points in Qdrant '{settings.QDRANT_COLLECTION}': {info.points_count}")

if __name__ == "__main__":
    main()

