export interface Agent {
  id: string;
  tenantId: string;
  ownerId: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  systemPrompt: string;
  greetingMessage?: string;
  conversationStarters?: string[];
  provider: LlmProvider;
  model: string;
  modelConfig?: ModelConfig;
  ragEnabled: boolean;
  category?: AgentCategory;
  isPublic: boolean;
  isSystem: boolean;
  status: AgentStatus;
  usageCount: number;
  knowledgeSourceCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AgentCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  displayOrder: number;
}

export interface ModelConfig {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

export type LlmProvider = 'OPENAI' | 'ANTHROPIC' | 'GEMINI' | 'OLLAMA';
export type AgentStatus = 'ACTIVE' | 'INACTIVE' | 'DELETED';

export interface CreateAgentRequest {
  name: string;
  description?: string;
  avatarUrl?: string;
  systemPrompt: string;
  greetingMessage?: string;
  conversationStarters?: string[];
  provider: LlmProvider;
  model: string;
  modelConfig?: ModelConfig;
  ragEnabled?: boolean;
  categoryId?: string;
  isPublic?: boolean;
}

export interface UpdateAgentRequest extends Partial<CreateAgentRequest> {}

export interface ProviderInfo {
  provider: LlmProvider;
  displayName: string;
  enabled: boolean;
  models: ModelInfo[];
  supportsStreaming: boolean;
  supportsEmbeddings: boolean;
}

export interface ModelInfo {
  id: string;
  name: string;
  description?: string;
  maxTokens: number;
  supportsVision: boolean;
  isDefault: boolean;
}

export interface KnowledgeSource {
  id: string;
  agentId: string;
  name: string;
  description?: string;
  sourceType: 'FILE' | 'URL' | 'TEXT';
  fileType?: 'PDF' | 'TXT' | 'MD' | 'CSV' | 'DOCX';
  fileSize?: number;
  url?: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  chunkCount: number;
  errorMessage?: string;
  processedAt?: string;
  createdAt: string;
}
