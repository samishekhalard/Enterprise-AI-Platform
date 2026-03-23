import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectButtonModule } from 'primeng/selectbutton';

@Component({
  selector: 'app-selectbutton-preview',
  standalone: true,
  imports: [FormsModule, SelectButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="preview-grid" data-testid="selectbutton-preview">
      <h4>Single Select</h4>
      <p-selectbutton
        [options]="viewOptions"
        [ngModel]="selectedView()"
        (ngModelChange)="selectedView.set($event)"
        optionLabel="label"
        optionValue="value"
      />

      <h4>Multiple Select</h4>
      <p-selectbutton
        [options]="filterOptions"
        [ngModel]="selectedFilters()"
        (ngModelChange)="selectedFilters.set($event)"
        optionLabel="label"
        optionValue="value"
        [multiple]="true"
      />
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
        color: var(--nm-muted, #3d3a3b);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
    `,
  ],
})
export class SelectButtonPreviewComponent {
  readonly viewOptions = [
    { label: 'Grid', value: 'grid' },
    { label: 'List', value: 'list' },
    { label: 'Table', value: 'table' },
  ];
  readonly filterOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Pending', value: 'pending' },
    { label: 'Closed', value: 'closed' },
  ];
  readonly selectedView = signal('grid');
  readonly selectedFilters = signal<string[]>(['active']);
}
