import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Message } from '../../models/message.model';

@Component({
  selector: 'ai-message-bubble',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="message-bubble" [class.user]="message.role === 'USER'" [class.assistant]="message.role === 'ASSISTANT'">
      <div class="message-avatar">
        @if (message.role === 'USER') {
          <i class="bi bi-person-fill"></i>
        } @else {
          <i class="bi bi-robot"></i>
        }
      </div>
      <div class="message-content">
        <div class="message-text" [class.streaming]="message.isStreaming">
          {{ message.content }}
          @if (message.isStreaming) {
            <span class="cursor">|</span>
          }
        </div>
        <div class="message-meta">
          <span class="time">{{ formatTime(message.createdAt) }}</span>
          @if (message.tokenCount) {
            <span class="tokens">{{ message.tokenCount }} tokens</span>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .message-bubble {
      display: flex;
      gap: 12px;
      max-width: 85%;
    }

    .message-bubble.user {
      flex-direction: row-reverse;
      margin-left: auto;
    }

    .message-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-size: 1.1rem;
    }

    .message-bubble.user .message-avatar {
      background: var(--bs-primary, #0d6efd);
      color: white;
    }

    .message-bubble.assistant .message-avatar {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .message-content {
      flex: 1;
    }

    .message-text {
      padding: 12px 16px;
      border-radius: 18px;
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .message-bubble.user .message-text {
      background: var(--bs-primary, #0d6efd);
      color: white;
      border-bottom-right-radius: 4px;
    }

    .message-bubble.assistant .message-text {
      background: var(--bs-light, #f8f9fa);
      border: 1px solid var(--bs-border-color, #dee2e6);
      border-bottom-left-radius: 4px;
    }

    .message-text.streaming {
      min-height: 40px;
    }

    .cursor {
      animation: blink 1s infinite;
    }

    @keyframes blink {
      0%, 50% { opacity: 1; }
      51%, 100% { opacity: 0; }
    }

    .message-meta {
      display: flex;
      gap: 12px;
      margin-top: 4px;
      font-size: 0.75rem;
      color: var(--bs-secondary, #6c757d);
    }

    .message-bubble.user .message-meta {
      justify-content: flex-end;
    }
  `]
})
export class MessageBubbleComponent {
  @Input({ required: true }) message!: Message;

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
