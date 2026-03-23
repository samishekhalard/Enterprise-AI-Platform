import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';

@Component({
  selector: 'app-inputnumber-preview',
  standalone: true,
  imports: [FormsModule, InputNumberModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="preview-grid" data-testid="inputnumber-preview">
      <h4>Basic</h4>
      <p-inputnumber
        [ngModel]="basicValue()"
        (ngModelChange)="basicValue.set($event)"
        placeholder="Enter number"
      />

      <h4>Currency (USD)</h4>
      <p-inputnumber
        [ngModel]="currencyValue()"
        (ngModelChange)="currencyValue.set($event)"
        mode="currency"
        currency="USD"
        locale="en-US"
      />

      <h4>Percentage</h4>
      <p-inputnumber
        [ngModel]="percentValue()"
        (ngModelChange)="percentValue.set($event)"
        prefix="%"
        [min]="0"
        [max]="100"
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
export class InputNumberPreviewComponent {
  readonly basicValue = signal<number | null>(42);
  readonly currencyValue = signal<number | null>(1234.56);
  readonly percentValue = signal<number | null>(75);
}
