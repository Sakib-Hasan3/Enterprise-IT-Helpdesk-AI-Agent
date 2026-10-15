import uuid
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance, VectorParams, PointStruct
)
from app.config import settings
from app.utils.logger import get_logger

logger = get_logger("rag.vector_store")

VECTOR_SIZE = 1024 

_client = None

def get_client() -> QdrantClient:
    global _client
    if _client is None:
        _client = QdrantClient(url=settings.QDRANT_URL)
    return _client

def ensure_collection():
    """Collection না থাকলে বানায়"""
    client = get_client()
    collections = [c.name for c in client.get_collections().collections]
    
    if settings.QDRANT_COLLECTION not in collections:
        logger.info(f"Creating collection: {settings.QDRANT_COLLECTION}")
        client.create_collection(
            collection_name=settings.QDRANT_COLLECTION,
            vectors_config=VectorParams(
                size=VECTOR_SIZE,
                distance=Distance.COSINE,
            ),
        )
    else:
        logger.info(f"Collection exists: {settings.QDRANT_COLLECTION}")

def upsert_chunks(chunks: list[dict], embeddings: list[list[float]]):
    """chunks + embeddings → Qdrant-এ save"""
    client = get_client()
    ensure_collection()
    
    points = []
    for chunk, emb in zip(chunks, embeddings):
        point_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{chunk['source']}_{chunk['page']}_{chunk['chunk_index']}"))
        points.append(PointStruct(
            id=point_id,
            vector=emb,
            payload={
                "text": chunk["text"],
                "page": chunk["page"],
                "source": chunk["source"],
                "chunk_index": chunk["chunk_index"],
            }
        ))
    
    client.upsert(
        collection_name=settings.QDRANT_COLLECTION,
        points=points,
    )
    logger.info(f"Upserted {len(points)} points to Qdrant")

def search(query_vector: list[float], top_k: int = 5) -> list[dict]:
    """Question vector → top similar chunks"""
    client = get_client()
    
    results = client.search(
        collection_name=settings.QDRANT_COLLECTION,
        query_vector=query_vector,
        limit=top_k,
    )
    
    return [
        {
            "text": hit.payload["text"],
            "page": hit.payload["page"],
            "source": hit.payload["source"],
            "score": hit.score,
        }
        for hit in results
    ]