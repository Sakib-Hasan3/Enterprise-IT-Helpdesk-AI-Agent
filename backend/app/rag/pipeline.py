import re
from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI
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

# ---------- Prompts ----------
RAG_PROMPT = ChatPromptTemplate.from_template("""
You are an IT Helpdesk & AI Assistant (functioning like ChatGPT with access to internal company documentation).

DOCUMENT CONTEXT:
{context}

EMPLOYEE QUESTION:
{question}

INSTRUCTIONS:
1. Examine the DOCUMENT CONTEXT above to see if it contains information that directly answers or relates to the employee's question.
2. IF THE CONTEXT CONTAINS THE RELEVANT ANSWER:
   - Provide a clear, structured, and accurate answer based on the context.
   - Use bullet points for steps or procedures where helpful.
   - At the VERY END of your response, on a new line, output:
     [SOURCE: DOCUMENT]
3. IF THE CONTEXT DOES NOT CONTAIN THE ANSWER (e.g. question is unrelated, general tech question, coding question, or everyday inquiry):
   - Answer the question helpfully, thoroughly, and accurately using your general knowledge (just like ChatGPT).
   - If it is a technical or troubleshooting question, provide standard best practices and clear steps.
   - At the VERY END of your response, on a new line, output:
     [SOURCE: GENERAL]
4. NEVER say "I don't have that information in my knowledge base" unless the user explicitly asks what is in the knowledge base. Always be helpful and answer the question.
5. Do NOT include source names, citations, or file names inside the answer text itself — they are added separately.

Answer:
""")

