#!/bin/bash
# ==============================================================================
# Enterprise IT Helpdesk AI — Unified Startup Script
# ==============================================================================

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "=================================================="
echo "🚀 Starting Enterprise IT Helpdesk AI Services"
echo "=================================================="

# 1. Check / Start Qdrant
if ! curl -s http://localhost:6333/healthz > /dev/null 2>&1; then
    echo "📦 Starting Qdrant container..."
    docker run -d -p 6333:6333 -v "$DIR/qdrant_storage":/qdrant/storage:z qdrant/qdrant
    sleep 2
else
    echo "✅ Qdrant is running on http://localhost:6333"
fi

# 2. Check / Start FastAPI Backend
if ! curl -s http://localhost:8000/api/health > /dev/null 2>&1; then
    echo "🐍 Starting Backend (FastAPI on port 8000)..."
    cd "$DIR/backend"
    source venv/bin/activate
    nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 > "$DIR/backend/backend.log" 2>&1 &
    echo "✅ Backend started (PID: $!)."
    cd "$DIR"
else
    echo "✅ Backend is running on http://localhost:8000"
fi

# 3. Check / Start React Frontend
if ! curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "⚛️  Starting Frontend (Vite on port 5173)..."
    cd "$DIR/frontend"
    nohup npm run dev -- --host 0.0.0.0 --port 5173 > "$DIR/frontend/frontend.log" 2>&1 &
    echo "✅ Frontend started (PID: $!)."
    cd "$DIR"
else
    echo "✅ Frontend is running on http://localhost:5173"
fi

echo ""
echo "=================================================="
echo "🎉 ALL SERVICES ARE LIVE & READY!"
echo "=================================================="
echo "🌐 Frontend App:    http://localhost:5173"
echo "📖 API Docs:        http://localhost:8000/docs"
echo "🗄️  Qdrant DB:       http://localhost:6333/dashboard"
echo ""
echo "🔑 Login Credentials:"
echo "   Username: admin"
echo "   Password: ithelpdeskAdmin123"
echo "=================================================="

