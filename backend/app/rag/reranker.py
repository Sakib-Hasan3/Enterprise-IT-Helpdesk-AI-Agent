try:
    import torch
    from FlagEmbedding import FlagReranker
    _FLAG_EMBEDDING_AVAILABLE = True
except ImportError:
    _FLAG_EMBEDDING_AVAILABLE = False

from app.utils.logger import get_logger

logger = get_logger("rag.reranker")

_reranker = None
RERANKER_MODEL = "BAAI/bge-reranker-v2-m3"

def get_reranker():
    """Reranker model একবার load করে reuse করব (singleton)"""
    global _reranker
    if not _FLAG_EMBEDDING_AVAILABLE:
        logger.warning("FlagEmbedding not installed — reranking disabled, using original scores.")
        return None
    if _reranker is None:
        logger.info(f"Loading reranker: {RERANKER_MODEL}")
        _reranker = FlagReranker(RERANKER_MODEL, use_fp16=torch.cuda.is_available())
        logger.info("Reranker loaded")
    return _reranker

def rerank(query: str, candidates: list[dict], top_k: int = 5) -> list[dict]:
    """
    query + প্রতিটা candidate এর text pair বানিয়ে reranker কে দিই।
    Reranker একটা score দেয় (question আর chunk কতটা related)।
    Top k বেছে নিই।
    FlagEmbedding না থাকলে original order-এ top_k return করে।
    """
    if not candidates:
        return []

    reranker = get_reranker()

    # Graceful fallback: no reranker available
    if reranker is None:
        return candidates[:top_k]

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