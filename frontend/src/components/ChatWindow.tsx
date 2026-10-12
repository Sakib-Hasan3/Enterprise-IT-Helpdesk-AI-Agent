import { useEffect, useRef } from 'react';
import type { ChatMessage } from '../types/chat';
import { MessageBubble } from './MessageBubble';

export function ChatWindow({ messages }: { messages: ChatMessage[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // নতুন message এলে auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🤖</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            How can I help you today?
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Ask me anything about IT — VPN, password reset, email setup, software installation.
          </p>
          <div className="grid grid-cols-1 gap-2 text-left">
            {[
              'How do I reset my password?',
              'VPN is not connecting, what should I do?',
              'What is incident management?',
            ].map((q) => (
              <SuggestionChip key={q} text={q} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="max-w-3xl mx-auto space-y-4">
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

// Small inline component
function SuggestionChip({ text }: { text: string }) {
  const handleClick = () => {
    const event = new CustomEvent('suggestion-click', { detail: text });
    window.dispatchEvent(event);
  };

  return (
    <button
      onClick={handleClick}
      className="text-left text-sm bg-white hover:bg-brand-50 border border-gray-200 hover:border-brand-300 rounded-lg px-4 py-2.5 text-gray-700 transition"
    >
      💡 {text}
    </button>
  );
}