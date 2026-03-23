import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-layout-header-signout-button-preview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="preview-grid" data-testid="layout-header-signout-button-preview">
      <h4>Header Sign Out Button</h4>
      <div class="row">
        <button class="signout-btn" type="button" aria-label="Sign out">
          <span class="icon-power" aria-hidden="true"></span>
        </button>
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
      }

      h4 {
        margin: 0;
        font-size: 0.82rem;
        color: var(--bs-color-muted);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .signout-btn {
        position: relative;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        border: none;
        background: transparent;
        color: var(--adm-danger);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: default;
        padding: 0;
        isolation: isolate;
      }

      .signout-btn::before {
        content: '';
        position: absolute;
        width: calc(100% + 8px);
        height: calc(100% + 8px);
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        border-radius: 50%;
        background: linear-gradient(145deg, var(--adm-danger), var(--adm-danger-hover));
        box-shadow: var(--adm-button-shadow-before);
        z-index: 0;
      }

      .signout-btn::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: inherit;
        border: 2px solid var(--adm-danger);
        background: var(--adm-button-face-gradient);
        box-shadow: var(--adm-button-shadow-after);
        z-index: 1;
      }

      .icon-power {
        position: relative;
        z-index: 2;
        width: 18px;
        height: 18px;
        border: 2px solid currentColor;
        border-top-color: transparent;
        border-radius: 50%;
      }

      .icon-power::after {
        content: '';
        position: absolute;
        top: -7px;
        left: 50%;
        transform: translateX(-50%);
        width: 2px;
        height: 9px;
        background: currentColor;
        border-radius: 999px;
      }
    `,
  ],
})
export class LayoutHeaderSignOutButtonPreviewComponent {}
