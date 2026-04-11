import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ProgressBarModule } from 'primeng/progressbar';

@Component({
  selector: 'app-progressbar-preview',
  standalone: true,
  imports: [ProgressBarModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="preview-grid" data-testid="progressbar-preview">
      <h4>Determinate (50%)</h4>
      <p-progressbar [value]="50" />

      <h4>Determinate (85%)</h4>
      <p-progressbar [value]="85" />

      <h4>Indeterminate</h4>
      <p-progressbar mode="indeterminate" [style]="{ height: '6px' }" />
    </div>
  `,
  styles: [
    `
      .preview-grid {
        display: grid;
        gap: 1rem;
      }
      h4 {
        margin: 0;
        font-size: 0.82rem;
        color: var(--nm-muted);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
    `,
  ],
})
export class ProgressBarPreviewComponent {}
