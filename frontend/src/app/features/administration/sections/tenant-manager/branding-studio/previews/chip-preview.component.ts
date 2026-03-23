import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ChipModule } from 'primeng/chip';

@Component({
  selector: 'app-chip-preview',
  standalone: true,
  imports: [ChipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="preview-grid" data-testid="chip-preview">
      <h4>Basic Chips</h4>
      <div class="row">
        <p-chip label="Angular" />
        <p-chip label="PrimeNG" />
        <p-chip label="TypeScript" />
      </div>

      <h4>With Icon</h4>
      <div class="row">
        <p-chip label="Apple" icon="pi pi-apple" />
        <p-chip label="Facebook" icon="pi pi-facebook" />
        <p-chip label="Google" icon="pi pi-google" />
      </div>

      <h4>Removable</h4>
      <div class="row">
        <p-chip label="Removable" [removable]="true" />
        <p-chip label="Also removable" icon="pi pi-tag" [removable]="true" />
      </div>
    </div>
  `,
  styles: [
    `
      .preview-grid {
        display: grid;
        gap: 1rem;
      }
      .row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        align-items: center;
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
export class ChipPreviewComponent {}
