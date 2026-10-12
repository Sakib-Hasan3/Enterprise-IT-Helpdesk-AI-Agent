import { useState, useCallback } from 'react';
import { sendMessage } from '../api/client';
import type { ChatMessage } from '../types/chat';

function generateId() {
  return Math.random().toString(36).slice(2, 11);
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || isLoading) return;

    setError(null);

    // 1. User message যোগ করো
    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    // 2. Empty assistant message (loading state)
    const botMsgId = generateId();
    const botMsg: ChatMessage = {
      id: botMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    setIsLoading(true);

    try {
      const res = await sendMessage(trimmed);

      // 3. Assistant message update করো actual content দিয়ে
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botMsgId
            ? {
                ...m,
                content: res.answer,
                citations: res.citations,
                isLoading: false,
              }
            : m
        )
      );
    } catch (e: any) {
      setError(e?.message || 'Something went wrong');
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botMsgId
            ? {
                ...m,
                content:
                  '❌ Sorry, I could not reach the server. Please try again.',
                isLoading: false,
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const clear = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isLoading, error, send, clear };
}