import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-layout-admin-dock-card-preview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="preview-grid" data-testid="layout-admin-dock-card-preview">
      <h4>Admin Dock Container</h4>
      <div class="dock-card">
        <div class="dock-item"><span></span></div>
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

      h4 {
        margin: 0;
        font-size: 0.82rem;
        color: var(--bs-color-muted);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .dock-card {
        width: fit-content;
        display: grid;
        gap: 0.65rem;
        border-radius: 15px;
        padding: 0.75rem;
        background: var(--adm-dock-glass-bg);
        border: var(--adm-dock-glass-border);
        box-shadow: var(--adm-dock-card-shadow);
      }

      .dock-item {
        width: 52px;
        height: 52px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        border: var(--adm-dock-glass-border);
        background: var(--tp-bg);
        box-shadow: var(--adm-dock-item-shadow);
      }

      .dock-item span {
        width: 22px;
        height: 22px;
        border-radius: 6px;
        background: var(--tp-primary);
        opacity: 0.72;
      }

      .dock-item.active {
        background: var(--tp-primary);
        border-color: var(--tp-primary-dark);
        box-shadow: var(--adm-dock-item-shadow-active);
      }

      .dock-item.active span {
        background: var(--tm-color-white);
        opacity: 1;
      }
    `,
  ],
})
export class LayoutAdminDockCardPreviewComponent {}
