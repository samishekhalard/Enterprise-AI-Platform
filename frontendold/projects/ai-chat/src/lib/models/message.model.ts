export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  tokenCount?: number;
  ragContext?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt: string;
  isStreaming?: boolean;
}

export type MessageRole = 'USER' | 'ASSISTANT' | 'SYSTEM';

export interface SendMessageRequest {
  content: string;
  stream?: boolean;
}

export interface StreamChunk {
  type: 'start' | 'content' | 'done' | 'error';
  content?: string;
  done: boolean;
  messageId?: string;
  tokenCount?: number;
  error?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}
