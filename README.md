
<div align="center">

# 🤖 Enterprise IT Helpdesk AI Agent

### A Production-Grade RAG-Powered IT Support Copilot

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Qdrant](https://img.shields.io/badge/Qdrant-Vector_DB-DC382D?logo=qdrant&logoColor=white)](https://qdrant.tech)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://docker.com)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

An intelligent, enterprise-grade AI assistant that answers IT support questions using **Retrieval-Augmented Generation (RAG)**. It searches through your company's internal PDF documentation, retrieves the most relevant information, and generates accurate, context-aware answers — with source citations. When no relevant docs are found, it seamlessly falls back to general AI knowledge (like ChatGPT).

</div>

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🔍 **RAG Pipeline** | Two-stage retrieval: vector similarity search → cross-encoder reranking for maximum accuracy |
| 🧠 **Dual-Mode AI** | Answers from internal docs when relevant, falls back to general knowledge (ChatGPT mode) when not |
| ⚡ **Real-Time Streaming** | Server-Sent Events (SSE) stream responses token-by-token for instant feedback |
| 📄 **PDF Knowledge Base** | Upload and ingest PDF documents — automatically chunked, embedded, and indexed |
| 📎 **Source Citations** | Every document-based answer includes clickable citations with file name, page number, and relevance score |
| 🔐 **JWT Authentication** | Secure login with Bearer token auth on all protected endpoints |
| 🛡️ **3-Tier LLM Fallback** | Automatic failover across 3 LLM models for maximum uptime |
| 🐳 **Docker Compose** | One-command deployment with Qdrant + Backend + Frontend orchestration |
| 🎨 **Modern UI** | Clean, responsive React 19 interface with Tailwind CSS, dark sidebar, and smooth animations |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React 19 + TypeScript)             │
│                                                                     │
│   LoginPage ──→ ChatWindow ──→ MessageBubble ──→ CitationList      │
│       │              │                                              │
│   useAuth()      useChat()                                         │
│       │              │                                              │
│   POST /auth    SSE /chat/stream  ←── fetch() with Bearer token    │
└───────┬──────────────┬─────────────────────────────────────────────┘
        │              │
        ▼              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     BACKEND (FastAPI + Python 3.11)                  │
│                                                                     │
│   ┌──────────┐  ┌──────────────────────────────────────────────┐   │
│   │ Auth     │  │           RAG Pipeline                        │   │
│   │ (JWT)    │  │                                               │   │
│   │          │  │  Question                                     │   │
│   │ /login   │  │     │                                         │   │
│   │ /verify  │  │     ▼                                         │   │
│   └──────────┘  │  ┌──────────┐    ┌────────────┐              │   │
│                 │  │ BGE-M3   │───→│  Qdrant    │              │   │
│                 │  │ Embedder │    │  Vector DB │              │   │
│                 │  └──────────┘    └─────┬──────┘              │   │
│                 │                        │ Top 8 candidates     │   │
│                 │                        ▼                      │   │
│                 │               ┌────────────────┐             │   │
│                 │               │ BGE-Reranker   │             │   │
│                 │               │ (Cross-Encoder)│             │   │
│                 │               └───────┬────────┘             │   │
│                 │                       │ Top 3 reranked        │   │
│                 │                       ▼                      │   │
│                 │  ┌─────────────────────────────────────┐     │   │
│                 │  │  LLM (3-Tier Fallback via Groq)     │     │   │
│                 │  │  T1: gpt-oss-20b (fast)             │     │   │
│                 │  │  T2: qwen3.8-27b (capable)          │     │   │
│                 │  │  T3: gpt-oss-120b (powerful)        │     │   │
│                 │  └──────────────┬──────────────────────┘     │   │
│                 │                 │                             │   │
│                 │                 ▼                             │   │
│                 │  Answer + Citations (SSE Stream)              │   │
│                 └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────┐
│   Qdrant        │
│   Vector DB     │
│   Port: 6333    │
│   195 vectors   │
│   1024-dim      │
│   Cosine dist.  │
└─────────────────┘
```

---

## 🔄 How the RAG Pipeline Works

The system uses a sophisticated **two-stage retrieval** process:

### 1. Document Ingestion (One-Time)

```
PDF Upload → Page Extraction (pypdf) → Chunking (500 chars, 50 overlap)
    → BGE-M3 Embedding (1024-dim vectors) → Store in Qdrant
