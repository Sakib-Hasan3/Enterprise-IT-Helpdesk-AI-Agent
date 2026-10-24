import { useState, useCallback, useEffect } from 'react';
import { streamMessage } from '../api/client';
import type { ChatMessage, Citation } from '../types/chat';

function generateId() {
  return Math.random().toString(36).slice(2, 11);
}

const STORAGE_KEY = 'chat_messages';
const MAX_STORED   = 100; // keep last 100 messages

function loadMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    // Rehydrate Date objects (JSON.parse makes them strings)
    return JSON.parse(raw).map((m: any) => ({
      ...m,
      timestamp: new Date(m.timestamp),
    }));
  } catch {
    return [];
  }
}

function saveMessages(msgs: ChatMessage[]) {
  try {
    // Don't persist loading states or statusMessages
    const clean = msgs
      .filter((m) => !m.isLoading)
      .slice(-MAX_STORED)
      .map(({ statusMessage: _sm, isLoading: _il, ...rest }) => rest);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
  } catch {
    /* storage full — silently ignore */
  }
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(loadMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  // Persist whenever messages change
  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  const send = useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (!trimmed || isLoading) return;

      setError(null);

      const userMsg: ChatMessage = {
        id:        generateId(),
        role:      'user',
        content:   trimmed,
        timestamp: new Date(),
      };

      const botMsgId = generateId();
      const botMsg: ChatMessage = {
        id:            botMsgId,
        role:          'assistant',
        content:       '',
        timestamp:     new Date(),
        isLoading:     true,
        statusMessage: '🔍 Searching knowledge base...',
      };

      setMessages((prev) => [...prev, userMsg, botMsg]);
      setIsLoading(true);

      try {
        for await (const event of streamMessage(trimmed)) {
          if (event.type === 'status') {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === botMsgId ? { ...m, statusMessage: event.message } : m
              )
            );
          } else if (event.type === 'chunk') {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === botMsgId
                  ? { ...m, content: m.content + event.content, statusMessage: undefined }
                  : m
              )
            );
          } else if (event.type === 'citations') {
            const citations: Citation[] = (event.citations ?? []).map((c: any) => ({
              file:      c.file,
              page:      c.page,
              snippet:   c.snippet,
              relevance: c.relevance,
            }));
            setMessages((prev) =>
              prev.map((m) =>
                m.id === botMsgId
                  ? { ...m, citations, sourceType: event.source_type as any }
                  : m
              )
            );
          } else if (event.type === 'done') {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === botMsgId
                  ? { ...m, isLoading: false, statusMessage: undefined }
                  : m
              )
            );
          } else if (event.type === 'error') {
            throw new Error(event.message);
          }
        }
      } catch (e: any) {
        const errMsg = e?.message || 'Sorry, I could not reach the server. Please try again.';
        setError(errMsg);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botMsgId
              ? {
                  ...m,
                  content:       `❌ ${errMsg}`,
                  isLoading:     false,
                  statusMessage: undefined,
                }
              : m
          )
        );
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading]
  );

  const clear = useCallback(() => {
    setMessages([]);
    setError(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { messages, isLoading, error, send, clear };
}