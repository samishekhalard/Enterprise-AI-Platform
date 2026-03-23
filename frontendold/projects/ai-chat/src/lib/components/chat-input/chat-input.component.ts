import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatStore } from '../../store/chat.store';

@Component({
  selector: 'ai-chat-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-input-container">
      <div class="input-wrapper">
        <textarea
          [(ngModel)]="inputValue"
          (keydown.enter)="onEnter($any($event))"
          [disabled]="store.isStreaming()"
          placeholder="Type your message..."
          rows="1"
          class="chat-textarea"
          #textareaRef
          (input)="autoResize(textareaRef)"
        ></textarea>
        <div class="input-actions">
          @if (store.selectedAgent()?.ragEnabled) {
            <button
              class="action-btn"
              title="Knowledge Sources"
              (click)="store.openKnowledgeManager()"
            >
              <i class="bi bi-database"></i>
            </button>
          }
          <button
            class="send-btn"
            [disabled]="!canSend() || store.isStreaming()"
            (click)="send()"
          >
            @if (store.isStreaming()) {
              <i class="bi bi-stop-fill"></i>
            } @else {
              <i class="bi bi-send-fill"></i>
            }
          </button>
        </div>
      </div>
      <div class="input-hints">
        <span class="hint">Press Enter to send, Shift+Enter for new line</span>
        @if (store.selectedAgent()) {
          <span class="model-info">
            {{ store.selectedAgent()?.provider }} / {{ store.selectedAgent()?.model }}
          </span>
        }
      </div>
    </div>
  `,
  styles: [`
    .chat-input-container {
      padding: 16px;
      border-top: 1px solid var(--bs-border-color, #dee2e6);
      background: var(--bs-body-bg, #fff);
    }

    .input-wrapper {
      display: flex;
      align-items: flex-end;
      gap: 8px;
      background: var(--bs-light, #f8f9fa);
      border: 1px solid var(--bs-border-color, #dee2e6);
      border-radius: 24px;
      padding: 8px 12px;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .input-wrapper:focus-within {
      border-color: var(--bs-primary, #0d6efd);
      box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.1);
    }

    .chat-textarea {
      flex: 1;
      border: none;
      background: transparent;
      resize: none;
      outline: none;
      padding: 6px 0;
      font-size: 0.95rem;
      max-height: 150px;
      line-height: 1.4;
    }

    .chat-textarea::placeholder {
      color: var(--bs-secondary, #6c757d);
    }

    .chat-textarea:disabled {
      opacity: 0.6;
    }

    .input-actions {
      display: flex;
      gap: 4px;
      align-items: center;
    }

    .action-btn {
      width: 36px;
      height: 36px;
      border: none;
      background: transparent;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--bs-secondary, #6c757d);
      transition: background 0.2s, color 0.2s;
    }

    .action-btn:hover {
      background: rgba(0, 0, 0, 0.05);
      color: var(--bs-primary, #0d6efd);
    }

    .send-btn {
      width: 36px;
      height: 36px;
      border: none;
      background: var(--bs-primary, #0d6efd);
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      transition: background 0.2s, opacity 0.2s;
    }

    .send-btn:hover:not(:disabled) {
      background: var(--bs-primary, #0d6efd);
      filter: brightness(1.1);
    }

    .send-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .input-hints {
      display: flex;
      justify-content: space-between;
      margin-top: 8px;
      font-size: 0.75rem;
      color: var(--bs-secondary, #6c757d);
      padding: 0 12px;
    }

    .model-info {
      font-family: monospace;
      font-size: 0.7rem;
    }
  `]
})
export class ChatInputComponent {
  readonly store = inject(ChatStore);
  inputValue = '';

  canSend(): boolean {
    return this.inputValue.trim().length > 0;
  }

  onEnter(event: KeyboardEvent): void {
    if (!event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  send(): void {
    if (!this.canSend() || this.store.isStreaming()) return;

    const message = this.inputValue.trim();
    this.inputValue = '';
    this.store.sendMessage(message);
  }

  autoResize(textarea: HTMLTextAreaElement): void {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
  }
}
