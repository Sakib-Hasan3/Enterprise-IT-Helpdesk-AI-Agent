import axios from 'axios';
import type { ChatRequest, ChatResponse, LoginRequest, TokenResponse } from '../types/chat';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// ── Axios instance ────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: API_URL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto logout on 401
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_username');
      window.location.reload();
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export async function login(username: string, password: string): Promise<TokenResponse> {
  const req: LoginRequest = { username, password };
  const { data } = await api.post<TokenResponse>('/auth/login', req);
  return data;
}

export async function verifyToken(): Promise<boolean> {
  try {
    await api.get('/auth/me');
    return true;
  } catch {
    return false;
  }
}

// ── Chat (non-streaming fallback) ─────────────────────────────────────────────
export async function sendMessage(question: string): Promise<ChatResponse> {
  const payload: ChatRequest = { question };
  const { data } = await api.post<ChatResponse>('/chat', payload);
  return data;
}

// ── Streaming (SSE via fetch) ─────────────────────────────────────────────────
export type StreamEvent =
  | { type: 'status';    message: string }
  | { type: 'chunk';     content: string }
  | { type: 'citations'; citations: any[]; source_type: string; chunks_used: number }
  | { type: 'done' }
  | { type: 'error';     message: string };

export async function* streamMessage(question: string): AsyncGenerator<StreamEvent> {
  const token = localStorage.getItem('auth_token') ?? '';

  const response = await fetch(`${API_URL}/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ question }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  if (!response.body) throw new Error('No response body');

  const reader  = response.body.getReader();
  const decoder = new TextDecoder();
  let   buffer  = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (line.startsWith('data: ') && line.length > 6) {
          try {
            yield JSON.parse(line.slice(6)) as StreamEvent;
          } catch {
            /* skip malformed line */
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// ── Other ─────────────────────────────────────────────────────────────────────
export async function checkHealth() {
  const { data } = await api.get('/health');
  return data;
}

export async function fetchDocuments() {
  const { data } = await api.get('/documents');
  return data;
}