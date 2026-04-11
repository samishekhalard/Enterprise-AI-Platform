import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-layout-admin-dock-item-preview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="preview-grid" data-testid="layout-admin-dock-item-preview">
      <h4>Admin Dock Item States</h4>
      <div class="row">
        <div class="dock-item"><span></span></div>
        <div class="dock-item active"><span></span></div>
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
        gap: 0.75rem;
      }

      h4 {
        margin: 0;
        font-size: 0.82rem;
        color: var(--tp-text);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .dock-item {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        border: var(--nm-dock-glass-border);
        background: var(--tp-bg);
        box-shadow: var(--nm-dock-item-shadow);
      }

      .dock-item span {
        width: 24px;
        height: 24px;
        border-radius: 6px;
        background: var(--tp-primary);
        opacity: 0.8;
      }

      .dock-item.active {
        background: var(--tp-primary);
        border-color: var(--tp-primary-dark);
        box-shadow: var(--nm-dock-item-shadow-active);
      }

      .dock-item.active span {
        background: var(--tp-surface-raised);
        opacity: 1;
      }
    `,
  ],
})
export class LayoutAdminDockItemPreviewComponent {}
