from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import chat, health, documents
from app.utils.logger import get_logger

logger = get_logger("main")

app = FastAPI(
    title="Enterprise IT Helpdesk AI",
    description="RAG-powered IT helpdesk assistant for employees",
    version="0.1.0",
)

# CORS — React frontend পরে call করবে
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # React dev ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(health.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(documents.router, prefix="/api")


@app.on_event("startup")
def startup():
    logger.info("🚀 Enterprise IT Helpdesk AI starting...")
    logger.info("📖 Docs: http://localhost:8000/docs")


@app.on_event("shutdown")
def shutdown():
    logger.info("👋 Shutting down...")


@app.get("/")
def root():
    return {
        "name": "Enterprise IT Helpdesk AI",
        "docs": "/docs",
        "health": "/api/health",
    }