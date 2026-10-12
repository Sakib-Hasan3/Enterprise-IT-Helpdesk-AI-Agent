from pydantic import BaseModel, Field

class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=500, description="User's IT question")
    
class Citation(BaseModel):
    file: str
    page: int
    snippet: str
    relevance: float

class ChatResponse(BaseModel):
    answer: str
    citations: list[Citation] = []
    chunks_used: int = 0
    source_type: str = "knowledge_base"

class HealthResponse(BaseModel):
    status: str          
    qdrant: str        
    llm: str           
    version: str

class DocumentInfo(BaseModel):
    id: str
    name: str
    chunks: int

class DocumentListResponse(BaseModel):
    total: int
    documents: list[DocumentInfo]

class IngestResponse(BaseModel):
    message: str
    filename: str
    chunks_added: int

class ErrorResponse(BaseModel):
    detail: str