```

### 2. Query Processing (Per Question)

```
User Question
    │
    ├─→ Step 1: Embed query with BGE-M3
    │
    ├─→ Step 2: Vector similarity search in Qdrant (top 8 candidates)
    │
    ├─→ Step 3: Cross-encoder reranking with BGE-Reranker-v2-m3 (top 3)
    │
    ├─→ Step 4: Relevance threshold check (score ≥ 0.01)
    │       │
    │       ├─ YES → Build context from chunks → RAG Prompt → LLM → Answer with citations
    │       │
    │       └─ NO  → General knowledge prompt → LLM → Answer without citations (ChatGPT mode)
    │
    └─→ Step 5: Stream response token-by-token via SSE
```

### 3. Smart Source Detection

The LLM itself determines whether the retrieved documents actually answer the question. Even if chunks are retrieved, if the LLM decides the context is irrelevant, it appends `[SOURCE: GENERAL]` and the system strips citations — ensuring the user never sees misleading references.

---

## 🛠️ Tech Stack

### Backend

| Technology | Purpose |
|------------|---------|
| **FastAPI** | High-performance async REST API framework |
| **BAAI/bge-m3** | State-of-the-art multilingual embedding model (1024-dim) |
| **BAAI/bge-reranker-v2-m3** | Cross-encoder reranker for precision retrieval |
| **Qdrant** | High-performance vector database with cosine similarity |
| **LangChain** | LLM orchestration, prompt templates, and chain composition |
| **Groq Cloud** | Ultra-fast LLM inference (3-tier failover) |
| **PyPDF** | PDF text extraction |
| **python-jose** | JWT token creation and verification |
| **Pydantic** | Request/response validation and settings management |

### Frontend

| Technology | Purpose |
|------------|---------|
| **React 19** | Modern UI with hooks and functional components |
| **TypeScript** | Type-safe development |
| **Tailwind CSS** | Utility-first responsive styling |
| **Vite** | Lightning-fast build tool and dev server |
| **Axios** | HTTP client with JWT interceptors |
| **react-markdown** | Render markdown-formatted AI responses |

### Infrastructure

| Technology | Purpose |
|------------|---------|
| **Docker** | Containerized deployment |
| **Docker Compose** | Multi-service orchestration (Qdrant + Backend + Frontend) |

---

## 📁 Project Structure

```
Enterprise-IT-Helpdesk-AI-Agent/
│
├── backend/                          # FastAPI Backend
│   ├── app/
│   │   ├── main.py                   # App entry point, CORS, router registration
│   │   ├── config.py                 # Pydantic settings (env vars)
│   │   ├── schemas.py                # Request/response models
│   │   │
│   │   ├── api/                      # API Endpoints
│   │   │   ├── auth_router.py        # POST /auth/login, GET /auth/me
│   │   │   ├── chat.py               # POST /chat, POST /chat/stream (SSE)
│   │   │   ├── documents.py          # GET /documents, POST /ingest
│   │   │   └── health.py             # GET /health
│   │   │
│   │   ├── auth/                     # Authentication
│   │   │   └── jwt.py                # JWT create/verify, credential check
│   │   │
│   │   ├── rag/                      # RAG Pipeline (core intelligence)
│   │   │   ├── pipeline.py           # Main orchestrator (ask, ask_stream, ingest)
│   │   │   ├── loader.py             # PDF → page text extraction
│   │   │   ├── chunker.py            # Text → overlapping chunks (500/50)
│   │   │   ├── embedder.py           # Text → 1024-dim vectors (BGE-M3)
│   │   │   ├── vector_store.py       # Qdrant CRUD operations
│   │   │   ├── reranker.py           # Cross-encoder reranking (BGE-Reranker)
│   │   │   └── citation.py           # Citation formatting & context building
│   │   │
│   │   └── utils/
│   │       └── logger.py             # Structured logging
│   │
│   ├── data/docs/                    # PDF knowledge base (7 IT guides)
│   ├── Dockerfile                    # Multi-stage Python 3.11 container
│   ├── requirements.txt              # Python dependencies
│   └── .env                          # Environment variables (API keys, secrets)
│
├── frontend/                         # React 19 Frontend
│   ├── src/
│   │   ├── App.tsx                   # Main app with auth routing
│   │   ├── api/
│   │   │   └── client.ts             # Axios + fetch SSE client with JWT
│   │   ├── components/
│   │   │   ├── LoginPage.tsx         # Authentication UI
│   │   │   ├── ChatWindow.tsx        # Message list with auto-scroll
│   │   │   ├── ChatInput.tsx         # Message input with send button
│   │   │   ├── MessageBubble.tsx     # User/AI message rendering (markdown)
│   │   │   ├── CitationList.tsx      # Expandable source citations
│   │   │   ├── Header.tsx             # Top bar with controls
│   │   │   ├── Sidebar.tsx            # Quick prompts & navigation
│   │   │   ├── TypingIndicator.tsx    # Loading animation
│   │   │   └── Icons.tsx              # SVG icon components
│   │   ├── hooks/
│   │   │   ├── useAuth.ts            # Auth state management
│   │   │   └── useChat.ts            # Chat state, streaming, persistence
│   │   └── types/
│   │       └── chat.ts               # TypeScript interfaces
│   │
│   ├── Dockerfile                    # Node.js Alpine container
│   ├── package.json                  # NPM dependencies
│   └── tailwind.config.js            # Tailwind CSS configuration
│
├── documentation/                    # Detailed project documentation
│   ├── 01_project_overview.md
│   ├── 02_how_rag_works.md
│   ├── 03_backend_files.md
│   ├── 04_frontend_files.md
│   ├── 05_data_flow_diagram.md
│   ├── 06_tech_stack.md
│   └── 07_how_to_run.md
│
├── qdrant_storage/                   # Qdrant persistent data (auto-generated)
├── docker-compose.yml                # Full stack orchestration
├── run.sh                            # One-command startup script
└── README.md                         # ← You are here
```

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.11+** with `pip`
- **Node.js 20+** with `npm`
- **Docker** (for Qdrant vector database)
- **Groq API Key** — Get one free at [console.groq.com](https://console.groq.com)

### Option 1: Run with Docker Compose (Recommended)

```bash
# Clone the repository
git clone https://github.com/Sakib-Hasan3/Enterprise-IT-Helpdesk-AI-Agent.git
cd Enterprise-IT-Helpdesk-AI-Agent

# Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env and add your GROQ_API_KEY

# Start all services
docker compose up -d
```

This starts 3 containers:

| Container | Port | Description |
|-----------|------|-------------|
| `it-helpdesk-qdrant` | 6333 | Qdrant Vector Database |
| `it-helpdesk-backend` | 8000 | FastAPI Backend |
| `it-helpdesk-frontend` | 5173 | React Frontend |

### Option 2: Run Locally (Development)

#### Step 1 — Start Qdrant

```bash
docker run -d -p 6333:6333 -v $(pwd)/qdrant_storage:/qdrant/storage:z qdrant/qdrant
```

#### Step 2 — Start the Backend

```bash
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate        # Linux/macOS
# .\venv\Scripts\activate       # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env and add your GROQ_API_KEY

# Start the server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

> ⏳ First startup takes ~30 seconds to load BGE-M3 (embedding) and BGE-Reranker (cross-encoder) models.

#### Step 3 — Start the Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

#### Step 4 — Open the App

```
🌐 Frontend:     http://localhost:5173
📖 API Docs:     http://localhost:8000/docs
🗄️ Qdrant UI:    http://localhost:6333/dashboard
```

### Default Login Credentials

```
Username: admin
Password: ithelpdeskAdmin123
```

---

## 📡 API Reference

All endpoints are prefixed with `/api`. Protected endpoints require a `Bearer` token.

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/login` | ❌ | Login with username/password → JWT token |
| `GET` | `/api/auth/me` | ✅ | Get current authenticated user info |

### Chat

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/chat` | ✅ | Send question → full response (non-streaming) |
| `POST` | `/api/chat/stream` | ✅ | Send question → SSE streaming response |

