# 03 — Backend Files: প্রতিটি ফাইল ও তার কাজ

> Backend মানে Server-side code — এটা Python দিয়ে লেখা, FastAPI framework use করে।

---

## 📁 Backend Structure

```
backend/
├── app/
│   ├── main.py          ← Server start হয় এখান থেকে
│   ├── config.py        ← সব settings/configuration
│   ├── schemas.py       ← Data models (request/response shape)
│   │
│   ├── rag/             ← AI pipeline (মূল brain)
│   │   ├── loader.py    ← PDF পড়া
│   │   ├── chunker.py   ← Text কে টুকরো করা
│   │   ├── embedder.py  ← Text → Vector conversion
│   │   ├── vector_store.py ← Qdrant database operations
│   │   ├── reranker.py  ← Best chunks বাছাই
│   │   ├── citation.py  ← Source information format করা
│   │   └── pipeline.py  ← সব একসাথে coordinate করা
│   │
│   ├── api/             ← HTTP API endpoints
│   │   ├── chat.py      ← /api/chat, /api/chat/stream
│   │   ├── documents.py ← /api/documents, /api/ingest
│   │   ├── auth_router.py ← /api/auth/login
│   │   └── health.py    ← /api/health
│   │
│   ├── auth/            ← Authentication system
│   │   └── jwt.py       ← JWT token create/verify
│   │
│   └── utils/
│       └── logger.py    ← Logging system
│
├── data/docs/           ← Upload করা PDF গুলো এখানে থাকে
├── requirements.txt     ← Python libraries list
└── .env                 ← Secret keys (git-এ push করা হয় না)
```

---

## 🚀 `app/main.py` — Server Entry Point

**কী করে:** FastAPI server তৈরি করে এবং সব route connect করে।

```python
# সব router একসাথে attach করা হয়:
app.include_router(auth_router, prefix="/api")     # Login endpoint
app.include_router(health.router, prefix="/api")   # Health check
app.include_router(chat.router, prefix="/api")     # Chat endpoints
app.include_router(documents.router, prefix="/api") # Document management

# CORS মানে browser-এর security — কোন domain থেকে request allow
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"...])
```

**Beginner Note:**
> CORS (Cross-Origin Resource Sharing) browser-এর security feature। React (port 5173) যখন FastAPI (port 8000)-কে request করে, browser সেটা block করে দেবে যদি CORS set না থাকে।

---

## ⚙️ `app/config.py` — সব Settings এক জায়গায়

**কী করে:** `.env` ফাইল থেকে secret keys এবং settings পড়ে।

```python
class Settings(BaseSettings):
    GROQ_API_KEY: str           # Groq AI API key
    GOOGLE_API_KEY: str = ""    # Google Gemini API key (optional)
    
    JWT_SECRET: str = "..."     # JWT token sign করার secret
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "ithelpdeskAdmin123"
    
    QDRANT_URL: str = "http://localhost:6333"   # Vector database address
    QDRANT_COLLECTION: str = "it_helpdesk_docs" # Database collection name
    
    EMBEDDING_MODEL: str = "BAAI/bge-m3"  # Embedding model name
    CHUNK_SIZE: int = 500        # প্রতিটা chunk কতটুকু বড়
    CHUNK_OVERLAP: int = 50      # Chunk-এর মধ্যে overlap
```

**কেন `.env` file?**
> API key কখনো code-এ লেখা উচিত না — কেউ GitHub-এ দেখলে key চুরি হয়ে যাবে। `.env` file-এ রাখলে git-এ push হয় না।

---

## 📐 `app/schemas.py` — Data Shapes

**কী করে:** API request ও response-এর exact shape/structure define করে।

```python
class ChatRequest(BaseModel):
    question: str  # User এই দিয়ে প্রশ্ন পাঠাবে

class ChatResponse(BaseModel):
    answer: str           # AI-র উত্তর
    citations: list[Citation]  # কোন document থেকে এসেছে
    chunks_used: int      # কতটা document chunk use হয়েছে
    source_type: str      # "knowledge_base" বা "general_knowledge"

class Citation(BaseModel):
    file: str       # PDF ফাইলের নাম
    page: int       # কোন page
    snippet: str    # ছোট excerpt
    relevance: float # 0-1 score (কতটা relevant)
```

