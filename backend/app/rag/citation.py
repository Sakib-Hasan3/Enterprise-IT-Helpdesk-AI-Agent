from app.utils.logger import get_logger

logger = get_logger("rag.citation")

def format_citations(chunks: list[dict]) -> list[dict]:
    """
    Chunk থেকে unique source + page বের করে clean citation বানায়।
    """
    seen = set()
    citations = []
    
    for c in chunks:
        key = (c["source"], c["page"])
        if key in seen:
            continue
        seen.add(key)
        
        citations.append({
            "file": c["source"],
            "page": c["page"],
            "snippet": c["text"][:150].replace("\n", " ").strip() + "...",
            "relevance": round(c.get("rerank_score", c.get("score", 0)), 3),
        })
    
    return citations


def build_context(chunks: list[dict]) -> str:
    """
    LLM-এ পাঠানোর জন্য context string বানায়।
    প্রতিটা chunk-এ source tag থাকে।
    """
    parts = []
    for i, c in enumerate(chunks, start=1):
        parts.append(
            f"[Source {i}: {c['source']}, Page {c['page']}]\n{c['text']}"
        )
    return "\n\n---\n\n".join(parts)