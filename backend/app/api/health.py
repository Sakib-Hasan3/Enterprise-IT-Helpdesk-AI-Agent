from fastapi import APIRouter
from app.schemas import HealthResponse
from app.config import settings
from app.rag.vector_store import get_client
from app.utils.logger import get_logger

logger = get_logger("api.health")
router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health_check():
    """System এর সব component alive কিনা চেক করে।"""
    
    # Qdrant check
    try:
        get_client().get_collections()
        qdrant_status = "up"
    except Exception as e:
        logger.error(f"Qdrant down: {e}")
        qdrant_status = "down"
    
    # LLM key check
    llm_status = "configured" if settings.GROQ_API_KEY else "missing"
    
    overall = "ok" if qdrant_status == "up" and llm_status == "configured" else "degraded"
    
    return HealthResponse(
        status=overall,
        qdrant=qdrant_status,
        llm=llm_status,
        version="0.1.0",
    )