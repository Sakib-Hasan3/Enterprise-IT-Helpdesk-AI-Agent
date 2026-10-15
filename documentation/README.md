# 📚 Enterprise IT Helpdesk AI — সম্পূর্ণ Documentation

> **এই documentation পড়লে যেকোনো beginner এই project সম্পূর্ণ বুঝতে পারবে।**  
> Language: বাংলা + English (technical terms)

---

## 📖 Documentation Files (কোনটা কী?)

| # | ফাইল | বিষয় | কার জন্য |
|---|------|-------|---------|
| 1 | [01_project_overview.md](./01_project_overview.md) | Project কী, কেন তৈরি হয়েছে | সবার জন্য |
| 2 | [02_how_rag_works.md](./02_how_rag_works.md) | RAG concept সহজ ভাষায় | সবার জন্য |
| 3 | [03_backend_files.md](./03_backend_files.md) | Backend-এর প্রতিটি ফাইল ব্যাখ্যা | Developer |
| 4 | [04_frontend_files.md](./04_frontend_files.md) | Frontend-এর প্রতিটি ফাইল ব্যাখ্যা | Developer |
| 5 | [05_data_flow_diagram.md](./05_data_flow_diagram.md) | প্রশ্ন থেকে উত্তর পর্যন্ত flow | Developer |
| 6 | [06_tech_stack.md](./06_tech_stack.md) | কোন technology কেন use করা হয়েছে | Developer |
| 7 | [07_how_to_run.md](./07_how_to_run.md) | কীভাবে project চালাবে | সবার জন্য |

---

## ⚡ এক নজরে Project

```
এটা একটা AI-Powered IT Helpdesk Chatbot যেটা:

✅ Company-র নিজস্ব PDF document থেকে উত্তর খোঁজে (RAG)
✅ Document-এ না থাকলে General AI knowledge use করে
✅ Real-time word-by-word streaming response দেয়
✅ কোন document-এর কোন page থেকে উত্তর এসেছে cite করে
✅ JWT authentication দিয়ে secure
✅ 3-tier LLM fallback (Groq → Groq → Gemini)
```

---

## 🗂️ Project Folder Structure

```
it-helpdesk-ai/
│
├── 📁 backend/                    ← Python Server (FastAPI)
│   ├── app/
│   │   ├── main.py               ← Server entry point, CORS, routes
│   │   ├── config.py             ← All settings from .env
│   │   ├── schemas.py            ← Request/Response data shapes
│   │   │
│   │   ├── 📁 rag/               ← AI Pipeline (The Brain)
│   │   │   ├── loader.py         ← PDF → text (pypdf)
│   │   │   ├── chunker.py        ← text → 500-char chunks
│   │   │   ├── embedder.py       ← text → 1024-dim vectors (bge-m3)
│   │   │   ├── vector_store.py   ← Qdrant CRUD operations
│   │   │   ├── reranker.py       ← Best chunk selection (bge-reranker)
│   │   │   ├── citation.py       ← Source formatting
│   │   │   └── pipeline.py       ← All steps orchestrated here
│   │   │
│   │   ├── 📁 api/               ← HTTP Endpoints
│   │   │   ├── chat.py           ← /chat, /chat/stream
│   │   │   ├── documents.py      ← /documents, /ingest
│   │   │   ├── auth_router.py    ← /auth/login, /auth/me
│   │   │   └── health.py         ← /health
│   │   │
│   │   ├── 📁 auth/
│   │   │   └── jwt.py            ← JWT create/verify, credential check
│   │   │
│   │   └── 📁 utils/
│   │       └── logger.py         ← Formatted logging
│   │
│   ├── data/docs/                ← Uploaded PDF files (gitignored)
│   ├── .env                      ← API keys (gitignored!)
│   └── requirements.txt          ← Python dependencies
│
├── 📁 frontend/                   ← React + TypeScript UI
│   └── src/
│       ├── App.tsx               ← Root: auth check, layout
│       ├── main.tsx              ← React mount point
│       │
│       ├── 📁 components/
│       │   ├── LoginPage.tsx     ← Login form (animated)
│       │   ├── Sidebar.tsx       ← Docs list, quick prompts, status
│       │   ├── Header.tsx        ← Top bar, clear chat button
│       │   ├── ChatWindow.tsx    ← Message list + auto-scroll
│       │   ├── MessageBubble.tsx ← User/AI message display
│       │   ├── CitationList.tsx  ← Source file badges
│       │   ├── ChatInput.tsx     ← Input + send button
│       │   ├── TypingIndicator.tsx ← "..." animation
│       │   └── Icons.tsx         ← SVG icon library
│       │
│       ├── 📁 hooks/
│       │   ├── useChat.ts        ← Chat state + SSE streaming
│       │   └── useAuth.ts        ← Login state + localStorage
│       │
│       ├── 📁 api/
│       │   └── client.ts         ← axios/fetch HTTP calls
│       │
│       └── 📁 types/
│           └── chat.ts           ← TypeScript interfaces
│
├── 📁 documentation/              ← এই ফোল্ডার (তুমি এখানে!)
│
├── docker-compose.yml             ← qdrant + backend + frontend একসাথে
└── .gitignore                     ← .env, node_modules, venv etc
```

---

## 🔑 Key Concepts (Beginner-এর জন্য)

| Concept | সহজ ব্যাখ্যা |
|---------|-------------|
| **RAG** | Library-তে গিয়ে relevant page খুঁজে, সেটা দিয়ে উত্তর দেওয়া |
| **Vector Embedding** | Text-কে সংখ্যার list-এ convert করা (meaning capture করে) |
| **Cosine Similarity** | দুটো vector কতটা "কাছে" সেটা মাপা |
| **Chunking** | বড় document কে ছোট টুকরোয় ভাগ করা |
| **Reranking** | প্রাথমিক results-এর মধ্যে সবচেয়ে relevant গুলো বাছা |
| **SSE Streaming** | Server থেকে word-by-word data পাঠানো |
| **JWT** | Login-এর পরে একটা "ticket" পাওয়া যা পরে show করতে হয় |
| **CORS** | Browser-এর security যা বলে কোন domain থেকে request allow |
| **Singleton** | Object একবারই তৈরি হয়, বারবার same object use হয় |

---

## 🚀 Quick Start (TL;DR)

```bash
# 1. .env setup করো
echo "GROQ_API_KEY=gsk_your_key_here" > backend/.env

# 2. Docker দিয়ে সব চালাও
docker compose up --build

# 3. Browser-এ খুলো
open http://localhost:5173

# 4. Login করো
# Username: admin
# Password: ithelpdeskAdmin123
```

বিস্তারিত: [07_how_to_run.md](./07_how_to_run.md)

---

## 🧑‍💻 Contributor Notes

- Backend: **Python 3.11+**, FastAPI, LangChain
- Frontend: **Node.js 18+**, React 18, TypeScript, Vite, Tailwind CSS
- AI: **BAAI/bge-m3** (embedding) + **BAAI/bge-reranker-base** (reranking)
- LLM: **Groq** (primary) + **Google Gemini** (fallback)
- Vector DB: **Qdrant** (Docker)
