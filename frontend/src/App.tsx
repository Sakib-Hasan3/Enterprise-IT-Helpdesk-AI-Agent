import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ChatWindow } from './components/ChatWindow';
import { ChatInput } from './components/ChatInput';
import { useChat } from './hooks/useChat';

export default function App() {
  const { messages, isLoading, send, clear } = useChat();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Keyboard shortcut: Cmd/Ctrl + K to start new chat
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

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50 font-sans">
      {/* Navigation Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewChat={clear}
        onSelectPrompt={send}
      />

      {/* Main Content Area */}
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