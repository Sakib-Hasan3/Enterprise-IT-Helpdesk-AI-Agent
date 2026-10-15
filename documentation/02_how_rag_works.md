# 02 — RAG কী? সহজ ভাষায় পুরো Concept

> RAG = **R**etrieval **A**ugmented **G**eneration
> বাংলায়: "খুঁজে এনে তারপর AI দিয়ে উত্তর তৈরি করা"

---

## 🤔 সমস্যাটা কী?

ChatGPT-এর মতো AI model অনেক কিছু জানে, কিন্তু:
- তোমার **company-র specific PDF manual** সে জানে না
- সে **outdated information** দিতে পারে
- সে **hallucinate করে** — মানে ভুল জিনিস confident-ভাবে বলে

**RAG এই সমস্যার সমাধান।**

---

## 💡 RAG-এর Simple Analogy (উপমা)

কল্পনা করো তুমি একজন **Library Assistant**:

```
🧑 Student: "বাংলাদেশের মুক্তিযুদ্ধের সময় কতজন শহিদ হয়েছিল?"

📚 Library Assistant (তুমি):
   Step 1: Library-তে যাও, relevant বই খোঁজো
   Step 2: সেই বইয়ের relevant page খোঁজো
   Step 3: সেই information পড়ো
   Step 4: সেই information দিয়ে সুন্দর করে উত্তর দাও
   Step 5: বলো — "এই তথ্য [book name], page [X] থেকে নেওয়া"
```

**RAG ঠিক এভাবেই কাজ করে!**
- Library = Qdrant Vector Database
- Book খোঁজা = Vector Search
- Page খোঁজা = Reranking
- উত্তর দেওয়া = LLM (AI Model)

---

## 🔄 RAG-এর পুরো Flow (Step by Step)

### Phase 1: Document Ingestion (PDF একবার process করা)

```
PDF File
   │
   ▼
┌─────────────┐
│  Loader     │  ← PDF থেকে text বের করা (pypdf library)
│  loader.py  │
└──────┬──────┘
       │  [{"text": "page 1 text", "page": 1, "source": "manual.pdf"}, ...]
       ▼
┌─────────────┐
│  Chunker    │  ← বড় text কে ছোট ছোট টুকরোয় ভাগ করা
│  chunker.py │    (500 characters করে, 50 overlap)
└──────┬──────┘
       │  [{"text": "chunk 1...", "page": 1}, {"text": "chunk 2...", "page": 1}, ...]
       ▼
┌─────────────┐
│  Embedder   │  ← প্রতিটা chunk কে 1024-dimensional vector-এ convert
│  embedder.py│    (BAAI/bge-m3 model use করে)
└──────┬──────┘
       │  [[0.12, -0.34, 0.89, ...], [0.45, 0.23, -0.67, ...], ...]
       ▼
┌──────────────┐
│  Vector Store│  ← Qdrant database-এ save করা
│vector_store.py    (পরে খুঁজে পাওয়ার জন্য)
└──────────────┘
```

### Phase 2: Query Processing (User প্রশ্ন করলে)

```
User Question: "VPN কীভাবে connect করব?"
   │
   ▼
┌─────────────┐
│  Embedder   │  ← Question কেও vector-এ convert করা
│  embedder.py│    (same model, same space)
└──────┬──────┘
       │  [0.34, -0.12, 0.78, ...]  (question vector)
       ▼
┌──────────────┐
│  Vector Store│  ← Qdrant-এ search — কোন chunk গুলো similar?
│  vector_store │   cosine similarity দিয়ে top 8 বের করে
└──────┬───────┘
       │  8টা candidate chunk (possibly relevant)
       ▼
┌─────────────┐
│  Reranker   │  ← এই 8টার মধ্যে কোনটা সত্যিই relevant?
│  reranker.py│    BGE Reranker model দিয়ে score করে
└──────┬──────┘
       │  Top 3 most relevant chunks
       ▼
┌─────────────┐
│  Citation   │  ← Source information গুছিয়ে রাখা
│  citation.py│    (কোন file, কোন page, কোন snippet)
└──────┬──────┘
       │  Context + Citations ready
       ▼
┌─────────────┐
│  LLM (Groq) │  ← Context + Question দিয়ে AI কে বলা:
│  pipeline.py│    "এই তথ্যের উপর ভিত্তি করে উত্তর দাও"
└──────┬──────┘
       │  Final Answer (streaming token by token)
       ▼
User: "VPN connect করতে প্রথমে Settings খুলুন, তারপর..."
      📄 Source: vpn_manual.pdf, Page 3 (Relevance: 0.92)
```

---

## 🧮 Vector কী? (সহজ ব্যাখ্যা)

Vector হলো সংখ্যার একটা list যা meaning represent করে।

```
"VPN connect করো"    → [0.34, -0.12, 0.78, 0.23, ...]   (1024টা সংখ্যা)
"VPN setup guide"    → [0.31, -0.15, 0.75, 0.26, ...]   (similar numbers!)
"আলু পাকানোর recipe" → [0.89, 0.67, -0.34, -0.56, ...]  (very different)
```

**Cosine Similarity** দিয়ে মাপা হয় দুটো vector কতটা কাছে।
- Score 1.0 = একদম same meaning
- Score 0.0 = সম্পূর্ণ unrelated

---

## 🔍 Two-Stage Retrieval (কেন দুইবার খোঁজা হয়?)

### Stage 1: Vector Search (Fast but Noisy)
- Qdrant-এ cosine similarity দিয়ে **top 8** chunk বের করে
- দ্রুত কিন্তু সব সময় perfect না

### Stage 2: Reranking (Slow but Accurate)
- BGE Reranker model প্রতিটা chunk-কে question-এর সাথে compare করে
- **Top 3** সবচেয়ে relevant chunk বেছে নেয়
- অনেক বেশি accurate

**কেন দুইটা stage?**
> Qdrant-এ সব কিছু search করা slow হবে। তাই প্রথমে দ্রুত 8টা candidate আনো, তারপর সেই 8টার মধ্যে detail-এ analysis করো।

---

## 🎭 Hybrid Mode (Document + General Knowledge)

```python
# pipeline.py-এ এই logic আছে:

if rerank_score < 0.01:  # খুব কম score = document-এ নেই
    # General AI knowledge দিয়ে উত্তর দাও
    answer = ask_general_llm(question)
    source_type = "general_knowledge"
else:
    # Document context দিয়ে উত্তর দাও
    answer = ask_rag_llm(context, question)
    source_type = "knowledge_base"
```

**উদাহরণ:**
- "VPN setup?" → Document-এ আছে → Document থেকে উত্তর
- "Python কী?" → IT manual-এ নেই → General AI থেকে উত্তর

---

## 📊 Chunking কেন দরকার?

AI model একসাথে অনেক বড় text process করতে পারে না।  
তাই PDF-এর পুরো text ছোট ছোট "chunk"-এ ভাগ করা হয়:

```
chunk_size = 500 characters    ← একটা chunk কতটুকু বড়
chunk_overlap = 50 characters  ← দুটো chunk-এর মধ্যে overlap
```

**Overlap কেন?**
> যদি একটা important sentence দুটো chunk-এর border-এ পড়ে, তাহলে উভয় chunk-এই সেটা থাকবে, ফলে miss হবে না।
