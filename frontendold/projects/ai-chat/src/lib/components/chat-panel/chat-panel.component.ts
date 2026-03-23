import { Component, inject, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatStore } from '../../store/chat.store';
import { MessageListComponent } from '../message-list/message-list.component';
import { ChatInputComponent } from '../chat-input/chat-input.component';
import { AgentSelectorComponent } from '../agent-selector/agent-selector.component';
import { AgentExplorerComponent } from '../agent-explorer/agent-explorer.component';
import { AgentCreatorComponent } from '../agent-creator/agent-creator.component';

@Component({
  selector: 'ai-chat-panel',
  standalone: true,
  imports: [
    CommonModule,
    MessageListComponent,
    ChatInputComponent,
    AgentSelectorComponent,
    AgentExplorerComponent,
    AgentCreatorComponent
  ],
  template: `
    <div class="chat-panel">
      <!-- Header -->
      <div class="chat-header">
        <ai-agent-selector />
        <div class="header-actions">
          @if (store.hasCurrentConversation()) {
            <button class="btn btn-sm btn-outline-secondary" (click)="newConversation()">
              <i class="bi bi-plus-lg"></i> New Chat
            </button>
          }
        </div>
      </div>

      <!-- Main Content -->
      <div class="chat-content">
        @if (store.hasSelectedAgent()) {
          @if (store.hasCurrentConversation() || store.messages().length > 0) {
            <ai-message-list />
          } @else {
            <!-- Welcome Screen -->
            <div class="welcome-screen">
              <div class="agent-greeting">
                @if (store.selectedAgent()?.avatarUrl) {
                  <img [src]="store.selectedAgent()?.avatarUrl" alt="Agent" class="agent-avatar" />
                } @else {
                  <div class="agent-avatar-placeholder">
                    <i class="bi bi-robot"></i>
                  </div>
                }
                <h3>{{ store.selectedAgent()?.name }}</h3>
                <p class="greeting-message">
                  {{ store.selectedAgent()?.greetingMessage || 'How can I help you today?' }}
                </p>
              </div>

              @if (store.selectedAgent()?.conversationStarters?.length) {
                <div class="conversation-starters">
                  @for (starter of store.selectedAgent()?.conversationStarters; track starter) {
                    <button class="starter-btn" (click)="startConversation(starter)">
                      {{ starter }}
                    </button>
                  }
                </div>
              }
            </div>
          }
        } @else {
          <!-- No Agent Selected -->
          <div class="no-agent-screen">
            <div class="no-agent-content">
              <i class="bi bi-chat-dots"></i>
              <h3>Select an AI Assistant</h3>
              <p>Choose an agent to start your conversation</p>
              <button class="btn btn-primary" (click)="store.openAgentExplorer()">
                <i class="bi bi-grid"></i> Browse Agents
              </button>
            </div>
          </div>
        }
      </div>

      <!-- Input Area -->
      @if (store.hasSelectedAgent()) {
        <ai-chat-input />
      }

      <!-- Side Panels -->
      @if (store.showAgentExplorer()) {
        <ai-agent-explorer />
      }

      @if (store.showAgentCreator()) {
        <ai-agent-creator />
      }

      <!-- Error Toast -->
      @if (store.error()) {
        <div class="error-toast">
          <span>{{ store.error() }}</span>
          <button (click)="store.clearError()">&times;</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .chat-panel {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: white;
      border-radius: 16px;
      overflow: hidden;
    }

    .chat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid #e2e8f0;
      background: #faf9f5;
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }

    .chat-content {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
    }

    .welcome-screen {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      text-align: center;
      padding: 32px;
    }

    .agent-greeting {
      margin-bottom: 24px;
    }

    .agent-avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      margin-bottom: 16px;
      object-fit: cover;
    }

    .agent-avatar-placeholder {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
      font-size: 2rem;
      color: white;
    }

    .greeting-message {
      color: var(--bs-secondary, #6c757d);
      font-size: 1.1rem;
      max-width: 400px;
    }

    .conversation-starters {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: center;
      max-width: 500px;
    }

    .starter-btn {
      padding: 12px 20px;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      background: white;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 0.9rem;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    .starter-btn:hover {
      background: #047481;
      color: white;
      border-color: #047481;
      box-shadow: 0 2px 8px rgba(4, 116, 129, 0.3);
    }

    .no-agent-screen {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
    }

    .no-agent-content {
      text-align: center;
      padding: 32px;
    }

    .no-agent-content i {
      font-size: 4rem;
      color: var(--bs-secondary, #6c757d);
      margin-bottom: 16px;
    }

    .no-agent-content h3 {
      margin-bottom: 8px;
    }

    .no-agent-content p {
      color: var(--bs-secondary, #6c757d);
      margin-bottom: 24px;
    }

    .error-toast {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: var(--bs-danger, #dc3545);
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1050;
    }

    .error-toast button {
      background: none;
      border: none;
      color: white;
      font-size: 1.2rem;
      cursor: pointer;
      padding: 0;
      line-height: 1;
    }
  `]
})
export class ChatPanelComponent implements OnInit {
  @Input() apiBaseUrl?: string;

  readonly store = inject(ChatStore);

  ngOnInit(): void {
    if (this.apiBaseUrl) {
      this.store.setBaseUrl(this.apiBaseUrl);
    }
    this.store.initialize();
  }

  newConversation(): void {
    this.store.clearCurrentConversation();
  }

  startConversation(message: string): void {
    this.store.sendMessage(message);
  }
}
