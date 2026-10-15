# 04 — Frontend Files: প্রতিটি ফাইল ও তার কাজ

> Frontend মানে Browser-এ যা দেখা যায় — React + TypeScript দিয়ে তৈরি।

---

## 📁 Frontend Structure

```
frontend/src/
├── main.tsx           ← App এর একদম শুরু (HTML-এ React mount করে)
├── App.tsx            ← Main component (routing logic)
├── App.css            ← Global CSS
├── index.css          ← Tailwind CSS setup
│
├── components/        ← UI Building Blocks
│   ├── LoginPage.tsx  ← Login form (authenticated না হলে দেখায়)
│   ├── Sidebar.tsx    ← বাম দিকের panel
│   ├── Header.tsx     ← উপরের bar
│   ├── ChatWindow.tsx ← মাঝখানে messages দেখায়
│   ├── ChatInput.tsx  ← নিচের input field
│   ├── MessageBubble.tsx ← Individual message (user/AI)
│   ├── CitationList.tsx  ← Source citations দেখায়
│   ├── TypingIndicator.tsx ← "..." animation যখন AI ভাবছে
│   └── Icons.tsx      ← SVG icons collection
│
├── hooks/             ← Custom React Hooks (Business Logic)
│   ├── useChat.ts     ← Chat state management + streaming
│   └── useAuth.ts     ← Authentication state management
│
├── types/             ← TypeScript Type Definitions
│   └── chat.ts        ← সব interfaces define করা
│
└── api/               ← Backend communication
    └── client.ts      ← HTTP requests করে
```

---

## 🎯 `src/main.tsx` — App Start Point

**কী করে:** HTML-এর `<div id="root">` এ React app mount করে।

```tsx
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'  // Global CSS

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
```

---

## 🏠 `src/App.tsx` — Main App Logic

**কী করে:** Login state check করে — login না থাকলে Login page, থাকলে main app।

```tsx
export default function App() {
  const { isAuthenticated, login, logout, username } = useAuth(); // Login state
  const { messages, isLoading, send, clear } = useChat();          // Chat state

  // Keyboard shortcut: Ctrl+K = New Chat
  useEffect(() => {
    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') clear();
    });
  }, [clear]);

  // না থাকলে Login page দেখাও
  if (!isAuthenticated) {
    return <LoginPage onLogin={login} ... />;
  }

  // থাকলে Main app দেখাও
  return (
    <div className="h-screen flex">
      <Sidebar ... />       {/* Left panel */}
      <main>
        <Header ... />       {/* Top bar */}
        <ChatWindow ... />   {/* Message area */}
        <ChatInput ... />    {/* Input at bottom */}
      </main>
    </div>
  );
}
```

**Component Tree (কোনটা কার ভেতরে):**
```
App
├── LoginPage (যদি not authenticated)
└── Main Layout (যদি authenticated)
    ├── Sidebar
    └── main
        ├── Header
        ├── ChatWindow
        │   └── MessageBubble[] (প্রতিটা message)
        │       └── CitationList (AI message-এ)
        └── ChatInput
```

---

## 🔐 `src/components/LoginPage.tsx` — Login Form

**কী করে:** Username/password নিয়ে backend-এ পাঠায়।

**Features:**
- 🎨 Animated gradient background (blob effects)
- 👁️ Show/hide password toggle
- ❌ Error message display
- ⏳ Loading spinner while logging in
- 📝 Default credentials hint

```tsx
export function LoginPage({ onLogin, isLoggingIn, loginError }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (username && password) onLogin(username, password); // useAuth-এর login call
  };

  return (
    <div className="min-h-screen bg-slate-950 ...">
      {/* Animated blobs */}
      <div className="absolute ... animate-pulse" />
      
      {/* Login Card */}
      <form onSubmit={handleSubmit}>
        {loginError && <ErrorBanner />}  {/* Error দেখানো */}
        <input type="text" ... />        {/* Username */}
        <input type={showPass ? 'text' : 'password'} ... />  {/* Password */}
        <button type="submit" disabled={isLoggingIn}>Sign in</button>
      </form>
    </div>
  );
}
```

---

## 📋 `src/components/Sidebar.tsx` — Left Panel

**কী করে:** Knowledge base documents list, quick prompts, এবং system status দেখায়।

**Sections:**
1. **Brand Header** — "IT Copilot v2.4" logo
2. **New Conversation Button** — Chat clear করে নতুন শুরু
3. **Knowledge Base** — Upload করা PDF list (Qdrant থেকে আনা)
4. **Quick Prompts** — Common questions shortcuts
5. **System Status** — Qdrant connected কিনা, LLM mode
6. **User Info + Logout** — Logged-in username ও logout button

