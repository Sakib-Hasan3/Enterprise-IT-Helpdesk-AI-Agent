import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ChatWindow } from './components/ChatWindow';
import { ChatInput } from './components/ChatInput';
import { LoginPage } from './components/LoginPage';
import { useChat } from './hooks/useChat';
import { useAuth } from './hooks/useAuth';

export default function App() {
  const { isAuthenticated, isLoggingIn, loginError, login, logout, username } = useAuth();
  const { messages, isLoading, send, clear } = useChat();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Keyboard shortcut: Cmd/Ctrl + K → new chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        clear();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clear]);

  // ── Not authenticated → show login ─────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <LoginPage
        onLogin={login}
        isLoggingIn={isLoggingIn}
        loginError={loginError}
      />
    );
  }

  // ── Authenticated → show main app ──────────────────────────────────────────
  return (
    <div className="h-screen flex overflow-hidden bg-slate-50 font-sans">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewChat={clear}
        onSelectPrompt={send}
        username={username}
        onLogout={logout}
      />

      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        <Header
          onClear={clear}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          messageCount={messages.length}
        />

        <ChatWindow
          messages={messages}
          onSelectPrompt={send}
        />

        <ChatInput
          onSend={send}
          disabled={isLoading}
        />
      </main>
    </div>
  );
}