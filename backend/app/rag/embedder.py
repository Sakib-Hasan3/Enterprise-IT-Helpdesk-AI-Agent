from sentence_transformers import SentenceTransformer
from app.config import settings
from app.utils.logger import get_logger

logger = get_logger("rag.embedder")

_model = None

def get_model():
    """Model একবার load, বারবার use (singleton pattern)"""
    global _model
    if _model is None:
        logger.info(f"Loading embedding model: {settings.EMBEDDING_MODEL}")
        _model = SentenceTransformer(settings.EMBEDDING_MODEL)
        logger.info("Embedding model loaded")
    return _model

def embed_texts(texts: list[str]) -> list[list[float]]:
    """একগুচ্ছ text → একগুচ্ছ vector"""
    model = get_model()
    embeddings = model.encode(
        texts,
        batch_size=16,
        show_progress_bar=True,
        normalize_embeddings=True, 
    )
    return embeddings.tolist()

def embed_query(query: str) -> list[float]:
    """একটা question → একটা vector"""
    model = get_model()
    embedding = model.encode(query, normalize_embeddings=True)
    return embedding.tolist()