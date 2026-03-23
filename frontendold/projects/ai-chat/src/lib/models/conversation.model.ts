export interface Conversation {
  id: string;
  tenantId: string;
  userId: string;
  agentId: string;
  agentName?: string;
  agentAvatarUrl?: string;
  title: string;
  messageCount: number;
  totalTokens: number;
  status: ConversationStatus;
  lastMessageAt?: string;
  createdAt: string;
}

export type ConversationStatus = 'ACTIVE' | 'ARCHIVED' | 'DELETED';

export interface CreateConversationRequest {
  agentId: string;
  title?: string;
  initialMessage?: string;
}
