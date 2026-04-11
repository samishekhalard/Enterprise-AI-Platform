import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-layout-header-action-button-preview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="preview-grid" data-testid="layout-header-action-button-preview">
      <h4>Header Action Button</h4>
      <div class="row">
        <button class="action-btn" type="button" aria-label="Menu">
          <span class="icon-bars" aria-hidden="true"></span>
        </button>
        <button class="action-btn" type="button" aria-label="Notifications">
          <span class="icon-dot" aria-hidden="true"></span>
        </button>
        <button class="action-btn" type="button" aria-label="Help">
          <span class="icon-help" aria-hidden="true">?</span>
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
        flex-wrap: wrap;
        gap: 0.65rem;
      }

      h4 {
        margin: 0;
        font-size: 0.82rem;
        color: var(--tp-text);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .action-btn {
        position: relative;
        width: 44px;
        height: 44px;
        border: none;
        border-radius: 50%;
        background: transparent;
        color: var(--tp-primary);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: default;
        padding: 0;
        isolation: isolate;
      }

      .action-btn::before {
        content: '';
        position: absolute;
        width: calc(100% + 8px);
        height: calc(100% + 8px);
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        border-radius: 50%;
        background: var(--nm-btn-bezel-gradient);
        z-index: 0;
        box-shadow: var(--nm-btn-shadow-before);
      }

      .action-btn::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 50%;
        border: var(--nm-btn-face-border);
        background: var(--nm-btn-face-gradient);
        box-shadow: var(--nm-btn-shadow-after);
        z-index: 1;
      }

      .icon-bars,
      .icon-dot,
      .icon-help {
        position: relative;
        z-index: 2;
      }

      .icon-bars {
        width: 16px;
        height: 12px;
        display: block;
        background:
          linear-gradient(currentColor, currentColor) 0 0/100% 2px no-repeat,
          linear-gradient(currentColor, currentColor) 0 5px/100% 2px no-repeat,
          linear-gradient(currentColor, currentColor) 0 10px/100% 2px no-repeat;
      }

      .icon-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: currentColor;
        opacity: 0.85;
      }

      .icon-help {
        font-size: 1rem;
        font-weight: 700;
        line-height: 1;
      }
    `,
  ],
})
export class LayoutHeaderActionButtonPreviewComponent {}
