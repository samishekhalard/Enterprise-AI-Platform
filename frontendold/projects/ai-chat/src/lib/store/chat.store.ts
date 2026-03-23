import { Injectable, inject, signal, computed } from '@angular/core';
import { Agent, AgentCategory, ProviderInfo } from '../models/agent.model';
import { Conversation } from '../models/conversation.model';
import { Message, StreamChunk } from '../models/message.model';
import { AiAgentService } from '../services/agent.service';
import { AiConversationService } from '../services/conversation.service';
import { SseStreamService } from '../services/sse-stream.service';

export interface ChatState {
  // Agents
  agents: Agent[];
  selectedAgent: Agent | null;
  categories: AgentCategory[];
  providers: ProviderInfo[];

  // Conversations
  conversations: Conversation[];
  currentConversation: Conversation | null;

  // Messages
  messages: Message[];

  // UI State
  isLoading: boolean;
  isStreaming: boolean;
  streamingContent: string;
  error: string | null;

  // Panels
  showAgentExplorer: boolean;
  showAgentCreator: boolean;
  showKnowledgeManager: boolean;
}

const INITIAL_STATE: ChatState = {
  agents: [],
  selectedAgent: null,
  categories: [],
  providers: [],
  conversations: [],
  currentConversation: null,
  messages: [],
  isLoading: false,
  isStreaming: false,
  streamingContent: '',
  error: null,
  showAgentExplorer: false,
  showAgentCreator: false,
  showKnowledgeManager: false
};

@Injectable({
  providedIn: 'root'
})
export class ChatStore {
  private readonly agentService = inject(AiAgentService);
  private readonly conversationService = inject(AiConversationService);
  private readonly sseService = inject(SseStreamService);

  // State
  private readonly _state = signal<ChatState>(INITIAL_STATE);

  // Public readonly state
  readonly state = this._state.asReadonly();

  // Computed selectors
  readonly agents = computed(() => this._state().agents);
  readonly selectedAgent = computed(() => this._state().selectedAgent);
  readonly categories = computed(() => this._state().categories);
  readonly providers = computed(() => this._state().providers);
  readonly conversations = computed(() => this._state().conversations);
  readonly currentConversation = computed(() => this._state().currentConversation);
  readonly messages = computed(() => this._state().messages);
  readonly isLoading = computed(() => this._state().isLoading);
  readonly isStreaming = computed(() => this._state().isStreaming);
  readonly streamingContent = computed(() => this._state().streamingContent);
  readonly error = computed(() => this._state().error);
  readonly showAgentExplorer = computed(() => this._state().showAgentExplorer);
  readonly showAgentCreator = computed(() => this._state().showAgentCreator);
  readonly showKnowledgeManager = computed(() => this._state().showKnowledgeManager);

  readonly hasSelectedAgent = computed(() => this._state().selectedAgent !== null);
  readonly hasCurrentConversation = computed(() => this._state().currentConversation !== null);
  readonly enabledProviders = computed(() =>
    this._state().providers.filter(p => p.enabled)
  );

  // Actions
  private updateState(partial: Partial<ChatState>): void {
    this._state.update(state => ({ ...state, ...partial }));
  }

  setBaseUrl(url: string): void {
    this.agentService.setBaseUrl(url);
    this.conversationService.setBaseUrl(url);
    this.sseService.setBaseUrl(url);
  }

  // Agent Actions
  async loadAgents(): Promise<void> {
    this.updateState({ isLoading: true, error: null });
    try {
      const response = await this.agentService.getAccessibleAgents().toPromise();
      this.updateState({ agents: response?.content || [], isLoading: false });
    } catch (error) {
      this.updateState({ error: 'Failed to load agents', isLoading: false });
    }
  }

  async loadMyAgents(): Promise<void> {
    this.updateState({ isLoading: true, error: null });
    try {
      const response = await this.agentService.getMyAgents().toPromise();
      this.updateState({ agents: response?.content || [], isLoading: false });
    } catch (error) {
      this.updateState({ error: 'Failed to load my agents', isLoading: false });
    }
  }

  async searchAgents(query: string): Promise<void> {
    this.updateState({ isLoading: true, error: null });
    try {
      const response = await this.agentService.searchAgents(query).toPromise();
      this.updateState({ agents: response?.content || [], isLoading: false });
    } catch (error) {
      this.updateState({ error: 'Failed to search agents', isLoading: false });
    }
  }

  async loadCategories(): Promise<void> {
    try {
      const categories = await this.agentService.getCategories().toPromise();
      this.updateState({ categories: categories || [] });
    } catch (error) {
      console.error('Failed to load categories', error);
    }
  }

  async loadProviders(): Promise<void> {
    try {
      const providers = await this.agentService.getEnabledProviders().toPromise();
      this.updateState({ providers: providers || [] });
    } catch (error) {
      console.error('Failed to load providers', error);
    }
  }

  selectAgent(agent: Agent): void {
    this.updateState({
      selectedAgent: agent,
      showAgentExplorer: false
    });
  }

  clearSelectedAgent(): void {
    this.updateState({
      selectedAgent: null,
      currentConversation: null,
      messages: []
    });
  }

  // Conversation Actions
  async loadConversations(agentId?: string): Promise<void> {
    this.updateState({ isLoading: true, error: null });
    try {
      const response = await this.conversationService.getConversations(0, 20, agentId).toPromise();
      this.updateState({ conversations: response?.content || [], isLoading: false });
    } catch (error) {
      this.updateState({ error: 'Failed to load conversations', isLoading: false });
    }
  }

