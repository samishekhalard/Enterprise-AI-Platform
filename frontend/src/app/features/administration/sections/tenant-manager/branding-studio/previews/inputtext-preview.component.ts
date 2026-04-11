import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';

@Component({
  selector: 'app-inputtext-preview',
  standalone: true,
  imports: [FormsModule, InputTextModule, FloatLabelModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="preview-grid" data-testid="inputtext-preview">
      <h4>Default</h4>
      <input
        pInputText
        [ngModel]="defaultVal()"
        (ngModelChange)="defaultVal.set($event)"
        placeholder="Enter text..."
      />

      <h4>Filled</h4>
      <input
        pInputText
        variant="filled"
        [ngModel]="filledVal()"
        (ngModelChange)="filledVal.set($event)"
        placeholder="Filled variant"
      />

      <h4>Disabled</h4>
      <input pInputText disabled value="Disabled input" />

      <h4>Invalid</h4>
      <input pInputText [ngModel]="''" class="ng-dirty ng-invalid" placeholder="Invalid state" />

      <h4>Sizes</h4>
      <div class="row">
        <input pInputText pSize="small" placeholder="Small" />
        <input pInputText placeholder="Normal" />
        <input pInputText pSize="large" placeholder="Large" />
      </div>

      <h4>Float Label</h4>
      <p-floatlabel>
        <input
          pInputText
          id="float-input"
          [ngModel]="floatVal()"
          (ngModelChange)="floatVal.set($event)"
        />
        <label for="float-input">Username</label>
      </p-floatlabel>
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
        color: var(--nm-muted);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
    `,
  ],
})
export class InputTextPreviewComponent {
  readonly defaultVal = signal('Sample text');
  readonly filledVal = signal('');
  readonly floatVal = signal('');
}