**Beginner Note:**
> Pydantic BaseModel automatic validation করে। যদি `question` না পাঠানো হয়, FastAPI automatically 422 error দেবে।

---

## 🧠 `app/rag/loader.py` — PDF Reader

**কী করে:** PDF file থেকে text বের করে।

```python
def load_pdf(file_path: str) -> list[dict]:
    reader = PdfReader(str(path))
    pages = []
    
    for page_num, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""
        
        if not text:  # Empty page skip
            continue
            
        pages.append({
            "text": text,      # Page-এর সব text
            "page": page_num,  # Page number (citation-এর জন্য)
            "source": path.name  # PDF filename
        })
    
    return pages
```

**Library used:** `pypdf` — Python-এ PDF read করার popular library।

---

## ✂️ `app/rag/chunker.py` — Text Splitter

**কী করে:** বড় text কে ছোট chunk-এ ভাগ করে।

```python
def chunk_pages(pages: list[dict]) -> list[dict]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,     # প্রতিটা chunk max 500 characters
        chunk_overlap=50,   # আগের chunk-এর শেষ 50 char পরের chunk-এও থাকে
        separators=["\n\n", "\n", ". ", " ", ""]  # এই order-এ split করে
    )
    
    chunks = []
    for page in pages:
        pieces = splitter.split_text(page["text"])
        for i, piece in enumerate(pieces):
            chunks.append({
                "text": piece,
                "page": page["page"],
                "source": page["source"],
                "chunk_index": i  # Page-এর মধ্যে এটা কততম chunk
            })
    
    return chunks
```

**কেন `RecursiveCharacterTextSplitter`?**
> এটা প্রথমে paragraph break (`\n\n`) দিয়ে split করার চেষ্টা করে, না পারলে line break, তারপর sentence, শেষে word দিয়ে। এতে context intact থাকে।

---

## 🔢 `app/rag/embedder.py` — Text to Vector Converter

**কী করে:** Text কে numerical vector-এ convert করে (Semantic meaning capture করে)।

```python
_model = None  # Global variable — model একবারই load হবে

def get_model():
    """Singleton Pattern — model একবার load, বারবার use"""
    global _model
    if _model is None:
        _model = SentenceTransformer("BAAI/bge-m3")  # 1024-dim embeddings
    return _model

def embed_texts(texts: list[str]) -> list[list[float]]:
    """অনেকগুলো text → তাদের vectors"""
    model = get_model()
    embeddings = model.encode(
        texts,
        batch_size=16,            # একসাথে 16টা process করে (memory efficient)
        normalize_embeddings=True, # Cosine similarity-র জন্য normalize
    )
    return embeddings.tolist()

def embed_query(query: str) -> list[float]:
    """একটা question → তার vector"""
    model = get_model()
    return model.encode(query, normalize_embeddings=True).tolist()
```

**Model:** `BAAI/bge-m3` — Multilingual embedding model (বাংলাও বোঝে!)

**Singleton Pattern কেন?**
> Model load করতে কয়েক second লাগে এবং memory নেয়। তাই global variable-এ একবার load করে রাখি, বারবার load করি না।

---

## 🗄️ `app/rag/vector_store.py` — Database Operations

**কী করে:** Qdrant vector database-এ chunk save করে এবং search করে।