  async loadRecentConversations(): Promise<void> {
    try {
      const conversations = await this.conversationService.getRecentConversations().toPromise();
      this.updateState({ conversations: conversations || [] });
    } catch (error) {
      console.error('Failed to load recent conversations', error);
    }
  }

  async createConversation(agentId: string, initialMessage?: string): Promise<void> {
    this.updateState({ isLoading: true, error: null });
    try {
      const conversation = await this.conversationService.createConversation({
        agentId,
        initialMessage
      }).toPromise();

      if (conversation) {
        this.updateState({
          currentConversation: conversation,
          conversations: [conversation, ...this._state().conversations],
          messages: [],
          isLoading: false
        });
      }
    } catch (error) {
      this.updateState({ error: 'Failed to create conversation', isLoading: false });
    }
  }

  async selectConversation(conversationId: string): Promise<void> {
    this.updateState({ isLoading: true, error: null });
    try {
      const [conversation, messagesResponse] = await Promise.all([
        this.conversationService.getConversation(conversationId).toPromise(),
        this.conversationService.getMessages(conversationId).toPromise()
      ]);

      this.updateState({
        currentConversation: conversation || null,
        messages: messagesResponse?.content || [],
        isLoading: false
      });
    } catch (error) {
      this.updateState({ error: 'Failed to load conversation', isLoading: false });
    }
  }

  clearCurrentConversation(): void {
    this.updateState({
      currentConversation: null,
      messages: []
    });
  }

  // Message Actions
  async sendMessage(content: string, stream = true): Promise<void> {
    const conversation = this._state().currentConversation;
    if (!conversation) {
      // Create new conversation if none exists
      const agent = this._state().selectedAgent;
      if (agent) {
        await this.createConversation(agent.id, content);
      }
      return;
    }

    // Add user message to UI immediately
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      conversationId: conversation.id,
      role: 'USER',
      content,
      createdAt: new Date().toISOString()
    };

    this.updateState({
      messages: [...this._state().messages, userMessage],
      error: null
    });

    if (stream) {
      await this.streamMessage(conversation.id, content);
    } else {
      await this.sendNonStreamingMessage(conversation.id, content);
    }
  }

  private async streamMessage(conversationId: string, content: string): Promise<void> {
    this.updateState({ isStreaming: true, streamingContent: '' });

    // Add placeholder for assistant message
    const assistantMessage: Message = {
      id: `streaming-${Date.now()}`,
      conversationId,
      role: 'ASSISTANT',
      content: '',
      createdAt: new Date().toISOString(),
      isStreaming: true
    };

    this.updateState({
      messages: [...this._state().messages, assistantMessage]
    });

    this.sseService.streamMessage(conversationId, { content, stream: true }).subscribe({
      next: (chunk: StreamChunk) => {
        if (chunk.type === 'content' && chunk.content) {
          const newContent = this._state().streamingContent + chunk.content;
          this.updateState({ streamingContent: newContent });

          // Update the streaming message
          const messages = this._state().messages.map(m =>
            m.isStreaming ? { ...m, content: newContent } : m
          );
          this.updateState({ messages });
        } else if (chunk.type === 'done') {
          // Finalize the message
          const messages = this._state().messages.map(m =>
            m.isStreaming ? { ...m, isStreaming: false, id: chunk.messageId || m.id } : m
          );
          this.updateState({
            messages,
            isStreaming: false,
            streamingContent: ''
          });
        }
      },
      error: (error) => {
        console.error('Stream error:', error);
        // Remove the streaming message on error
        const messages = this._state().messages.filter(m => !m.isStreaming);
        this.updateState({
          messages,
          isStreaming: false,
          streamingContent: '',
          error: 'Failed to get response'
        });
      },
      complete: () => {
        this.updateState({ isStreaming: false });
      }
    });
  }

  private async sendNonStreamingMessage(conversationId: string, content: string): Promise<void> {
    this.updateState({ isLoading: true });
    try {
      const message = await this.conversationService.sendMessage(conversationId, { content, stream: false }).toPromise();
      if (message) {
        this.updateState({
          messages: [...this._state().messages, message],
          isLoading: false
        });
      }
    } catch (error) {
      this.updateState({ error: 'Failed to send message', isLoading: false });
    }
  }

  // UI Actions
  toggleAgentExplorer(): void {
    this.updateState({ showAgentExplorer: !this._state().showAgentExplorer });
  }

  openAgentExplorer(): void {
    this.updateState({ showAgentExplorer: true });
  }

  closeAgentExplorer(): void {
    this.updateState({ showAgentExplorer: false });
  }

  toggleAgentCreator(): void {
    this.updateState({ showAgentCreator: !this._state().showAgentCreator });
  }

  openAgentCreator(): void {
    this.updateState({ showAgentCreator: true, showAgentExplorer: false });
  }

  closeAgentCreator(): void {
    this.updateState({ showAgentCreator: false });
  }

  toggleKnowledgeManager(): void {
    this.updateState({ showKnowledgeManager: !this._state().showKnowledgeManager });
  }

  openKnowledgeManager(): void {
    this.updateState({ showKnowledgeManager: true });
  }

  closeKnowledgeManager(): void {
    this.updateState({ showKnowledgeManager: false });
  }

  clearError(): void {
    this.updateState({ error: null });
  }

  // Initialize
  async initialize(): Promise<void> {
    await Promise.all([
      this.loadAgents(),
      this.loadCategories(),
      this.loadProviders(),
      this.loadRecentConversations()
    ]);
  }
}
