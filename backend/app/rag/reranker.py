from FlagEmbedding import FlagReranker
from app.utils.logger import get_logger

logger = get_logger("rag.reranker")

_reranker = None
# bge-reranker-base: ~3x faster than v2-m3 on CPU, still high quality
RERANKER_MODEL = "BAAI/bge-reranker-base"

def get_reranker():
    """Reranker model একবার load করে reuse করব (singleton)"""
    global _reranker
    if _reranker is None:
        logger.info(f"Loading reranker: {RERANKER_MODEL}")
        _reranker = FlagReranker(RERANKER_MODEL, use_fp16=True)
        logger.info("Reranker loaded")
    return _reranker

def rerank(query: str, candidates: list[dict], top_k: int = 5) -> list[dict]:
    """
    query + প্রতিটা candidate এর text pair বানিয়ে reranker কে দিই।
    Reranker একটা score দেয় (question আর chunk কতটা related)।
    Top k বেছে নিই।
    """
    if not candidates:
        return []
    
    reranker = get_reranker()

    pairs = [[query, c["text"]] for c in candidates]
    scores = reranker.compute_score(pairs, normalize=True)
    
    for c, s in zip(candidates, scores):
        c["rerank_score"] = float(s)
    reranked = sorted(candidates, key=lambda x: x["rerank_score"], reverse=True)
    
    logger.info(
        f"Reranked {len(candidates)} → top {top_k}. "
        f"Best score: {reranked[0]['rerank_score']:.3f}"
    )
    
    return reranked[:top_k]