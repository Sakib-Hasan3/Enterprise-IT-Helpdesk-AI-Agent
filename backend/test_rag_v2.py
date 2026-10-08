from app.rag.pipeline import ingest_pdf, ask
from app.config import DOCS_DIR

def main():
    # ---------- Ingest (একবার) ----------
    print("\n" + "="*60)
    print("📥 INGESTING DOCUMENTS")
    print("="*60)
    
    pdfs = [
        DOCS_DIR / "fitsm_process_activities.pdf",
        DOCS_DIR / "fitsm_itsm_guide.pdf",
    ]
    
    for pdf in pdfs:
        if pdf.exists():
            ingest_pdf(str(pdf))
        else:
            print(f"⚠️  Skipping (not found): {pdf.name}")
    
    # ---------- Test Questions ----------
    questions = [
        "What is incident management?",
        "How do I implement a service management system?",
        "What are the key processes in IT service management?",
        "How do I cook biryani?",  # Should say "I don't know"
    ]
    
    for q in questions:
        print("\n" + "="*60)
        print(f"❓ {q}")
        print("="*60)
        
        result = ask(q)
        
        print(f"\n💬 Answer:\n{result['answer']}")
        
        if result.get("citations"):
            print(f"\n📚 Citations ({result['chunks_used']} chunks used):")
            for c in result["citations"]:
                print(f"   • {c['file']} p.{c['page']} (rel: {c['relevance']})")
                print(f"     \"{c['snippet']}\"")
        print()

if __name__ == "__main__":
    main()