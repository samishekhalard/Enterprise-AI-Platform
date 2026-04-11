import { Component, ChangeDetectionStrategy } from '@angular/core';
import { PaginatorModule } from 'primeng/paginator';

@Component({
  selector: 'app-paginator-preview',
  standalone: true,
  imports: [PaginatorModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="preview-grid" data-testid="paginator-preview">
      <h4>Basic Paginator</h4>
      <p-paginator [rows]="10" [totalRecords]="120" [rowsPerPageOptions]="[10, 20, 50]" />
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
export class PaginatorPreviewComponent {}
