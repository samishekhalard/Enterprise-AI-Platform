import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CheckboxModule } from 'primeng/checkbox';

@Component({
  selector: 'app-checkbox-preview',
  standalone: true,
  imports: [FormsModule, CheckboxModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="preview-grid" data-testid="checkbox-preview">
      <h4>States</h4>
      <div class="row">
        <p-checkbox
          [ngModel]="checked()"
          (ngModelChange)="checked.set($event)"
          [binary]="true"
          inputId="cb-checked"
        />
        <label for="cb-checked">Checked</label>
      </div>
      <div class="row">
        <p-checkbox
          [ngModel]="unchecked()"
          (ngModelChange)="unchecked.set($event)"
          [binary]="true"
          inputId="cb-unchecked"
        />
        <label for="cb-unchecked">Unchecked</label>
      </div>
      <div class="row">
        <p-checkbox [binary]="true" [disabled]="true" [ngModel]="true" inputId="cb-disabled" />
        <label for="cb-disabled">Disabled (checked)</label>
      </div>
      <div class="row">
        <p-checkbox [binary]="true" [disabled]="true" [ngModel]="false" inputId="cb-disabled-off" />
        <label for="cb-disabled-off">Disabled (unchecked)</label>
      </div>
    </div>
  `,
  styles: [
    `
      .preview-grid {
        display: grid;
        gap: 0.75rem;
      }
      .row {
        display: flex;
        gap: 0.5rem;
        align-items: center;
      }
      h4 {
        margin: 0;
        font-size: 0.82rem;
        color: var(--nm-muted);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      label {
        font-size: 0.88rem;
        cursor: pointer;
      }
    `,
  ],
})
export class CheckboxPreviewComponent {
  readonly checked = signal(true);
  readonly unchecked = signal(false);
}