```python
VECTOR_SIZE = 1024  # bge-m3 এর output size

def upsert_chunks(chunks, embeddings):
    """Chunks + Vectors → Qdrant-এ save"""
    client = get_client()
    ensure_collection()  # Collection না থাকলে তৈরি করে
    
    points = []
    for i, (chunk, emb) in enumerate(zip(chunks, embeddings)):
        points.append(PointStruct(
            id=i,
            vector=emb,  # The 1024-dimensional vector
            payload={    # Extra information save করা
                "text": chunk["text"],
                "page": chunk["page"],
                "source": chunk["source"],
            }
        ))
    
    client.upsert(collection_name="it_helpdesk_docs", points=points)

def search(query_vector, top_k=5):
    """Question vector → Similar chunks খুঁজে বের করা"""
    results = client.search(
        collection_name="it_helpdesk_docs",
        query_vector=query_vector,
        limit=top_k,  # Top K similar results
    )
    return [{"text": hit.payload["text"], "page": hit.payload["page"], 
             "source": hit.payload["source"], "score": hit.score} 
            for hit in results]
```

**Cosine Distance কী?**
> দুটো vector কোণ দিয়ে compare করে। Similar meaning = small angle = high score (close to 1.0)।

---

## 🏆 `app/rag/reranker.py` — Best Chunks Selector

**কী করে:** Vector search-এর candidates থেকে সবচেয়ে relevant গুলো বাছে।

```python
RERANKER_MODEL = "BAAI/bge-reranker-base"

def rerank(query: str, candidates: list[dict], top_k: int = 5):
    reranker = get_reranker()
    
    # প্রতিটা candidate-এর সাথে question pair করা
    pairs = [[query, c["text"]] for c in candidates]
    
    # Score দেওয়া (0 থেকে 1)
    scores = reranker.compute_score(pairs, normalize=True)
    
    # Score অনুযায়ী sort করা
    for c, s in zip(candidates, scores):
        c["rerank_score"] = float(s)
    
    reranked = sorted(candidates, key=lambda x: x["rerank_score"], reverse=True)
    return reranked[:top_k]  # Top K রেখে বাকি বাদ দেওয়া
```

**Vector Search vs Reranking:**
| | Vector Search | Reranking |
|--|--|--|
| Speed | Fast (milliseconds) | Slower (seconds) |
| Accuracy | Good | Better |
| How | Math similarity | Deep understanding |
| Use case | First pass (8 results) | Final selection (3 results) |

---

## 📋 `app/rag/citation.py` — Source Formatter

**কী করে:** Chunk information থেকে user-friendly citation তৈরি করে।

```python
def format_citations(chunks: list[dict]) -> list[dict]:
    """Unique source+page combination-এর জন্য citation তৈরি"""
    seen = set()
    citations = []
    
    for c in chunks:
        key = (c["source"], c["page"])
        if key in seen:
            continue  # Same source+page duplicate এড়ানো
        seen.add(key)
        
        citations.append({
            "file": c["source"],      # "vpn_manual.pdf"
            "page": c["page"],        # 3
            "snippet": c["text"][:150] + "...",  # Preview text
            "relevance": round(relevance, 3),     # 0.923
        })
    
    return citations

def build_context(chunks: list[dict]) -> str:
    """LLM-এর জন্য context string তৈরি"""
    parts = []
    for i, c in enumerate(chunks, start=1):
        parts.append(f"[Source {i}: {c['source']}, Page {c['page']}]\n{c['text']}")
    return "\n\n---\n\n".join(parts)
```

---

## 🧩 `app/rag/pipeline.py` — The Main Brain (সবচেয়ে গুরুত্বপূর্ণ ফাইল)

**কী করে:** সব RAG components একসাথে orchestrate করে।

### Key Functions:

#### `ingest_pdf(file_path)` — PDF process করা
```
PDF → load_pdf() → chunk_pages() → embed_texts() → upsert_chunks()
```

#### `retrieve_and_rerank(question)` — Document খোঁজা
```
Question → embed_query() → search() → rerank() → Top 3 chunks
```

#### `invoke_prompt(prompt, params)` — AI কে জিজ্ঞেস করা (3-tier fallback)
```python
# Tier 1: Groq llama-3.1-8b-instant (fastest)
try:
    return ChatGroq(model="llama-3.1-8b-instant").invoke(params)
except:
    pass

# Tier 2: Groq qwen-qwq-32b (if tier 1 fails)
try:
    return ChatGroq(model="qwen-qwq-32b").invoke(params)
except:
    pass

# Tier 3: Google Gemini 2.0 Flash (final fallback)
return ChatGoogleGenerativeAI(model="gemini-2.0-flash").invoke(params)
```

