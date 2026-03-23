import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-message-preview',
  standalone: true,
  imports: [MessageModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="preview-grid" data-testid="message-preview">
      <h4>All Severities</h4>
      <p-message severity="success">Operation completed successfully.</p-message>
      <p-message severity="info">System update available.</p-message>
      <p-message severity="warn">Disk space running low.</p-message>
      <p-message severity="error">Connection failed. Please retry.</p-message>
      <p-message severity="secondary">Background task in progress.</p-message>
      <p-message severity="contrast">Dark mode notification style.</p-message>
    </div>
  `,
  styles: [
    `
      .preview-grid {
        display: grid;
        gap: 0.75rem;
      }
      h4 {
        margin: 0;
        font-size: 0.82rem;
        color: var(--nm-muted, #3d3a3b);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
    `,
  ],
})
export class MessagePreviewComponent {}
