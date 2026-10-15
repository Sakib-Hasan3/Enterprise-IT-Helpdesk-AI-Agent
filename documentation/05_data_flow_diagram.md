# 05 — Data Flow: User প্রশ্ন করলে কী হয়? (Step-by-Step)

> এই document-এ দেখাবো একটা প্রশ্ন থেকে উত্তর পাওয়া পর্যন্ত ঠিক কোন ফাইল কোন কাজ করে।

---

## 🔐 Scenario 1: Login Flow

```
User types: username="admin", password="ithelpdeskAdmin123"
ও "Sign in" click করে

Browser (LoginPage.tsx)
    │ handleSubmit() calls onLogin(username, password)
    │
    ▼
useAuth.ts → login()
    │ apiLogin(username, password) call করে
    │
    ▼
api/client.ts → axios.post('/api/auth/login', {username, password})
    │ HTTP POST request backend-এ যায়
    │
    ▼
backend/app/api/auth_router.py → login() endpoint
    │ verify_credentials(username, password) call করে
    │
    ▼
backend/app/auth/jwt.py → verify_credentials()
    │ secrets.compare_digest() দিয়ে safe comparison
    │ ✅ Match হলে create_access_token() call করে
    │
    ▼
backend/app/auth/jwt.py → create_access_token()
    │ JWT token তৈরি করে (24 ঘণ্টার জন্য)
    │ Return: {"access_token": "eyJ...", "username": "admin"}
    │
    ▼
useAuth.ts
    │ localStorage-এ token save করে
    │ isAuthenticated = true হয়
    │
    ▼
App.tsx
    ✅ LoginPage বাদ দিয়ে Main app দেখায়
```

---

## 💬 Scenario 2: Chat Flow (প্রশ্ন করা থেকে উত্তর পাওয়া পর্যন্ত)

### ধাপ 1: User প্রশ্ন টাইপ করে

```
User types: "VPN কীভাবে setup করব?"
Enter press করে

ChatInput.tsx → handleSend()
    │ onSend(text) call করে (props দিয়ে এসেছে App.tsx থেকে)
    │
    ▼
useChat.ts → send("VPN কীভাবে setup করব?")
```

### ধাপ 2: UI আপডেট (Optimistic Update)

```
useChat.ts → send()
    │
    ├── User message create করে:
    │   { id: "abc123", role: "user", content: "VPN কীভাবে setup করব?" }
    │
    ├── Empty AI message create করে:
    │   { id: "xyz789", role: "assistant", content: "",
    │     isLoading: true, statusMessage: "🔍 Searching knowledge base..." }
    │
    └── setMessages([...prev, userMsg, botMsg])
        ↓
    ChatWindow.tsx এ দুটো MessageBubble দেখা যায়
    AI bubble-এ "🔍 Searching..." দেখায়
```

### ধাপ 3: Backend-এ Request পাঠানো

```
useChat.ts → streamMessage("VPN কীভাবে setup করব?")
    │
    ▼
api/client.ts → fetch('/api/chat/stream', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer eyJ...' },  ← JWT token
    body: JSON.stringify({ question: "VPN কীভাবে setup করব?" })
})
    │
    ▼
backend/app/api/chat.py → chat_stream() endpoint
    │ JWT token verify করে (get_current_user dependency)
    │ ask_stream("VPN কীভাবে setup করব?") call করে
```

### ধাপ 4: RAG Pipeline চালু হয়

```
backend/app/rag/pipeline.py → ask_stream()
    │
    ├── yield {"type": "status", "message": "🔍 Searching knowledge base..."}
    │   ↓ Browser-এ: "🔍 Searching knowledge base..." দেখায়
    │
    ├── retrieve_and_rerank("VPN কীভাবে setup করব?") call করে
    │   │
    │   ├── embedder.py → embed_query("VPN কীভাবে setup করব?")
    │   │   [0.34, -0.12, 0.78, 0.23, ...]  ← 1024-dim vector
    │   │
    │   ├── vector_store.py → search(query_vector, top_k=8)
    │   │   Qdrant-এ cosine similarity search → 8 candidates
    │   │
    │   └── reranker.py → rerank(question, candidates, top_k=3)
    │       BGE Reranker দিয়ে best 3 chunks select করে
    │
    ├── (Chunks found!) build_context(top_chunks) → context string
    │
    ├── yield {"type": "status", "message": "📄 Found relevant docs — generating answer..."}
    │   ↓ Browser-এ: "📄 Found relevant docs..." দেখায়
    │
    └── LLM streaming শুরু হয়...
```

### ধাপ 5: AI উত্তর তৈরি হয় (Streaming)

