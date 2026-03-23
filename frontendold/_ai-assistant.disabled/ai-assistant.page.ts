import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatPanelComponent, ChatStore } from '@emsist/ai-chat';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-ai-assistant-page',
  standalone: true,
  imports: [CommonModule, ChatPanelComponent],
  template: `
    <div class="ai-assistant-container">
      <!-- Left Toolbar - Miro Style -->
      <div class="toolbar-island">
        <button class="toolbar-btn"
                [class.active]="showHistory()"
                (click)="toggleHistory()"
                title="Conversations">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </button>
        <div class="toolbar-divider"></div>
        <button class="toolbar-btn" (click)="newConversation()" title="New Chat">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
        <button class="toolbar-btn" (click)="store.openAgentExplorer()" title="Browse Agents">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
          </svg>
        </button>
      </div>

      <!-- Main Chat Area -->
      <main class="chat-area">
        <ai-chat-panel [apiBaseUrl]="apiBaseUrl" />
      </main>

      <!-- History Side Panel -->
      @if (showHistory()) {
        <aside class="history-panel">
          <div class="panel-header">
            <h6>Conversations</h6>
            <button class="panel-close" (click)="showHistory.set(false)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div class="panel-body">
            <div class="conversation-list">
              @for (conv of store.conversations(); track conv.id) {
                <button
                  class="conversation-item"
                  [class.active]="store.currentConversation()?.id === conv.id"
                  (click)="selectConversation(conv.id)"
                >
                  <div class="conv-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a5 5 0 0 1 5 5h1"/>
                    </svg>
                  </div>
                  <div class="conv-content">
                    <span class="conv-title">{{ conv.title || 'New conversation' }}</span>
                    <span class="conv-meta">{{ conv.messageCount }} messages</span>
                  </div>
                  <span class="conv-time">{{ formatDate(conv.lastMessageAt) }}</span>
                </button>
              } @empty {
                <div class="empty-state">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  <p>No conversations yet</p>
                  <button class="btn-start" (click)="newConversation()">
                    Start a conversation
                  </button>
                </div>
              }
            </div>
          </div>
        </aside>
      }
    </div>
  `,
  styles: [`
    .ai-assistant-container {
      position: relative;
      display: flex;
      height: 100%;
      background: #faf9f5;
    }

    /* Toolbar Island - Miro Style */
    .toolbar-island {
      position: absolute;
      left: 24px;
      top: 50%;
      transform: translateY(-50%);
      z-index: 100;
      display: flex;
      flex-direction: column;
      gap: 4px;
      background: white;
      border-radius: 16px;
      padding: 8px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.06);
    }

    .toolbar-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      padding: 0;
      background: transparent;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      color: #545e6e;
      transition: all 0.15s ease;
    }

    .toolbar-btn svg {
      width: 22px;
      height: 22px;
      stroke-width: 1.5px;
    }

    .toolbar-btn:hover {
      background: #edf2f7;
      color: #1a202c;
    }

    .toolbar-btn.active {
      background: #047481;
      color: white;
    }

    .toolbar-divider {
      width: 28px;
      height: 1px;
      background: #e2e8f0;
      margin: 4px auto;
    }

    /* Main Chat Area */
    .chat-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      margin-left: 80px;
      padding: 24px;
      overflow: hidden;
    }

    .chat-area ::ng-deep ai-chat-panel {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .chat-area ::ng-deep .chat-panel {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.06);
    }

    /* History Side Panel */
    .history-panel {
      position: absolute;
      left: 80px;
      top: 24px;
      bottom: 24px;
      width: 320px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.06);
      display: flex;
      flex-direction: column;
      z-index: 50;
      animation: slideInLeft 0.25s ease;
    }

    @keyframes slideInLeft {
      from {
        opacity: 0;
        transform: translateX(-20px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid #e2e8f0;
    }

    .panel-header h6 {
      margin: 0;
      font-weight: 600;
      color: #1a202c;
    }

    .panel-close {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      padding: 0;
      background: transparent;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      color: #545e6e;
      transition: all 0.15s ease;
    }

    .panel-close svg {
      width: 18px;
      height: 18px;
    }

    .panel-close:hover {
      background: #edf2f7;
      color: #1a202c;
    }

    .panel-body {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
    }

    .conversation-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .conversation-item {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 12px;
      background: transparent;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      text-align: left;
      transition: all 0.15s ease;
    }

    .conversation-item:hover {
      background: #edf2f7;
    }

    .conversation-item.active {
      background: #047481;
      color: white;
    }

    .conv-icon {
      flex-shrink: 0;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #edf2f7;
      border-radius: 10px;
    }

    .conversation-item.active .conv-icon {
      background: rgba(255, 255, 255, 0.2);
    }

    .conv-icon svg {
      width: 18px;
      height: 18px;
    }

    .conv-content {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }

    .conv-title {
      font-weight: 500;
      font-size: 0.9rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .conv-meta {
      font-size: 0.75rem;
      color: #545e6e;
      margin-top: 2px;
    }

    .conversation-item.active .conv-meta {
      color: rgba(255, 255, 255, 0.7);
    }

    .conv-time {
      font-size: 0.7rem;
      color: #545e6e;
      flex-shrink: 0;
    }

    .conversation-item.active .conv-time {
      color: rgba(255, 255, 255, 0.7);
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px 16px;
      text-align: center;
    }

    .empty-state svg {
      width: 48px;
      height: 48px;
      color: #cbd5e0;
      margin-bottom: 12px;
    }

    .empty-state p {
      margin: 0 0 16px;
      color: #545e6e;
      font-size: 0.9rem;
    }

    .btn-start {
      padding: 10px 20px;
      background: #047481;
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s ease;
    }

    .btn-start:hover {
      background: #035a66;
    }

    /* Responsive adjustments */
    @media (max-width: 1024px) {
      .toolbar-island {
        left: 16px;
      }

      .chat-area {
        margin-left: 72px;
        padding: 16px;
      }

      .history-panel {
        left: 72px;
        top: 16px;
        bottom: 16px;
        width: 280px;
      }
    }

    @media (max-width: 768px) {
      .toolbar-island {
        left: 8px;
        padding: 6px;
      }

      .toolbar-btn {
        width: 40px;
        height: 40px;
      }

      .toolbar-btn svg {
        width: 20px;
        height: 20px;
      }

      .chat-area {
        margin-left: 56px;
        padding: 12px;
      }

      .history-panel {
        position: fixed;
        left: 0;
        top: 0;
        bottom: 0;
        width: 100%;
        max-width: 320px;
        border-radius: 0;
        z-index: 1000;
      }
    }
  `]
})
export class AiAssistantPage implements OnInit {
  readonly store = inject(ChatStore);
  apiBaseUrl = environment.apiUrl + '/api/v1';
  showHistory = signal(false);

  ngOnInit(): void {
    // Store will initialize via ChatPanelComponent
  }

  toggleHistory(): void {
    this.showHistory.update(v => !v);
  }

  newConversation(): void {
    this.store.clearCurrentConversation();
    this.showHistory.set(false);
  }

  selectConversation(id: string): void {
    this.store.selectConversation(id);
    this.showHistory.set(false);
  }

  formatDate(dateString?: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