```tsx
const loadData = async () => {
  // একসাথে documents ও health check করা
  const [docsRes, healthRes] = await Promise.all([
    fetchDocuments(),  // backend /api/documents
    checkHealth(),     // backend /api/health
  ]);
  setDocuments(docsRes.documents);
  setHealth(healthRes);
};

// Mobile-এ sidebar hide/show animation
<aside className={`fixed ... transition-transform ${
  isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
}`}>
```

**Mobile Responsive:**
- Desktop: Sidebar সবসময় দেখা যায়
- Mobile: Hamburger menu-তে click করলে slide in হয়, backdrop click করলে close হয়

---

## 💬 `src/components/ChatWindow.tsx` — Message Display Area

**কী করে:** সব messages render করে এবং auto-scroll করে।

**Features:**
- 📜 Auto-scroll to latest message
- 👋 Welcome screen (messages না থাকলে)
- 🃏 Suggested prompt cards (empty state-এ)
- 📱 Smooth animations

```tsx
// Auto-scroll logic
useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [messages]); // যখনই নতুন message আসে, scroll করে নামে

// Messages render
{messages.map((msg) => (
  <MessageBubble key={msg.id} message={msg} />
))}

// Empty state
{messages.length === 0 && (
  <WelcomeScreen onSelectPrompt={onSelectPrompt} />
)}
```

---

## 💬 `src/components/MessageBubble.tsx` — Individual Message

**কী করে:** একটা message (user বা AI) সুন্দরভাবে দেখায়।

**User message:**
```
[Avatar]  তুমি: VPN কীভাবে connect করব?        [Timestamp]
```

**AI message (loading):**
```
[Bot]  🔍 Searching knowledge base...   ← statusMessage দেখায়
```

**AI message (streaming):**
```
[Bot]  VPN connect করতে প্রথমে...      ← content আসতে থাকে
```

**AI message (done):**
```
[Bot]  VPN connect করতে প্রথমে Settings খুলুন...
       
       📄 Sources:
       • vpn_manual.pdf  Page 3  (92% match)
```

```tsx
export function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  
  // User message - right side, blue
  // AI message - left side, white/dark
  
  {message.isLoading && message.statusMessage && (
    <StatusMessage text={message.statusMessage} /> // "🔍 Searching..."
  )}
  
  {message.content && (
    <div>{message.content}</div>  // Streaming text
  )}
  
  {message.citations?.length > 0 && (
    <CitationList citations={message.citations} />  // Source list
  )}
}
```

---

## 📄 `src/components/CitationList.tsx` — Source Citations

**কী করে:** AI কোন document থেকে উত্তর দিয়েছে সেটা দেখায়।

```tsx
// প্রতিটা citation এভাবে দেখায়:
// 📄 vpn_manual.pdf | Page 3 | 92% match
// "VPN সেটআপ করতে প্রথমে network settings..."

export function CitationList({ citations }) {
  return (
    <div>
      {citations.map((c, i) => (
        <div key={i}>
          <span>📄 {c.file}</span>
          <span>Page {c.page}</span>
          <span>{(c.relevance * 100).toFixed(0)}% match</span>
          <p>{c.snippet}</p>  {/* ১৫০ characters preview */}
        </div>
      ))}
    </div>
  );
}
```

---

## ✏️ `src/components/ChatInput.tsx` — Input Field

**কী করে:** User-এর message নেয় এবং পাঠায়।

```tsx
// Features:
// - Enter to send, Shift+Enter for new line
// - Disabled while loading
// - Character limit indicator
// - Send button

const handleKeyDown = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();  // Send on Enter
  }
  // Shift+Enter = new line (default behavior)
};
```

---

## 🎯 `src/hooks/useChat.ts` — Chat Logic (সবচেয়ে গুরুত্বপূর্ণ Hook)

**কী করে:** Chat state manage করে এবং streaming handle করে।

### State Management:
```typescript
const [messages, setMessages] = useState<ChatMessage[]>(loadMessages);
// messages: localStorage থেকে load (page refresh করলেও থাকে)

const [isLoading, setIsLoading] = useState(false);
// isLoading: AI উত্তর দিচ্ছে কিনা
```

### `send(question)` Function — মূল logic:
```typescript
const send = async (question: string) => {
  // 1. User message add করো
  const userMsg = { id: generateId(), role: 'user', content: question, ... };
  
  // 2. Empty AI message add করো (loading state)
  const botMsg = { id: botMsgId, role: 'assistant', content: '', isLoading: true,
                   statusMessage: '🔍 Searching knowledge base...' };
  
  setMessages([...prev, userMsg, botMsg]);
  
  // 3. Streaming শুরু করো
  for await (const event of streamMessage(question)) {
    
    if (event.type === 'status') {
      // "📄 Found relevant docs — generating answer..."
      setMessages(prev => prev.map(m => 
        m.id === botMsgId ? { ...m, statusMessage: event.message } : m
      ));
    }
    
    else if (event.type === 'chunk') {
      // নতুন word/token append করো
      setMessages(prev => prev.map(m =>
        m.id === botMsgId ? { ...m, content: m.content + event.content } : m
      ));
    }
    
    else if (event.type === 'citations') {
      // Citations save করো
      setMessages(prev => prev.map(m =>
        m.id === botMsgId ? { ...m, citations: event.citations } : m
      ));
    }
    
    else if (event.type === 'done') {
      // isLoading false করো
      setMessages(prev => prev.map(m =>
        m.id === botMsgId ? { ...m, isLoading: false } : m
      ));
    }
    
    else if (event.type === 'error') {
      throw new Error(event.message);
    }
  }
};
```

