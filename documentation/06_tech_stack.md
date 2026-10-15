# 06 — Tech Stack: কোন Technology কেন Use করা হয়েছে?

> প্রতিটা tool/library কেন choose করা হয়েছে — alternatives ও comparison সহ।

---

## 🏗️ Overall Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                            │
│  React + TypeScript + Tailwind CSS + Vite                   │
└─────────────────────────────────────────────────────────────┘
                              │ HTTP / SSE
┌─────────────────────────────────────────────────────────────┐
│                          BACKEND                            │
│  FastAPI (Python) + LangChain + JWT Auth                    │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
┌──────────────┐   ┌──────────────────┐   ┌─────────────────┐
│   Qdrant     │   │   Groq API       │   │   Google        │
│ Vector DB    │   │  (LLM - Fast)    │   │  Gemini API     │
│ (Local/Docker)│  │  llama-3.1-8b    │   │  (Fallback)     │
└──────────────┘   └──────────────────┘   └─────────────────┘
         │
┌──────────────────────────────────────────────────────────────┐
│              AI MODELS (locally downloaded)                  │
│  BAAI/bge-m3 (Embedding) + BAAI/bge-reranker-base (Rerank)  │
└──────────────────────────────────────────────────────────────┘
```

---

## 🐍 Backend Technologies

### FastAPI (Python Web Framework)

**কেন FastAPI?**

| Feature | FastAPI | Django | Flask |
|---------|---------|--------|-------|
| Speed | ⚡ Very Fast | 🐢 Slow | ⚡ Fast |
| Auto Docs | ✅ Built-in | ❌ Manual | ❌ Manual |
| Type checking | ✅ Pydantic | ❌ | ❌ |
| Async support | ✅ Native | ⚠️ Limited | ⚠️ Limited |
| Streaming | ✅ Easy | ❌ Hard | ⚠️ Complex |

> FastAPI-এ `/docs` url-এ যেলেই automatically Swagger UI পাওয়া যায়। আর Streaming (SSE) খুব সহজেই `StreamingResponse` দিয়ে করা যায়।

---

### Qdrant (Vector Database)

**কেন Qdrant?**

```
Vector Database মানে এমন database যে similarity খুঁজতে পারে।
Normal database: "WHERE text = 'VPN setup'" — exact match দরকার
Qdrant:         "VPN setup"-এর similar meaning যা আছে সব খুঁজে দাও
```

| Feature | Qdrant | Pinecone | Weaviate | FAISS |
|---------|--------|----------|----------|-------|
| Self-hosted | ✅ | ❌ Cloud only | ✅ | ✅ |
| Docker support | ✅ Easy | N/A | ✅ | N/A |
| REST API | ✅ | ✅ | ✅ | ❌ |
| Filtering | ✅ Rich | ✅ | ✅ | ❌ |
| Free | ✅ Open source | ❌ Paid | ✅ | ✅ |

> Qdrant Docker-এ চালানো যায়, free, এবং production-ready। FAISS-এর তুলনায় API আছে এবং persistence support আছে।

---

### BAAI/bge-m3 (Embedding Model)

**কী করে:** Text কে 1024-dimensional vector-এ convert করে।

**কেন এটা?**
- Multilingual (100+ ভাষা — বাংলাসহ)
- High quality embeddings
- Free, locally run করা যায় (API cost নেই)
- 1024 dimensions = high accuracy

**Alternatives:**
- `text-embedding-3-small` (OpenAI) — paid, API call দরকার
- `all-MiniLM-L6-v2` — 384 dim, faster but less accurate
- `bge-large-en` — English only

---

### BAAI/bge-reranker-base (Reranker Model)

**কী করে:** Vector search-এর candidates-কে re-score করে সবচেয়ে relevant বাছে।

**কেন Reranker দরকার?**
> Vector search mathematical similarity দেখে। কিন্তু "VPN setup on Mac" আর "VPN setup on Windows" দুটো similar vector হতে পারে। Reranker exact context বোঝে।

**`use_fp16=True` কেন?**
> fp16 (16-bit floating point) fp32 এর চেয়ে 2x কম memory নেয় এবং faster। CPU-তে চালালে speed ভালো থাকে।

---

### Groq API (LLM Provider)

**কেন Groq?**
- ⚡ **অবিশ্বাস্য রকম দ্রুত** — llama-3.1-8b-instant ~1-2 seconds response
- 💰 **Free tier আছে** — daily limit দিয়ে free use করা যায়
- 🚀 **Custom hardware** — Groq নিজের chip (LPU) use করে speed পায়

**Models used:**
```
Tier 1: llama-3.1-8b-instant  ← Primary (fastest)
Tier 2: qwen-qwq-32b           ← Secondary fallback
Tier 3: gemini-2.0-flash       ← Final fallback (Google)
```

**কেন 3-tier fallback?**
> Groq-এর free tier-এ rate limit আছে। অনেক request গেলে 429 error আসে। Fallback থাকলে service never goes down।

---

### LangChain (AI Framework)

**কী করে:** LLM, prompts, এবং chains একসাথে manage করে।

```python
# LangChain ছাড়া:
prompt_text = f"You are IT Helpdesk...\nContext: {context}\nQuestion: {question}"
response = openai.chat.completions.create(messages=[{"role": "user", "content": prompt_text}])

