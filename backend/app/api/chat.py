from fastapi import APIRouter, HTTPException
from app.schemas import ChatRequest, ChatResponse, Citation
from app.rag.pipeline import ask
from app.utils.logger import get_logger

logger = get_logger("api.chat")
router = APIRouter(tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    """
    Employee এর প্রশ্ন নিয়ে RAG pipeline চালায়, answer + citations দেয়।
    """
    logger.info(f"Chat request: {req.question[:60]}...")
    
    try:
        result = ask(req.question)
    except Exception as e:
        logger.exception("Chat failed")
        raise HTTPException(status_code=500, detail=f"RAG failed: {str(e)}")
    
    # Citation objects বানাও
    citations = [
        Citation(
            file=c["file"],
            page=c["page"],
            snippet=c["snippet"],
            relevance=c["relevance"],
        )
        for c in result.get("citations", [])
    ]
    
    return ChatResponse(
        answer=result["answer"],
        citations=citations,
        chunks_used=result.get("chunks_used", 0),
        source_type=result.get("source_type", "knowledge_base"),
    )