### Documents

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/documents` | ❌ | List all ingested PDF documents |
| `POST` | `/api/ingest` | ❌ | Upload and ingest a new PDF (max 20MB) |

### System

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/health` | ❌ | System health check (Qdrant, LLM status) |

### Example: Login + Chat Stream

```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"ithelpdeskAdmin123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

# 2. Stream a question
curl -N -X POST http://localhost:8000/api/chat/stream \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"question":"How do I reset my VPN password?"}'
```

### SSE Stream Event Types

```jsonc
{"type": "status",    "message": "🔍 Searching knowledge base..."}
{"type": "status",    "message": "📄 Found relevant docs — generating answer..."}
{"type": "chunk",     "content": "To reset your VPN password, "}
{"type": "chunk",     "content": "follow these steps:\n\n"}
{"type": "citations", "citations": [...], "source_type": "knowledge_base", "chunks_used": 3}
{"type": "done"}
```

---

## 📚 Knowledge Base

The system ships with **7 pre-indexed IT support PDF guides** covering common enterprise IT scenarios:

| Document | Topic |
|----------|-------|
| `hardware_troubleshooting_guide.pdf` | Hardware diagnosis & repair procedures |
| `software_applications_guide.pdf` | Software installation & troubleshooting |
| `network_connectivity_guide.pdf` | Network, Wi-Fi, and VPN issues |
| `security_password_access_guide.pdf` | Password resets, MFA, and access control |
| `email_collaboration_guide.pdf` | Email, calendar, and collaboration tools |
| `it_onboarding_offboarding_guide.pdf` | Employee onboarding/offboarding IT setup |
| `itsm_itsm_guide.pdf` | IT Service Management processes |

### Adding Your Own Documents

Upload PDFs through the API:

```bash
curl -X POST http://localhost:8000/api/ingest \
  -F "file=@/path/to/your/document.pdf"
```

The system will automatically:

1. Extract text from all pages
2. Split into 500-character chunks (50-char overlap)
3. Generate BGE-M3 embeddings (1024-dim)
4. Store vectors in Qdrant for instant retrieval

---

## ⚙️ Environment Variables

Create a `backend/.env` file:

```env
# Required — LLM API Key
GROQ_API_KEY="your-groq-api-key-here"

# Optional — Google Gemini fallback
GOOGLE_API_KEY=""

# Qdrant Vector Database
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION=it_helpdesk_docs

# Authentication
JWT_SECRET="your-super-secret-jwt-key"
ADMIN_USERNAME=admin
ADMIN_PASSWORD=ithelpdeskAdmin123

# Application
APP_ENV=development
LOG_LEVEL=INFO

# Embedding model cache (set to 1 for offline mode after first download)
HF_HUB_OFFLINE=1
```

Create a `frontend/.env` file:

```env
VITE_API_URL=http://localhost:8000/api
```

---

## 📖 Documentation

Detailed documentation is available in the [`documentation/`](./documentation/) directory:

| Doc | Description |
|-----|-------------|
| [01 — Project Overview](./documentation/01_project_overview.md) | High-level architecture and design decisions |
| [02 — How RAG Works](./documentation/02_how_rag_works.md) | Deep dive into the RAG pipeline, chunking, and reranking |
| [03 — Backend Files](./documentation/03_backend_files.md) | Line-by-line breakdown of every backend Python file |
| [04 — Frontend Files](./documentation/04_frontend_files.md) | React components, custom hooks, and UI architecture |
| [05 — Data Flow Diagram](./documentation/05_data_flow_diagram.md) | Visual data flow from user query to AI response |
| [06 — Tech Stack](./documentation/06_tech_stack.md) | Detailed technology choices and rationale |
| [07 — How to Run](./documentation/07_how_to_run.md) | Step-by-step deployment guide |

---

## 🧪 Testing

```bash
# Backend health check
curl http://localhost:8000/api/health

# Run backend tests
cd backend
source venv/bin/activate
python test_pipeline.py

# Frontend lint
cd frontend
npm run lint
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing-feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">

**Built with ❤️ by [Sakib Hasan](https://github.com/Sakib-Hasan3)**

⭐ **Star this repo** if you found it useful!

</div>