```
pipeline.py → ChatGroq(streaming=True).stream(prompt + context)
    │
    ├── Token 1: "VPN" → yield {"type": "chunk", "content": "VPN"}
    ├── Token 2: " setup" → yield {"type": "chunk", "content": " setup"}
    ├── Token 3: " করতে" → yield {"type": "chunk", "content": " করতে"}
    │   ...continues...
    │
    ▼ (প্রতিটা token browser-এ আসছে)
    │
    api/client.ts → reader.read() করে line by line parse করছে
    │ "data: {"type": "chunk", "content": "VPN"}\n\n"
    │
    useChat.ts → event handling:
    │ if (event.type === 'chunk')
    │   setMessages: botMsg.content += "VPN"
    │   setMessages: botMsg.content += " setup"
    │   ...
    │
    ChatWindow.tsx → MessageBubble দেখায়:
    "VPN setup করতে..."  ← word by word টাইপ হচ্ছে দেখতে পাবে
```

### ধাপ 6: Citations আসে

```
pipeline.py → yield {"type": "citations", 
                      "citations": [
                        {"file": "vpn_manual.pdf", "page": 3, 
                         "snippet": "VPN setup করতে প্রথমে...",
                         "relevance": 0.923}
                      ],
                      "source_type": "knowledge_base"}
    │
    useChat.ts → event.type === 'citations'
    │ setMessages: botMsg.citations = [...]
    │
    MessageBubble.tsx → CitationList component দেখায়:
    📄 vpn_manual.pdf  Page 3  (92% match)
    "VPN setup করতে প্রথমে..."
```

### ধাপ 7: Completed

```
pipeline.py → yield {"type": "done"}
    │
    useChat.ts → event.type === 'done'
    │ setMessages: botMsg.isLoading = false
    │
    MessageBubble.tsx → Loading indicator বন্ধ
    │
    localStorage-এ messages save হয়
    
    ✅ Done!
```

---

## 📄 Scenario 3: Document Upload Flow

```
Admin কোনো PDF upload করতে চায়

Sidebar.tsx (বা admin panel) → file input
    │ formData.append('file', pdfFile)
    │
    ▼
api/client.ts → axios.post('/api/ingest', formData)
    │ multipart/form-data request
    │
    ▼
backend/app/api/documents.py → ingest_document()
    │ PDF type check করে (.pdf extension)
    │ File size check করে (max 20MB)
    │ data/docs/ folder-এ save করে
    │ ingest_pdf(file_path) call করে
    │
    ▼
backend/app/rag/pipeline.py → ingest_pdf()
    │
    ├── rag/loader.py → load_pdf()
    │   PDF থেকে page-by-page text বের করে
    │
    ├── rag/chunker.py → chunk_pages()
    │   500-char chunks তৈরি করে
    │
    ├── rag/embedder.py → embed_texts()
    │   প্রতিটা chunk → 1024-dim vector
    │
    └── rag/vector_store.py → upsert_chunks()
        Qdrant-এ save করে
    
    ✅ Response: {"message": "Document ingested", "filename": "vpn.pdf"}
```

---

## ⚡ SSE (Server-Sent Events) কীভাবে কাজ করে?

Normal HTTP: Client request করে → Server response দেয় → Connection বন্ধ

SSE: Client request করে → Server continuously data পাঠায় → Connection খোলা থাকে

```
Client: POST /api/chat/stream
        "question": "VPN setup?"

Server: 200 OK
        Content-Type: text/event-stream
        
        data: {"type": "status", "message": "🔍 Searching..."}\n\n
        data: {"type": "status", "message": "📄 Found docs..."}\n\n
        data: {"type": "chunk", "content": "VPN"}\n\n
        data: {"type": "chunk", "content": " setup"}\n\n
        data: {"type": "chunk", "content": " করতে"}\n\n
        ... (streaming continues)
        data: {"type": "citations", "citations": [...]}\n\n
        data: {"type": "done"}\n\n
        
        [Connection closes]
```

**Format:** প্রতিটা event `data: ` দিয়ে শুরু এবং `\n\n` দিয়ে শেষ।

---

## 🔄 State Flow Diagram

```
                    User Types Question
                           │
                           ▼
                    ChatInput.tsx
                    onSend(question)
                           │
                           ▼
                    useChat.ts - send()
                    ┌──────┴──────────────┐
                    │                     │
                    ▼                     ▼
             Add User Msg           Add Empty Bot Msg
             to messages[]          (isLoading: true)
                    │
                    ▼
              streamMessage() → fetch /api/chat/stream
                    │
          ┌─────────┴──────────┐
          │                    │
     event: status         event: chunk
          │                    │
     Update botMsg.       botMsg.content
     statusMessage         += new token
          │                    │
          └─────────┬──────────┘
                    │
               event: citations
                    │
               botMsg.citations = [...]
                    │
                event: done
                    │
               botMsg.isLoading = false
                    │
                    ▼
          localStorage-এ save
```
