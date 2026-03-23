import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PersonaStudioService } from '../../services/persona-studio.service';

@Component({
  selector: 'app-export',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mb-4">
      <h5 class="fw-semibold mb-2">Export</h5>
      <p class="text-muted">Export the structured persona and journey data. Use JSON for agent ingestion, Summary for PM review, Plain Text for presentations.</p>
    </div>

    <div class="btn-group btn-group-sm mb-3">
      <button type="button" class="btn"
              [class.btn-primary]="format() === 'json'"
              [class.btn-outline-secondary]="format() !== 'json'"
              (click)="format.set('json')">Full JSON</button>
      <button type="button" class="btn"
              [class.btn-primary]="format() === 'schema'"
              [class.btn-outline-secondary]="format() !== 'schema'"
              (click)="format.set('schema')">Summary JSON</button>
      <button type="button" class="btn"
              [class.btn-primary]="format() === 'text'"
              [class.btn-outline-secondary]="format() !== 'text'"
              (click)="format.set('text')">Plain Text</button>
    </div>

    <pre class="bg-light border rounded p-3 mb-3" style="max-height: 500px; overflow: auto; font-size: 0.85rem;">{{ service.getExportData(format()) }}</pre>

    <button class="btn btn-primary" (click)="copyToClipboard()">
      {{ copied() ? '✓ Copied!' : 'Copy to Clipboard' }}
    </button>
  `,
  styles: [`
    .btn-primary {
      background-color: #b9a779;
      border-color: #b9a779;
      color: #161616;

      &:hover {
        background-color: #988561;
        border-color: #988561;
        color: white;
      }
    }

    pre {
      color: #054239;
    }
  `]
})
export class ExportComponent {
  readonly service = inject(PersonaStudioService);
  format = signal<'json' | 'schema' | 'text'>('json');
  copied = signal(false);

  copyToClipboard(): void {
    const data = this.service.getExportData(this.format());
    navigator.clipboard.writeText(data).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }
}