GENERAL_PROMPT = ChatPromptTemplate.from_template("""
You are an intelligent, friendly, and helpful AI Assistant (like ChatGPT).
The user is asking a question that is not present in the internal documentation.
Answer the user's question clearly, helpfully, and comprehensively using your general knowledge.
If it involves IT support, troubleshooting, or technical steps, provide practical, structured guidance.

User's Question: {question}

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
RERANK_THRESHOLD = 0.01  # Minimum relevance score to consider a chunk useful

def retrieve_and_rerank(question: str, initial_k: int = 8, final_k: int = 3):
    """
    দুই ধাপের retrieval:
    1. Vector search দিয়ে 20টা candidate আনি (fast, but noisy)
    2. Reranker দিয়ে best 5টা বাছি (slow, but accurate)
    3. Threshold check — irrelevant results বাদ দিই
    """
    q_vec = embed_query(question)
    candidates = search(q_vec, top_k=initial_k)
    logger.info(f"Vector search: {len(candidates)} candidates")
    
    if not candidates:
        return []
    
    reranked = rerank(question, candidates, top_k=final_k)
    
    # If best chunk score is below threshold, none of the results are relevant
    if reranked and reranked[0].get("rerank_score", 0) < RERANK_THRESHOLD:
        logger.info(
            f"Best rerank score {reranked[0].get('rerank_score', 0):.4f} "
            f"below threshold {RERANK_THRESHOLD} — no relevant chunks found"
        )
        return []
    
    return reranked


def invoke_prompt(prompt, params: dict):
    """
    3-tier LLM fallback for maximum speed + reliability:
      Tier 1 → Groq: openai/gpt-oss-20b    (fastest, lightweight)
      Tier 2 → Groq: qwen/qwen3.8-27b      (high capability reasoning)
      Tier 3 → Groq: openai/gpt-oss-120b   (powerful fallback)
    """
    # --- Tier 1: Groq openai/gpt-oss-20b ---
    try:
        primary_llm = ChatGroq(
            api_key=settings.GROQ_API_KEY,
            model="openai/gpt-oss-20b",
            temperature=0.2,
            max_tokens=800,
        )
        result = (prompt | primary_llm).invoke(params)
        logger.info("LLM: Groq openai/gpt-oss-20b ✅")
        return result
    except Exception as e:
        logger.warning(f"Tier 1 (openai/gpt-oss-20b) failed: {e}. Trying Tier 2...")

    # --- Tier 2: Groq qwen/qwen3.8-27b ---
    try:
        secondary_llm = ChatGroq(
            api_key=settings.GROQ_API_KEY,
            model="qwen/qwen3.8-27b",
            temperature=0.2,
            max_tokens=800,
        )
        result = (prompt | secondary_llm).invoke(params)
        logger.info("LLM: Groq qwen/qwen3.8-27b ✅")
        return result
    except Exception as e:
        logger.warning(f"Tier 2 (qwen/qwen3.8-27b) failed: {e}. Trying Tier 3...")

    # --- Tier 3: Groq openai/gpt-oss-120b ---
    tertiary_llm = ChatGroq(
        api_key=settings.GROQ_API_KEY,
        model="openai/gpt-oss-120b",
        temperature=0.2,
        max_tokens=800,
    )
    result = (prompt | tertiary_llm).invoke(params)
    logger.info("LLM: Groq openai/gpt-oss-120b ✅")
    return result


# ---------- Ask (non-streaming) ----------
def ask(question: str) -> dict:
    """
    Question → Answer + Citations
    - If found in documents: answers based on docs and returns citations.
    - If not in documents: answers using general LLM knowledge (ChatGPT mode) without citations.
    """
    logger.info(f"Question: {question}")

    top_chunks = retrieve_and_rerank(question)

    if not top_chunks:
        logger.info("No relevant document chunks found. Answering with general LLM knowledge.")
        response = invoke_prompt(GENERAL_PROMPT, {"question": question})
        return {
            "answer": response.content.strip(),
            "citations": [],
            "chunks_used": 0,
            "source_type": "general_knowledge",
        }

    logger.info(f"Found {len(top_chunks)} candidate chunks. Querying LLM with context.")
    context = build_context(top_chunks)
    response = invoke_prompt(RAG_PROMPT, {"context": context, "question": question})
    raw_answer = response.content.strip()

    # Determine if the LLM used the documents or fell back to general knowledge
    if "[SOURCE: GENERAL]" in raw_answer:
        logger.info("LLM determined context was not applicable. Used general knowledge.")
        clean_answer = re.sub(r"\[SOURCE:\s*GENERAL\]", "", raw_answer, flags=re.IGNORECASE).strip()
        citations = []
        chunks_used = 0
        source_type = "general_knowledge"
    else:
        logger.info("LLM answered using documentation context.")
        clean_answer = re.sub(r"\[SOURCE:\s*DOCUMENT\]", "", raw_answer, flags=re.IGNORECASE).strip()
        for chunk in top_chunks:
            if "score" not in chunk:
                chunk["score"] = chunk.get("rerank_score", 0)
        citations = format_citations(top_chunks)
        chunks_used = len(top_chunks)
        source_type = "knowledge_base"

    return {
        "answer": clean_answer,
        "citations": citations,
        "chunks_used": chunks_used,
        "source_type": source_type,
    }


# ---------- Streaming Prompts (no [SOURCE:] markers needed) ----------
RAG_STREAM_PROMPT = ChatPromptTemplate.from_template("""
You are an IT Helpdesk AI Assistant with access to internal company documentation.

DOCUMENT CONTEXT:
{context}

EMPLOYEE QUESTION: {question}

Answer clearly and helpfully based on the document context. Use bullet points for steps.
Keep your answer concise and actionable.

Answer:
""")

GENERAL_STREAM_PROMPT = ChatPromptTemplate.from_template("""
You are a helpful IT Helpdesk AI Assistant (like ChatGPT).
Answer the following question clearly, helpfully, and concisely.
For technical questions, provide structured, practical guidance.

Question: {question}

Answer:
""")


# ---------- Ask Stream ----------
def ask_stream(question: str):
    """
    Streaming version of ask().
    Yields JSON-serializable dicts for Server-Sent Events:
      {"type": "status",    "message": "..."}
      {"type": "chunk",     "content": "..."}
      {"type": "citations", "citations": [...], "source_type": "..."}
      {"type": "done"}
      {"type": "error",     "message": "..."}
    """
    import json

    logger.info(f"[Stream] Question: {question}")

    try:
        # Phase 1: retrieval (this is the slow part — send status first)
        yield json.dumps({"type": "status", "message": "🔍 Searching knowledge base..."})

        top_chunks = retrieve_and_rerank(question)

        if not top_chunks:
            prompt  = GENERAL_STREAM_PROMPT
            params  = {"question": question}
            meta    = {"citations": [], "chunks_used": 0, "source_type": "general_knowledge"}
            yield json.dumps({"type": "status", "message": "💬 Generating response..."})
        else:
            context = build_context(top_chunks)
            prompt  = RAG_STREAM_PROMPT
            params  = {"context": context, "question": question}
            for chunk in top_chunks:
                if "score" not in chunk:
                    chunk["score"] = chunk.get("rerank_score", 0)
            citations_data = [c for c in format_citations(top_chunks)]
            meta = {
                "citations": citations_data,
                "chunks_used": len(top_chunks),
                "source_type": "knowledge_base",
            }
            yield json.dumps({"type": "status", "message": "📄 Found relevant docs — generating answer..."})

        # Phase 2: stream LLM response token by token
        llm = ChatGroq(
            api_key=settings.GROQ_API_KEY,
            model="openai/gpt-oss-20b",
            temperature=0.2,
            max_tokens=800,
            streaming=True,
        )

        chain = prompt | llm
        for chunk in chain.stream(params):
            token = chunk.content
            if token:
                yield json.dumps({"type": "chunk", "content": token})

        # Phase 3: send metadata (citations etc.)
        yield json.dumps({"type": "citations", **meta})
        yield json.dumps({"type": "done"})
        logger.info("[Stream] Complete ✅")

    except Exception as e:
        logger.exception("[Stream] Error")
        yield json.dumps({"type": "error", "message": str(e)})