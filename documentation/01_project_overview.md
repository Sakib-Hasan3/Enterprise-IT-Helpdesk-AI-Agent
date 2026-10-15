# 01 — Project Overview: এই Project কী এবং কেন তৈরি হয়েছে?

---

## 🎯 Project-এর মূল লক্ষ্য

কল্পনা করো একটা বড় company আছে। সেই company-তে হাজারো employee কাজ করে।  
প্রতিদিন IT department-কে অনেক প্রশ্নের উত্তর দিতে হয়, যেমন:

- "VPN কীভাবে connect করব?"
- "Password reset কীভাবে করব?"
- "Incident report কোথায় করব?"
- "Email কাজ করছে না, কী করব?"

এই সব প্রশ্নের উত্তর company-র নিজস্ব PDF manual ও policy document-এ আছে। কিন্তু সেগুলো খুঁজে পড়া সময়সাপেক্ষ।

**এই Project সেই সমস্যার সমাধান করে।** একজন employee যেকোনো প্রশ্ন করতে পারবে, AI সেই PDF থেকে উত্তর খুঁজে দেবে — ChatGPT-এর মতো করে!

---

## 🤖 এটা সাধারণ Chatbot থেকে কীভাবে আলাদা?

| সাধারণ Chatbot | এই Project |
|----------------|-----------|
| শুধু pre-written উত্তর দেয় | Company-র নিজস্ব document থেকে উত্তর দেয় |
| নতুন তথ্য জানে না | নতুন PDF upload করলে সাথে সাথেই জানে |
| কোথা থেকে বলছে জানায় না | কোন document-এর কোন page থেকে উত্তর এসেছে দেখায় |
| Hallucinate করে (ভুল বলে) | Document-এ না থাকলে general AI knowledge থেকে বলে |

---

## 📐 System Architecture (সিস্টেম কীভাবে কাজ করে)

```
┌─────────────────┐         ┌──────────────────────┐
│                 │  HTTP   │                      │
│  React Frontend │◄───────►│  FastAPI Backend      │
│  (Browser-এ UI) │  API    │  (Python Server)      │
│                 │         │                      │
└─────────────────┘         └──────────┬───────────┘
                                        │
                     ┌──────────────────┼──────────────────┐
                     │                  │                  │
                     ▼                  ▼                  ▼
              ┌─────────────┐  ┌──────────────┐  ┌──────────────┐
              │  Qdrant     │  │  Groq API    │  │  Google      │
              │  Vector DB  │  │  (LLM - Fast │  │  Gemini API  │
              │  (Docs      │  │   AI Model)  │  │  (Fallback)  │
              │  Store হয়) │  │              │  │              │
              └─────────────┘  └──────────────┘  └──────────────┘
```

**সহজ ভাষায়:**
1. **Browser** → User-কে সুন্দর chat interface দেখায়
2. **FastAPI Backend** → সব logic এখানে — document search করে, AI-কে জিজ্ঞেস করে
3. **Qdrant** → PDF-গুলো vector আকারে store করা থাকে (search করার জন্য)
4. **Groq / Gemini** → AI model যে উত্তর তৈরি করে

---

## 🔑 Key Features

### 1. 📁 Document Knowledge Base
- Company PDF upload করো
- AI সেটা automatically process করে memory-তে রাখে
- পরে যেকোনো প্রশ্নে সেই document থেকে উত্তর দেবে

### 2. 🔐 Secure Login System
- JWT (JSON Web Token) দিয়ে authentication
- Token 24 ঘণ্টা valid থাকে
- Default: username `admin`, password `ithelpdeskAdmin123`

### 3. ⚡ Real-time Streaming
- উত্তর word-by-word আসে (ChatGPT-এর মতো)
- User দেখতে পায় AI কীভাবে লিখছে
- SSE (Server-Sent Events) technology use করা হয়েছে

### 4. 📄 Source Citation
- কোন PDF-এর কোন page থেকে উত্তর এসেছে দেখায়
- Relevance score দেয় (কতটা মিলেছে)
- Transparency নিশ্চিত করে

### 5. 🧠 Hybrid AI Mode
- Document-এ উত্তর থাকলে → Document থেকে বলে
- Document-এ না থাকলে → General AI knowledge থেকে বলে
- দুটো ক্ষেত্রেই helpful থাকে, কখনো "জানি না" বলে না

### 6. 🛡️ 3-Tier LLM Fallback
- Primary: Groq llama-3.1-8b-instant (সবচেয়ে দ্রুত)
- Fallback 1: Groq qwen-qwq-32b
- Fallback 2: Google Gemini 2.0 Flash
- একটা fail করলে পরেরটা try করে

---

## 👥 কারা এই Project Use করবে?

- **IT Helpdesk Staff** → সাথে সাথে উত্তর পাবে, সব document মুখস্থ করতে হবে না
- **Company Employees** → নিজেই প্রশ্ন করে উত্তর পাবে, IT team-কে disturb করতে হবে না
- **IT Managers** → নতুন policy/manual PDF upload করলেই AI শিখে নেবে
