import { Component, inject, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatStore } from '../../store/chat.store';
import { MessageBubbleComponent } from '../message-bubble/message-bubble.component';

@Component({
  selector: 'ai-message-list',
  standalone: true,
  imports: [CommonModule, MessageBubbleComponent],
  template: `
    <div class="message-list" #messageContainer>
      @for (message of store.messages(); track message.id) {
        <ai-message-bubble [message]="message" />
      }

      @if (store.isLoading() && !store.isStreaming()) {
        <div class="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      }
    </div>
  `,
  styles: [`
    .message-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 8px 0;
    }

    .typing-indicator {
      display: flex;
      gap: 4px;
      padding: 12px 16px;
      background: var(--bs-light, #f8f9fa);
      border-radius: 18px;
      width: fit-content;
    }

    .typing-indicator span {
      width: 8px;
      height: 8px;
      background: var(--bs-secondary, #6c757d);
      border-radius: 50%;
      animation: typing 1.4s infinite ease-in-out both;
    }

    .typing-indicator span:nth-child(1) {
      animation-delay: -0.32s;
    }

    .typing-indicator span:nth-child(2) {
      animation-delay: -0.16s;
    }

    @keyframes typing {
      0%, 80%, 100% {
        transform: scale(0.6);
        opacity: 0.5;
      }
      40% {
        transform: scale(1);
        opacity: 1;
      }
    }
  `]
})
export class MessageListComponent implements AfterViewChecked {
  @ViewChild('messageContainer') private messageContainer!: ElementRef;

  readonly store = inject(ChatStore);

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      const container = this.messageContainer.nativeElement;
      container.scrollTop = container.scrollHeight;
    } catch (err) {
      // Ignore scroll errors
    }
  }
}
