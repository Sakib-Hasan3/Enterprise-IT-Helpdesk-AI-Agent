from pydantic_settings import BaseSettings
from pathlib import Path

class Settings(BaseSettings):
    GROQ_API_KEY: str
    GOOGLE_API_KEY: str = ""  # Optional — Gemini Flash fallback

    QDRANT_URL: str = "http://localhost:6333"
    QDRANT_COLLECTION: str = "it_helpdesk_docs"
    
    EMBEDDING_MODEL: str = "BAAI/bge-m3"
    
    CHUNK_SIZE: int = 500
    CHUNK_OVERLAP: int = 50
    
    APP_ENV: str = "development"
    LOG_LEVEL: str = "INFO"
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DOCS_DIR = DATA_DIR / "docs"
DOCS_DIR.mkdir(parents=True, exist_ok=True)