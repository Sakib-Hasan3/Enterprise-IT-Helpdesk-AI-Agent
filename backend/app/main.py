from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import chat, health, documents
from app.api.auth_router import router as auth_router
from app.utils.logger import get_logger

logger = get_logger("main")

app = FastAPI(
    title="Enterprise IT Helpdesk AI",
    description="RAG-powered IT helpdesk assistant with JWT auth & streaming",
    version="0.2.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:80"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_router, prefix="/api")       # public  — login
app.include_router(health.router, prefix="/api")     # public  — health check
app.include_router(chat.router, prefix="/api")       # protected — chat + stream
app.include_router(documents.router, prefix="/api")  # protected — doc management


@app.on_event("startup")
def startup():
    logger.info("🚀 Enterprise IT Helpdesk AI v0.2.0 starting...")
    logger.info("📖 Docs: http://localhost:8000/docs")
    logger.info("🔐 Auth: POST /api/auth/login")
    logger.info("⚡ Stream: POST /api/chat/stream")


@app.on_event("shutdown")
def shutdown():
    logger.info("👋 Shutting down...")


@app.get("/")
def root():
    return {
        "name": "Enterprise IT Helpdesk AI",
        "version": "0.2.0",
        "docs": "/docs",
        "health": "/api/health",
        "login": "/api/auth/login",
    }