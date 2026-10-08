from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from app.config import settings
from app.rag.loader import load_pdf
from app.rag.chunker import chunk_pages
from app.rag.embedder import embed_texts, embed_query
from app.rag.vector_store import upsert_chunks, search
from app.rag.reranker import rerank
from app.rag.citation import format_citations, build_context
from app.utils.logger import get_logger

logger = get_logger("rag.pipeline")

# ---------- Prompt ----------
PROMPT = ChatPromptTemplate.from_template("""
You are an IT Helpdesk Assistant for employees.

RULES:
1. Answer ONLY using the provided context below.
2. If the answer is not in the context, respond EXACTLY:
   "I don't have that information in my knowledge base."
3. Be concise and use bullet points for steps.
4. Do NOT make up information.
5. Do NOT include source citations in your answer — they will be added separately.

Context:
{context}

Employee's Question: {question}

Answer:
""")

# ---------- Ingest ----------
def ingest_pdf(file_path: str):
    """PDF → Qdrant (প্রতি PDF এর জন্য একবার)"""
    logger.info(f"Ingesting: {file_path}")
    pages = load_pdf(file_path)
    chunks = chunk_pages(pages)
    embeddings = embed_texts([c["text"] for c in chunks])
    upsert_chunks(chunks, embeddings)
    logger.info(f"✅ Ingestion complete: {file_path}")


# ---------- Retrieve + Rerank ----------
def retrieve_and_rerank(question: str, initial_k: int = 20, final_k: int = 5):
    """
    দুই ধাপের retrieval:
    1. Vector search দিয়ে 20টা candidate আনি (fast, but noisy)
    2. Reranker দিয়ে best 5টা বাছি (slow, but accurate)
    """
    q_vec = embed_query(question)
    candidates = search(q_vec, top_k=initial_k)
    logger.info(f"Vector search: {len(candidates)} candidates")
    
    if not candidates:
        return []
    
    return rerank(question, candidates, top_k=final_k)


# ---------- Ask ----------
def ask(question: str) -> dict:
    """Question → Answer + Citations"""
    logger.info(f"Question: {question}")
    
    # 1. Retrieve + rerank
    top_chunks = retrieve_and_rerank(question)
    
    if not top_chunks:
        return {
            "answer": "I don't have that information in my knowledge base.",
            "citations": [],
        }
    
    # 2. Context বানাও
    context = build_context(top_chunks)
    
    # 3. LLM
    llm = ChatGroq(
        api_key=settings.GROQ_API_KEY,
        model="llama-3.1-8b-instant",
        temperature=0.1,
    )
    chain = PROMPT | llm
    response = chain.invoke({"context": context, "question": question})
    
    # 4. Citations
    citations = format_citations(top_chunks)
    
    return {
        "answer": response.content.strip(),
        "citations": citations,
        "chunks_used": len(top_chunks),
    }