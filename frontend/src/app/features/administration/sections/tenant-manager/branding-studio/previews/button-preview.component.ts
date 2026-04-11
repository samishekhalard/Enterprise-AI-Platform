import { Component, ChangeDetectionStrategy } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-button-preview',
  standalone: true,
  imports: [ButtonModule, NgIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="preview-grid" data-testid="button-preview">
      <h4>Severity Variants</h4>
      <div class="row">
        <p-button label="Primary" />
        <p-button label="Secondary" severity="secondary" />
        <p-button label="Success" severity="success" />
        <p-button label="Info" severity="info" />
        <p-button label="Warn" severity="warn" />
        <p-button label="Danger" severity="danger" />
        <p-button label="Help" severity="help" />
      </div>

      <h4>Outlined</h4>
      <div class="row">
        <p-button label="Primary" [outlined]="true" />
        <p-button label="Secondary" severity="secondary" [outlined]="true" />
        <p-button label="Success" severity="success" [outlined]="true" />
      </div>

      <h4>Text</h4>
      <div class="row">
        <p-button label="Primary" [text]="true" />
        <p-button label="Secondary" severity="secondary" [text]="true" />
      </div>

      <h4>Icon & Rounded</h4>
      <div class="row">
        <p-button [rounded]="true"><ng-icon name="phosphorCheckThin" /></p-button>
        <p-button severity="danger" [rounded]="true"><ng-icon name="phosphorXThin" /></p-button>
        <p-button label="Rounded" [rounded]="true" />
        <p-button label="Loading" [loading]="true" />
      </div>

      <h4>Sizes</h4>
      <div class="row">
        <p-button label="Small" size="small" />
        <p-button label="Normal" />
        <p-button label="Large" size="large" />
      </div>

      <h4>Link</h4>
      <div class="row">
        <p-button label="Link Button" [link]="true" />
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
        color: var(--nm-muted);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
    `,
  ],
})
export class ButtonPreviewComponent {}
