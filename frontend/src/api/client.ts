import axios from 'axios';
import type { ChatRequest, ChatResponse, DocumentListResponse, HealthInfo } from '../types/chat';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 120000, // 120s — avoids timeout during model cold start
  headers: { 'Content-Type': 'application/json' },
});

export async function sendMessage(question: string): Promise<ChatResponse> {
  const payload: ChatRequest = { question };
  const { data } = await api.post<ChatResponse>('/chat', payload);
  return data;
}

export async function fetchDocuments(): Promise<DocumentListResponse> {
  const { data } = await api.get<DocumentListResponse>('/documents');
  return data;
}

export async function checkHealth(): Promise<HealthInfo> {
  const { data } = await api.get<HealthInfo>('/health');
  return data;
}