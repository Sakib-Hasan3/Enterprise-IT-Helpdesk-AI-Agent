from pydantic_settings import BaseSettings
from pathlib import Path

class Settings(BaseSettings):
    # LLM
    GROQ_API_KEY: str
    
    # Vector DB
    QDRANT_URL: str = "http://localhost:6333"
    QDRANT_COLLECTION: str = "it_helpdesk_docs"
    
    # Embedding
    EMBEDDING_MODEL: str = "BAAI/bge-m3"
    
    # Chunking
    CHUNK_SIZE: int = 500
    CHUNK_OVERLAP: int = 50
    
    # App
    APP_ENV: str = "development"
    LOG_LEVEL: str = "INFO"
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DOCS_DIR = DATA_DIR / "docs"
DOCS_DIR.mkdir(parents=True, exist_ok=True)