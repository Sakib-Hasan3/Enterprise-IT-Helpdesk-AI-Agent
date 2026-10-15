export interface Citation {
  file: string;
  page: number;
  snippet: string;
  relevance: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  timestamp: Date;
  isLoading?: boolean;
  sourceType?: 'knowledge_base' | 'general_knowledge';
  statusMessage?: string; // shown while streaming/retrieving
}

export interface ChatRequest {
  question: string;
}

export interface ChatResponse {
  answer: string;
  citations: Citation[];
  chunks_used: number;
  source_type?: 'knowledge_base' | 'general_knowledge';
}

export interface DocumentInfo {
  id: string;
  name: string;
  chunks: number;
}

export interface DocumentListResponse {
  total: number;
  documents: DocumentInfo[];
}

export interface HealthInfo {
  status: string;
  qdrant: string;
  llm: string;
  version: string;
}

// Auth
export interface LoginRequest {
  username: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  username: string;
}