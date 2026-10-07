from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from app.config import settings
from app.rag.loader import load_pdf
from app.rag.chunker import chunk_pages
from app.rag.embedder import embed_texts, embed_query
from app.rag.vector_store import upsert_chunks, search
from app.utils.logger import get_logger

logger = get_logger("rag.pipeline")

PROMPT = ChatPromptTemplate.from_template("""
You are an IT Helpdesk Assistant. Answer the employee's question 
ONLY using the provided context. If the answer is not in the context, 
say "I don't have that information in my knowledge base."

Always cite the source (filename, page) at the end.

Context:
{context}

Question: {question}

Answer:
""")

def ingest_pdf(file_path: str):
    """PDF → Qdrant (একবার চালাতে হবে প্রতি document-এর জন্য)"""
    logger.info(f"Ingesting: {file_path}")
    pages = load_pdf(file_path)
    chunks = chunk_pages(pages)
    embeddings = embed_texts([c["text"] for c in chunks])
    upsert_chunks(chunks, embeddings)
    logger.info("Ingestion complete")

def ask(question: str, top_k: int = 5) -> dict:
    """Question → Answer + Sources"""
    logger.info(f"Question: {question}")
    
    q_vec = embed_query(question)
    
    hits = search(q_vec, top_k=top_k)
    
    if not hits:
        return {"answer": "No documents found.", "sources": []}

    context = "\n\n".join([
        f"[{h['source']} p.{h['page']}]\n{h['text']}"
        for h in hits
    ])
    
    llm = ChatGroq(
        api_key=settings.GROQ_API_KEY,
        model="llama-3.1-8b-instant",
        temperature=0.1,
    )
    
    chain = PROMPT | llm
    response = chain.invoke({
        "context": context,
        "question": question,
    })
    
    return {
        "answer": response.content,
        "sources": [
            {"source": h["source"], "page": h["page"], "score": round(h["score"], 3)}
            for h in hits
        ],
    }