import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ai-assistant-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ai-assistant-container">
      <div class="ai-placeholder">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="ai-icon">
          <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
          <circle cx="8" cy="14" r="1"/>
          <circle cx="16" cy="14" r="1"/>
          <path d="M9 18h6"/>
        </svg>
        <h1>AI Assistant</h1>
        <p>The AI chat experience is coming soon.</p>
      </div>
    </div>
  `,
  styles: [`
    .ai-assistant-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: calc(100vh - 200px);
      padding: 2rem;
    }
    .ai-placeholder {
      text-align: center;
      color: var(--tp-gray-500, #495567);
    }
    .ai-icon {
      width: 64px;
      height: 64px;
      margin-bottom: 1rem;
      color: var(--tp-teal, #047481);
    }
    .ai-placeholder h1 {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: var(--tp-gray-700, #334155);
    }
    .ai-placeholder p {
      font-size: 1rem;
    }
  `]
})
export class AiAssistantPage {}
