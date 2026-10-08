import sys
import os
from pathlib import Path

# Add backend directory to path so 'app' can be imported
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.rag.pipeline import ingest_pdf, ask

def main():
    # Example file path
    pdf_path = Path(__file__).parent / "data" / "docs" / "itsm_itsm_guide.pdf"
    
    if not pdf_path.exists():
        print(f"Error: Could not find PDF at {pdf_path}")
        return

    print("1. Ingesting PDF into Qdrant...")
    # Uncomment the next line to ingest the PDF (only needed once)
    # ingest_pdf(str(pdf_path))
    
    print("\n2. Asking a question...")
    question = "What is this guide about?"
    response = ask(question)
    
    print("\nAnswer:")
    print(response["answer"])
    
    print("\nSources:")
    for source in response["sources"]:
        print(f"- {source['source']} (Page {source['page']}) [Score: {source['score']}]")

if __name__ == "__main__":
    main()
