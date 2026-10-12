import axios from 'axios';
import type { ChatRequest, ChatResponse } from '../types/chat';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000, // 60s — LLM slow হতে পারে
  headers: { 'Content-Type': 'application/json' },
});

export async function sendMessage(question: string): Promise<ChatResponse> {
  const payload: ChatRequest = { question };
  const { data } = await api.post<ChatResponse>('/chat', payload);
  return data;
}

export async function checkHealth() {
  const { data } = await api.get('/health');
  return data;
}