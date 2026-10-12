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