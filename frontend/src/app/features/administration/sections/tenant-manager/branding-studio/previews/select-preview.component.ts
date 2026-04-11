import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';

@Component({
  selector: 'app-select-preview',
  standalone: true,
  imports: [FormsModule, SelectModule, MultiSelectModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="preview-grid" data-testid="select-preview">
      <h4>Basic Select</h4>
      <p-select
        [options]="cities"
        [ngModel]="selectedCity()"
        (ngModelChange)="selectedCity.set($event)"
        optionLabel="name"
        placeholder="Select a City"
        [style]="{ width: '100%' }"
      />

      <h4>MultiSelect</h4>
      <p-multiselect
        [options]="cities"
        [ngModel]="selectedCities()"
        (ngModelChange)="selectedCities.set($event)"
        optionLabel="name"
        placeholder="Select Cities"
        [style]="{ width: '100%' }"
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
        color: var(--nm-muted);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
    `,
  ],
})
export class SelectPreviewComponent {
  readonly cities = [
    { name: 'New York', code: 'NY' },
    { name: 'London', code: 'LDN' },
    { name: 'Tokyo', code: 'TKY' },
    { name: 'Paris', code: 'PRS' },
    { name: 'Dubai', code: 'DXB' },
  ];
  readonly selectedCity = signal<{ name: string; code: string } | null>(null);
  readonly selectedCities = signal<{ name: string; code: string }[]>([]);
}