#### `ask(question)` — Non-streaming answer
```python
top_chunks = retrieve_and_rerank(question)

if not top_chunks:
    # Document-এ নেই → General AI দিয়ে উত্তর
    return invoke_prompt(GENERAL_PROMPT, {"question": question})
else:
    # Document থেকে উত্তর
    context = build_context(top_chunks)
    return invoke_prompt(RAG_PROMPT, {"context": context, "question": question})
```

#### `ask_stream(question)` — Streaming answer (word by word)
```
Event stream format:
{"type": "status", "message": "🔍 Searching..."}        ← Progress update
{"type": "chunk", "content": "VPN"}                      ← Word by word
{"type": "chunk", "content": " setup"}
{"type": "citations", "citations": [...]}                 ← Source info
{"type": "done"}                                          ← Finished
```

---

## 🛣️ API Routes

### `app/api/auth_router.py` — Login

| Endpoint | Method | Public? | কী করে |
|----------|--------|---------|--------|
| `/api/auth/login` | POST | ✅ Yes | Username+password দিলে JWT token দেয় |
| `/api/auth/me` | GET | ❌ No | Current user info দেয় |

### `app/api/chat.py` — Chat

| Endpoint | Method | Public? | কী করে |
|----------|--------|---------|--------|
| `/api/chat` | POST | ❌ No | একটা পুরো উত্তর দেয় (non-streaming) |
| `/api/chat/stream` | POST | ❌ No | Word-by-word streaming উত্তর দেয় |

### `app/api/documents.py` — Document Management

| Endpoint | Method | Public? | কী করে |
|----------|--------|---------|--------|
| `/api/documents` | GET | ❌ No | Upload করা PDF list দেখায় |
| `/api/ingest` | POST | ❌ No | নতুন PDF upload ও process করে |

### `app/api/health.py` — Health Check

| Endpoint | Method | Public? | কী করে |
|----------|--------|---------|--------|
| `/api/health` | GET | ✅ Yes | Server, Qdrant, LLM status দেখায় |

---

## 🔐 `app/auth/jwt.py` — Authentication System

**কী করে:** JWT token তৈরি, verify, এবং user authenticate করে।

```python
ALGORITHM = "HS256"           # Signing algorithm
ACCESS_TOKEN_EXPIRE_HOURS = 24  # Token 24 ঘণ্টা valid

def create_access_token(username: str) -> str:
    """Login করলে token তৈরি হয়"""
    expire = datetime.utcnow() + timedelta(hours=24)
    payload = {"sub": username, "exp": expire}
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")

def verify_credentials(username: str, password: str) -> bool:
    """Username/password compare করা (timing-safe)"""
    return (
        secrets.compare_digest(username, settings.ADMIN_USERNAME) and
        secrets.compare_digest(password, settings.ADMIN_PASSWORD)
    )

def get_current_user(credentials: HTTPAuthorizationCredentials):
    """Protected endpoint-এ token verify করা"""
    payload = verify_token(credentials.credentials)
    if not payload:
        raise HTTPException(401, "Invalid or expired token")
    return payload
```

**`secrets.compare_digest` কেন?**
> Normal `==` comparison timing attack-এর vulnerable। `compare_digest` সব character compare করতে same time নেয়, তাই attacker timing দিয়ে password guess করতে পারে না।

---

## 📝 `app/utils/logger.py` — Logging System

**কী করে:** সব module-এ consistent logging দেয়।

```python
def get_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    # Format: "14:23:45 | INFO     | rag.pipeline | Question received"
    formatter = logging.Formatter(
        "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%H:%M:%S"
    )
    ...
    return logger

# Use in any file:
logger = get_logger("rag.pipeline")
logger.info("Question: VPN setup?")
logger.warning("Tier 1 LLM failed, trying Tier 2")
logger.exception("Unexpected error occurred")
```