### localStorage Persistence:
```typescript
// Page refresh করলেও messages থাকবে
useEffect(() => {
  saveMessages(messages);  // যখনই messages change হয়
}, [messages]);

function loadMessages() {
  const raw = localStorage.getItem('chat_messages');
  return raw ? JSON.parse(raw) : [];
}

function saveMessages(msgs) {
  localStorage.setItem('chat_messages', JSON.stringify(
    msgs.filter(m => !m.isLoading)  // Loading state save করবে না
        .slice(-100)  // Last 100 messages only
  ));
}
```

---

## 🔑 `src/hooks/useAuth.ts` — Authentication Logic

**কী করে:** Login/logout manage করে এবং token localStorage-এ রাখে।

```typescript
export function useAuth() {
  // localStorage থেকে token load (page refresh করলে login থাকে)
  const [token, setToken] = useState(() => localStorage.getItem('auth_token'));
  const [username, setUsername] = useState(() => localStorage.getItem('auth_username'));

  const login = async (user: string, pass: string) => {
    const res = await apiLogin(user, pass);  // Backend-এ POST /api/auth/login
    localStorage.setItem('auth_token', res.access_token);
    localStorage.setItem('auth_username', res.username);
    setToken(res.access_token);
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_username');
    localStorage.removeItem('chat_messages');
    setToken(null);
  };

  return {
    token,
    username,
    isAuthenticated: !!token,  // token থাকলে true, না থাকলে false
    login,
    logout,
  };
}
```

---

## 📡 `src/api/client.ts` — Backend Communication

**কী করে:** Backend API-তে HTTP requests করে।

```typescript
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Login করা
export async function login(username: string, password: string) {
  const res = await axios.post(`${BASE_URL}/auth/login`, { username, password });
  return res.data; // { access_token, username }
}

// Streaming chat — সবচেয়ে complex function
export async function* streamMessage(question: string) {
  const token = localStorage.getItem('auth_token');
  
  const response = await fetch(`${BASE_URL}/chat/stream`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,  // JWT token
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ question }),
  });

  // Server-Sent Events পড়া (line by line)
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const json = JSON.parse(line.slice(6));
        yield json;  // {"type": "chunk", "content": "VPN"} এই format-এ
      }
    }
  }
}
```

**`async function*` কী?**
> এটা একটা async generator। `yield` দিয়ে একটা একটা করে value return করে। `for await (const event of streamMessage())` দিয়ে পড়া যায়।

---

## 📝 `src/types/chat.ts` — TypeScript Interfaces

**কী করে:** সব data type define করে যাতে TypeScript error ধরতে পারে।

```typescript
// একটা chat message কেমন দেখতে হবে
interface ChatMessage {
  id: string;                    // Unique identifier
  role: 'user' | 'assistant';   // শুধু এই দুটোই allowed
  content: string;               // Message text
  citations?: Citation[];        // Optional (AI message-এ থাকে)
  timestamp: Date;
  isLoading?: boolean;           // AI উত্তর দিচ্ছে কিনা
  sourceType?: 'knowledge_base' | 'general_knowledge';
  statusMessage?: string;        // "🔍 Searching..." etc
}

// একটা citation/source
interface Citation {
  file: string;      // "vpn_manual.pdf"
  page: number;      // 3
  snippet: string;   // "VPN setup করতে..."
  relevance: number; // 0.923
}
```

**TypeScript কেন?**
> JavaScript-এ type নেই, তাই runtime-এ bug ধরা কঠিন। TypeScript compile-এই বলে দেয় কোথায় ভুল আছে।

---

## 🔄 Component Communication (State কীভাবে ভাগ হয়)

```
App.tsx
├── useAuth() → isAuthenticated, login, logout, username
│   └── passes to: LoginPage, Sidebar
│
├── useChat() → messages, isLoading, send, clear
│   └── passes to:
│       ├── ChatWindow (messages দেখানোর জন্য)
│       ├── ChatInput (send function)
│       └── Header (clear function, messageCount)
│
└── sidebarOpen (local state)
    └── controls: Sidebar visibility
```

**Prop Drilling Pattern:**
> State `App.tsx`-এ থাকে এবং `props` দিয়ে child component-এ পাঠানো হয়।  
> উদাহরণ: `send` function `App → ChatInput` এ যায়, user type করলে call হয়।
