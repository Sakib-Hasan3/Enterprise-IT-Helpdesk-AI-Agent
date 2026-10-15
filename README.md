# 🤖 Enterprise IT Helpdesk AI Agent

An advanced, enterprise-grade, RAG-powered IT Helpdesk Copilot built with **FastAPI**, **Qdrant Vector Database**, **BAAI/bge-m3**, **BAAI/bge-reranker**, and **React 19 + TypeScript + Tailwind CSS**.

---

## 📖 সার্বিক প্রজেক্ট ডকুমেন্টেশন (Comprehensive Documentation)

প্রজেক্টের প্রতিটি ফাইল, আর্কিটেকচার, অ্যালগরিদম এবং প্রোডাকশন গাইড সম্পর্কে বিস্তারিত জানতে [`documentation/`](./documentation/) ফোল্ডারটি দেখুন:

- 📑 [**README & Quickstart**](./documentation/README.md): টেক স্ট্যাক ও প্রজেক্ট রান করার গাইড।
- 🧠 [**01. সিস্টেম আর্কিটেকচার ও লজিক**](./documentation/01_system_architecture_and_logic.md): RAG পাইপলাইন, চাঙ্কিং, ভেক্টর সার্চ, রি-র‍্যাঙ্কিং, ৩-টায়ার ফলব্যাক ও স্ট্রিমিং লজিক।
- 💻 [**02. ব্যাকএন্ড ফাইলসমূহের বিশ্লেষণ**](./documentation/02_backend_files_breakdown.md): ব্যাকএন্ডের প্রতিটি পাইথন ফাইলের লাইন-বাই-লাইন বিশ্লেষণ।
- 🎨 [**03. ফ্রন্টএন্ড ফাইলসমূহের বিশ্লেষণ**](./documentation/03_frontend_files_breakdown.md): React কম্পোনেন্টস, কাস্টম হুকস, অথেনটিকেশন ও UI ডিজাইন।
- 📚 [**04. নলেজ বেস ও ভেক্টর স্টোরেজ**](./documentation/04_data_and_knowledge_base.md): সিন্থেটিক ডেটা জেনারেশন ও Qdrant কালেকশন স্ট্রাকচার।
- 🚀 [**05. বর্তমান সমস্যা ও প্রোডাকশন রোডম্যাপ**](./documentation/05_production_readiness_and_gaps.md): চিহ্নিত বাগসমূহ ও এন্টারপ্রাইজ প্রোডাকশনে নেওয়ার জন্য প্রয়োজনীয় রোডম্যাপ।

---

## ⚡ কুইক রান নির্দেশিকা (Quick Run)

### ১. Qdrant চালান
```bash
docker run -d -p 6333:6333 -v $(pwd)/qdrant_storage:/qdrant/storage:z qdrant/qdrant
```

### ২. ব্যাকএন্ড চালু করুন
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### ৩. ফ্রন্টএন্ড চালু করুন
```bash
cd frontend
npm run dev
```
ব্রাউজারে যান: `http://localhost:5173`
- **Username:** `admin`
- **Password:** `ithelpdeskAdmin123`