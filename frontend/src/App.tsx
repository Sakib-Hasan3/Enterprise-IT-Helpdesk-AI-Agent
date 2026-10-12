import { useEffect } from 'react';
import { Header } from './components/Header';
import { ChatWindow } from './components/ChatWindow';
import { ChatInput } from './components/ChatInput';
import { useChat } from './hooks/useChat';

export default function App() {
  const { messages, isLoading, send, clear } = useChat();

  // Suggestion chip click listener
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<string>;
      send(ce.detail);
    };
    window.addEventListener('suggestion-click', handler);
    return () => window.removeEventListener('suggestion-click', handler);
  }, [send]);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header onClear={clear} />
      <ChatWindow messages={messages} />
      <ChatInput onSend={send} disabled={isLoading} />
    </div>
  );
}