from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from app.schemas import ChatRequest, ChatResponse, Citation
from app.rag.pipeline import ask, ask_stream
from app.auth.jwt import get_current_user
from app.utils.logger import get_logger

logger = get_logger("api.chat")
router = APIRouter(tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest, _: dict = Depends(get_current_user)):
    """RAG pipeline — full response (non-streaming fallback)."""
    logger.info(f"Chat request: {req.question[:60]}...")
    try:
        result = ask(req.question)
    except Exception as e:
        logger.exception("Chat failed")
        raise HTTPException(status_code=500, detail=f"RAG failed: {str(e)}")

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


@router.post("/chat/stream")
def chat_stream(req: ChatRequest, _: dict = Depends(get_current_user)):
    """
    Streaming SSE endpoint — yields Server-Sent Events word by word.
    Events: status | chunk | citations | done | error
    """
    logger.info(f"[Stream] request: {req.question[:60]}...")

    def generate():
        for event_json in ask_stream(req.question):
            yield f"data: {event_json}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",       # disable nginx buffering
            "Connection": "keep-alive",
        },
    )