# LangChain দিয়ে:
prompt = ChatPromptTemplate.from_template("...{context}...{question}...")
chain = prompt | llm
result = chain.invoke({"context": context, "question": question})
```

**Components used:**
- `ChatPromptTemplate` — Prompt templating
- `ChatGroq` — Groq API wrapper
- `ChatGoogleGenerativeAI` — Gemini API wrapper
- `RecursiveCharacterTextSplitter` — Text chunking

---

### pypdf (PDF Reader)

**কী করে:** PDF থেকে text extract করে।

**Alternatives:**
- `pdfplumber` — Tables ও ভালো extract করে, কিন্তু slower
- `PyMuPDF` (fitz) — Fast, কিন্তু binary dependency আছে
- `pdfminer` — Low-level, complex

> `pypdf` simple এবং pure Python, তাই সহজে install হয়।

---

### Python-JOSE (JWT Library)

**কী করে:** JWT token create এবং verify করে।

```python
# Token তৈরি
jwt.encode({"sub": "admin", "exp": expire}, secret, algorithm="HS256")

# Token verify
jwt.decode(token, secret, algorithms=["HS256"])
```

**HS256 কী?**
> HMAC + SHA-256 — symmetric key দিয়ে sign করা। একই secret দিয়ে sign এবং verify করা হয়।

---

## ⚛️ Frontend Technologies

### React (UI Framework)

**কেন React?**
- Component-based — reusable UI pieces
- Virtual DOM — efficient updates
- Hooks — state management সহজ
- Huge ecosystem

---

### TypeScript

**কেন TypeScript?**
```typescript
// JavaScript:
function send(question) {  // question কী type? কেউ জানে না!
  ...
}

// TypeScript:
function send(question: string): Promise<void> {  // Crystal clear!
  ...
}
```

**Benefits:**
- Compile-time error detection
- Better IDE autocomplete
- Self-documenting code
- Safer refactoring

---

### Vite (Build Tool)

**কেন Vite?**

| | Vite | Create React App | Webpack |
|-|------|-----------------|---------|
| Dev start | ⚡ ~0.5s | 🐢 ~30s | 🐢 ~20s |
| HMR | ⚡ Instant | 🐢 Slow | 🐢 Slow |
| Config | Simple | Hidden | Complex |

> Vite ES modules সরাসরি browser-এ দেয়, bundle করে না। তাই dev server অনেক দ্রুত।

---

### Tailwind CSS

**কেন Tailwind?**
```tsx
// Traditional CSS:
.chat-bubble {
  background: #1e293b;
  border-radius: 12px;
  padding: 12px 16px;
  ...
}
<div className="chat-bubble">

// Tailwind:
<div className="bg-slate-800 rounded-xl p-3 px-4">
```

**Benefits:**
- CSS লিখতে হয় না, class দিলেই হয়
- Design system built-in
- No unused CSS in production
- Responsive utilities (`md:`, `lg:`)

---

## 🐳 Docker & Docker Compose

**কেন Docker?**

> "আমার machine-এ কাজ করছে" সমস্যার সমাধান।  
> Docker container-এ সব dependency bundled থাকে।

```yaml
# docker-compose.yml এ 3টা service:
services:
  qdrant:    # Vector database
    image: qdrant/qdrant:latest
    ports: ["6333:6333"]
    
  backend:   # FastAPI server
    build: ./backend
    ports: ["8000:8000"]
    depends_on: [qdrant]  # Qdrant আগে চালু হবে
    
  frontend:  # React app
    build: ./frontend
    ports: ["5173:5173"]
    depends_on: [backend]  # Backend আগে চালু হবে
```

**`depends_on` + `healthcheck` কেন?**
> Qdrant ready না হলে backend start করলে crash করবে। `healthcheck` নিশ্চিত করে service সত্যিই ready কিনা।

---

## 📊 Technology Decision Summary

| Layer | Technology | কেন |
|-------|-----------|-----|
| Backend framework | FastAPI | Speed, auto-docs, native async, streaming support |
| Vector DB | Qdrant | Free, self-hosted, Docker-friendly, rich filtering |
| Embedding model | BAAI/bge-m3 | Multilingual, 1024-dim, free, local |
| Reranker | BAAI/bge-reranker-base | Good quality, fast CPU inference |
| LLM API | Groq (llama-3.1-8b) | Fastest free LLM available (~1-2s) |
| LLM fallback | Google Gemini | Reliable, fast, generous free tier |
| AI framework | LangChain | Prompt management, chain composition |
| Authentication | JWT (HS256) | Stateless, standard, easy to implement |
| Frontend framework | React + TypeScript | Component model, type safety |
| Build tool | Vite | Near-instant dev server |
| Styling | Tailwind CSS | Utility-first, no CSS file needed |
| Containerization | Docker Compose | Reproducible deployment, all services together |
