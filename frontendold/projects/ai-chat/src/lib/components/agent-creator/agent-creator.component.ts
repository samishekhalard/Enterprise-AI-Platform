import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatStore } from '../../store/chat.store';
import { AiAgentService } from '../../services/agent.service';
import { CreateAgentRequest, LlmProvider, ProviderInfo, ModelInfo } from '../../models/agent.model';

@Component({
  selector: 'ai-agent-creator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="side-panel-overlay" (click)="close()"></div>
    <aside class="side-panel">
      <div class="panel-header">
        <h5 class="panel-title">
          <i class="bi bi-plus-circle"></i> Create New Agent
        </h5>
        <button class="panel-close" (click)="close()" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div class="panel-body">
          <form (ngSubmit)="createAgent()">
            <!-- Basic Info -->
            <div class="section">
              <h6 class="section-title">Basic Information</h6>

              <div class="mb-3">
                <label class="form-label">Name *</label>
                <input
                  type="text"
                  class="form-control"
                  [(ngModel)]="form.name"
                  name="name"
                  required
                  placeholder="My AI Assistant"
                />
              </div>

              <div class="mb-3">
                <label class="form-label">Description</label>
                <textarea
                  class="form-control"
                  [(ngModel)]="form.description"
                  name="description"
                  rows="2"
                  placeholder="Brief description of what this agent does"
                ></textarea>
              </div>

              <div class="mb-3">
                <label class="form-label">Avatar URL</label>
                <input
                  type="url"
                  class="form-control"
                  [(ngModel)]="form.avatarUrl"
                  name="avatarUrl"
                  placeholder="https://example.com/avatar.png"
                />
              </div>
            </div>

            <!-- Provider & Model -->
            <div class="section">
              <h6 class="section-title">AI Model</h6>

              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label">Provider *</label>
                  <select
                    class="form-select"
                    [(ngModel)]="form.provider"
                    name="provider"
                    (ngModelChange)="onProviderChange($event)"
                    required
                  >
                    <option value="">Select Provider</option>
                    @for (provider of store.enabledProviders(); track provider.provider) {
                      <option [value]="provider.provider">{{ provider.displayName }}</option>
                    }
                  </select>
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">Model *</label>
                  <select
                    class="form-select"
                    [(ngModel)]="form.model"
                    name="model"
                    required
                    [disabled]="!form.provider"
                  >
                    <option value="">Select Model</option>
                    @for (model of availableModels(); track model.id) {
                      <option [value]="model.id">{{ model.name }}</option>
                    }
                  </select>
                </div>
              </div>

              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label">Temperature</label>
                  <input
                    type="range"
                    class="form-range"
                    [(ngModel)]="form.temperature"
                    name="temperature"
                    min="0"
                    max="2"
                    step="0.1"
                  />
                  <small class="text-muted">{{ form.temperature }} (0 = deterministic, 2 = creative)</small>
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">Max Tokens</label>
                  <input
                    type="number"
                    class="form-control"
                    [(ngModel)]="form.maxTokens"
                    name="maxTokens"
                    min="100"
                    max="128000"
                    step="100"
                  />
                </div>
              </div>
            </div>

            <!-- Behavior -->
            <div class="section">
              <h6 class="section-title">Behavior</h6>

              <div class="mb-3">
                <label class="form-label">System Prompt *</label>
                <textarea
                  class="form-control"
                  [(ngModel)]="form.systemPrompt"
                  name="systemPrompt"
                  rows="4"
                  required
                  placeholder="You are a helpful AI assistant..."
                ></textarea>
                <small class="text-muted">Instructions that define how the agent behaves</small>
              </div>

              <div class="mb-3">
                <label class="form-label">Greeting Message</label>
                <textarea
                  class="form-control"
                  [(ngModel)]="form.greetingMessage"
                  name="greetingMessage"
                  rows="2"
                  placeholder="Hello! How can I help you today?"
                ></textarea>
              </div>

              <div class="mb-3">
                <label class="form-label">Conversation Starters</label>
                <div class="starters-input">
                  <input
                    type="text"
                    class="form-control"
                    [(ngModel)]="newStarter"
                    name="newStarter"
                    placeholder="Add a starter question..."
                    (keydown.enter)="addStarter($event)"
                  />
                  <button type="button" class="btn btn-outline-primary" (click)="addStarter()">
                    <i class="bi bi-plus"></i>
                  </button>
                </div>
                <div class="starters-list">
                  @for (starter of form.conversationStarters; track starter; let i = $index) {
                    <span class="starter-tag">
                      {{ starter }}
                      <button type="button" (click)="removeStarter(i)">&times;</button>
                    </span>
                  }
                </div>
              </div>
            </div>

            <!-- Settings -->
            <div class="section">
              <h6 class="section-title">Settings</h6>

              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label">Category</label>
                  <select class="form-select" [(ngModel)]="form.categoryId" name="categoryId">
                    <option value="">No Category</option>
                    @for (category of store.categories(); track category.id) {
                      <option [value]="category.id">{{ category.name }}</option>
                    }
                  </select>
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">Visibility</label>
                  <div class="form-check">
                    <input
                      type="checkbox"
                      class="form-check-input"
                      [(ngModel)]="form.isPublic"
                      name="isPublic"
                      id="isPublic"
                    />
                    <label class="form-check-label" for="isPublic">
                      Make this agent public
                    </label>
                  </div>
                </div>
              </div>

              <div class="form-check">
                <input
                  type="checkbox"
                  class="form-check-input"
                  [(ngModel)]="form.ragEnabled"
                  name="ragEnabled"
                  id="ragEnabled"
                />
                <label class="form-check-label" for="ragEnabled">
                  Enable RAG (Knowledge Sources)
                </label>
              </div>
            </div>
          </form>
        </div>

        <div class="panel-footer">
          <button class="btn btn-secondary" (click)="close()">Cancel</button>
          <button
            class="btn btn-primary"
            (click)="createAgent()"
            [disabled]="!isValid() || isSubmitting()"
          >
            @if (isSubmitting()) {
              <span class="spinner-border spinner-border-sm"></span>
              Creating...
            } @else {
              <i class="bi bi-check-lg"></i> Create Agent
            }
          </button>
        </div>
    </aside>
  `,
  styles: [`
    .side-panel-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.3);
      z-index: 1040;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .side-panel {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      width: 100%;
      max-width: 480px;
      background: white;
      z-index: 1050;
      display: flex;
      flex-direction: column;
      box-shadow: -4px 0 32px rgba(0, 0, 0, 0.12), -2px 0 8px rgba(0, 0, 0, 0.06);
      animation: slideIn 0.25s ease;
    }

    @keyframes slideIn {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }

    @media (min-width: 768px) {
      .side-panel {
        max-width: 560px;
      }
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      border-bottom: 1px solid #e2e8f0;
      background: #faf9f5;
    }

    .panel-title {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 0;
      font-weight: 600;
      font-size: 1.1rem;
      color: #1a202c;
    }

    .panel-close {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      padding: 0;
      background: transparent;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      color: #545e6e;
      transition: all 0.15s ease;
    }

    .panel-close svg {
      width: 20px;
      height: 20px;
    }

    .panel-close:hover {
      background: #e2e8f0;
      color: #1a202c;
    }

    .panel-body {
      flex: 1;
      overflow-y: auto;
      padding: 20px 24px;
    }

    .section {
      margin-bottom: 24px;
      padding-bottom: 24px;
      border-bottom: 1px solid var(--bs-border-color, #dee2e6);
    }

    .section:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }

    .section-title {
      margin-bottom: 16px;
      font-weight: 600;
      color: var(--bs-primary, #0d6efd);
    }

    .starters-input {
      display: flex;
      gap: 8px;
    }

    .starters-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 8px;
    }

    .starter-tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      background: var(--bs-light, #f8f9fa);
      border: 1px solid var(--bs-border-color, #dee2e6);
      border-radius: 16px;
      font-size: 0.85rem;
    }

    .starter-tag button {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      margin-left: 4px;
      color: var(--bs-secondary, #6c757d);
    }

    .starter-tag button:hover {
      color: var(--bs-danger, #dc3545);
    }

    .panel-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 24px;
      border-top: 1px solid #e2e8f0;
      background: #faf9f5;
    }
  `]
})
export class AgentCreatorComponent implements OnInit {
  readonly store = inject(ChatStore);
  private readonly agentService = inject(AiAgentService);

  isSubmitting = signal(false);
  availableModels = signal<ModelInfo[]>([]);
  newStarter = '';

  form = {
    name: '',
    description: '',
    avatarUrl: '',
    systemPrompt: 'You are a helpful AI assistant.',
    greetingMessage: 'Hello! How can I help you today?',
    conversationStarters: [] as string[],
    provider: '' as LlmProvider | '',
    model: '',
    temperature: 0.7,
    maxTokens: 4096,
    categoryId: '',
    isPublic: false,
    ragEnabled: false
  };

  ngOnInit(): void {
    this.store.loadProviders();
  }

  onProviderChange(provider: LlmProvider): void {
    const providerInfo = this.store.providers().find(p => p.provider === provider);
    if (providerInfo) {
      this.availableModels.set(providerInfo.models);
      const defaultModel = providerInfo.models.find(m => m.isDefault);
      this.form.model = defaultModel?.id || providerInfo.models[0]?.id || '';
    } else {
      this.availableModels.set([]);
      this.form.model = '';
    }
  }

  addStarter(event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    if (this.newStarter.trim()) {
      this.form.conversationStarters.push(this.newStarter.trim());
      this.newStarter = '';
    }
  }

  removeStarter(index: number): void {
    this.form.conversationStarters.splice(index, 1);
  }

  isValid(): boolean {
    return !!(
      this.form.name.trim() &&
      this.form.provider &&
      this.form.model &&
      this.form.systemPrompt.trim()
    );
  }

  async createAgent(): Promise<void> {
    if (!this.isValid() || this.isSubmitting()) return;

    this.isSubmitting.set(true);

    try {
      const request: CreateAgentRequest = {
        name: this.form.name.trim(),
        description: this.form.description.trim() || undefined,
        avatarUrl: this.form.avatarUrl.trim() || undefined,
        systemPrompt: this.form.systemPrompt.trim(),
        greetingMessage: this.form.greetingMessage.trim() || undefined,
        conversationStarters: this.form.conversationStarters.length > 0 ? this.form.conversationStarters : undefined,
        provider: this.form.provider as LlmProvider,
        model: this.form.model,
        modelConfig: {
          temperature: this.form.temperature,
          maxTokens: this.form.maxTokens
        },
        categoryId: this.form.categoryId || undefined,
        isPublic: this.form.isPublic,
        ragEnabled: this.form.ragEnabled
      };

      const agent = await this.agentService.createAgent(request).toPromise();
      if (agent) {
        this.store.selectAgent(agent);
        this.close();
      }
    } catch (error) {
      console.error('Failed to create agent', error);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  close(): void {
    this.store.closeAgentCreator();
  }
}
