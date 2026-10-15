# 07 — How to Run: Project কীভাবে চালাবে

> দুটো উপায়ে চালানো যায়: Docker (সহজ) বা Manual (development-এর জন্য)।

---

## 🐳 Method 1: Docker Compose (Recommended — সবচেয়ে সহজ)

### Prerequisites (আগে যা লাগবে)
- [Docker](https://docs.docker.com/get-docker/) installed
- [Docker Compose](https://docs.docker.com/compose/install/) installed
- Groq API Key ([groq.com](https://console.groq.com) — free)
- (Optional) Google Gemini API Key ([aistudio.google.com](https://aistudio.google.com))

### Step 1: API Key Setup

```bash
# backend/.env ফাইল তৈরি করো
cd /path/to/it-helpdesk-ai/backend
cp .env.example .env  # যদি .env.example থাকে
# অথবা manually তৈরি করো:
nano .env
```

`.env` ফাইলের content:
```env
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
GOOGLE_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxx   # Optional
JWT_SECRET=your-super-secret-key-change-this
ADMIN_USERNAME=admin
ADMIN_PASSWORD=ithelpdeskAdmin123
```

### Step 2: Start করো

```bash
cd /path/to/it-helpdesk-ai
docker compose up --build
```

প্রথমবার চালালে কিছু সময় লাগবে (Docker images download হবে)।

### Step 3: Access করো

```
Frontend:  http://localhost:5173
Backend:   http://localhost:8000
API Docs:  http://localhost:8000/docs
Qdrant UI: http://localhost:6333/dashboard
```

### Step 4: Login করো
```
Username: admin
Password: ithelpdeskAdmin123
```

### Step 5: PDF Upload করো (Optional)
```bash
# Backend container-এ document ingest করতে
curl -X POST "http://localhost:8000/api/ingest" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -F "file=@your_document.pdf"

# অথবা Swagger UI (/docs) দিয়ে visually করো
```

### Docker Commands (useful)

```bash
# Background-এ চালাতে (-d flag)
docker compose up -d --build

# Log দেখতে
docker compose logs -f backend
docker compose logs -f frontend

# Stop করতে
docker compose down

# সব data মুছে restart করতে
docker compose down -v
docker compose up --build
```

---

## 🛠️ Method 2: Manual Setup (Development)

### Backend Setup

```bash
# 1. Backend folder-এ যাও
cd it-helpdesk-ai/backend

# 2. Virtual environment তৈরি করো
python3 -m venv venv
source venv/bin/activate    # Linux/Mac
# venv\Scripts\activate     # Windows

# 3. Dependencies install করো
pip install -r requirements.txt

# 4. .env ফাইল তৈরি করো
cp .env.example .env       # তারপর API key দাও
# nano .env

# 5. Qdrant start করো (Docker দিয়ে শুধু DB চালাও)
docker run -p 6333:6333 -p 6334:6334 qdrant/qdrant

# 6. Backend server চালাও
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
# নতুন terminal-এ
cd it-helpdesk-ai/frontend

# Dependencies install করো
npm install

# .env ফাইল (API URL set করো)
echo "VITE_API_URL=http://localhost:8000/api" > .env

# Dev server চালাও
npm run dev
```

এখন browser-এ `http://localhost:5173` খুলো।

---

## 📄 PDF Document Ingest করা

### Option A: Swagger UI দিয়ে (সহজ)

1. `http://localhost:8000/docs` খুলো
2. প্রথমে `POST /api/auth/login` করো → token পাবে
3. "Authorize" button-এ token paste করো
4. `POST /api/ingest` → PDF file choose করে Execute

### Option B: cURL দিয়ে

```bash
# প্রথমে login করে token নাও
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "ithelpdeskAdmin123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

# PDF upload করো
curl -X POST http://localhost:8000/api/ingest \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/your/document.pdf"
```

### Option C: Script দিয়ে (Backend-এর ভেতর থেকে)

```bash
# Backend এ directly PDF থেকে ingest করতে
cd backend
python -c "
from app.rag.pipeline import ingest_pdf
ingest_pdf('data/docs/your_document.pdf')
print('Done!')
"
```

---

## 🔧 Environment Variables Reference

### Backend `.env`

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GROQ_API_KEY` | ✅ Yes | — | Groq API key (groq.com থেকে) |
| `GOOGLE_API_KEY` | ⚠️ Optional | "" | Gemini fallback-এর জন্য |
| `JWT_SECRET` | ✅ Yes | change-me... | Token signing secret (random string দাও) |
| `ADMIN_USERNAME` | ✅ Yes | admin | Login username |
| `ADMIN_PASSWORD` | ✅ Yes | ithelpdeskAdmin123 | Login password |
| `QDRANT_URL` | ✅ Yes | http://localhost:6333 | Qdrant address |
| `QDRANT_COLLECTION` | No | it_helpdesk_docs | Collection name |
| `EMBEDDING_MODEL` | No | BAAI/bge-m3 | Hugging Face model |
| `CHUNK_SIZE` | No | 500 | Characters per chunk |
| `CHUNK_OVERLAP` | No | 50 | Overlap between chunks |

### Frontend `.env`

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | No | http://localhost:8000/api | Backend URL |

---

## 🐛 Common Issues & Solutions

### Issue: "Connection refused" error
```
✅ Solution: Qdrant চালু আছে কিনা check করো
docker ps | grep qdrant
```

### Issue: "Invalid API key" from Groq
```
✅ Solution: .env file-এ GROQ_API_KEY সঠিক দাও
groq.com → API Keys → New Key তৈরি করো
```

### Issue: Embedding model download হচ্ছে না
```
✅ Solution: Internet connection check করো
First run-এ ~1GB download হবে (BAAI/bge-m3)
```

### Issue: Frontend blank screen
```
✅ Solution:
1. Backend চালু আছে কিনা: http://localhost:8000/api/health
2. .env এ VITE_API_URL সঠিক দেওয়া আছে কিনা
3. Browser console-এ error দেখো (F12)
```

### Issue: PDF ingest failed
```
✅ Solution:
1. PDF 20MB-এর বেশি না
2. PDF text-based (scanned image PDF কাজ করে না)
3. Backend log দেখো: docker compose logs backend
```

---

## 📊 API Endpoints Quick Reference

```
Public (no auth needed):
  GET  /                     → Project info
  GET  /api/health           → System status
  POST /api/auth/login       → Get JWT token

Protected (Bearer token দরকার):
  POST /api/chat             → Full answer (non-streaming)
  POST /api/chat/stream      → Streaming answer (SSE)
  GET  /api/documents        → List uploaded PDFs
  POST /api/ingest           → Upload & process new PDF
  GET  /api/auth/me          → Current user info
  
Documentation:
  GET  /docs                 → Swagger UI
  GET  /redoc                → ReDoc UI
```

---

## 🔍 Health Check

```bash
curl http://localhost:8000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "qdrant": "connected",
  "llm": "groq-available",
  "version": "0.2.0"
}
```

---

## 📁 Project Files যেগুলো Git-এ নেই (`.gitignore`)

```
backend/.env          ← API keys (NEVER commit করবে না!)
backend/venv/         ← Python virtual environment
backend/data/docs/    ← Uploaded PDF files
frontend/node_modules/ ← Node.js dependencies
qdrant_storage/       ← Database files
```

এগুলো প্রতিটি machine-এ আলাদাভাবে setup করতে হয়।
