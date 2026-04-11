import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BadgeModule } from 'primeng/badge';

@Component({
  selector: 'app-badge-preview',
  standalone: true,
  imports: [BadgeModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="preview-grid" data-testid="badge-preview">
      <h4>Severity Badges</h4>
      <div class="row">
        <p-badge value="4" />
        <p-badge value="2" severity="success" />
        <p-badge value="8" severity="info" />
        <p-badge value="1" severity="warn" />
        <p-badge value="3" severity="danger" />
        <p-badge value="5" severity="secondary" />
        <p-badge value="9" severity="contrast" />
      </div>

      <h4>Sizes</h4>
      <div class="row">
        <p-badge value="2" />
        <p-badge value="4" badgeSize="large" />
        <p-badge value="6" badgeSize="xlarge" />
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
export class BadgePreviewComponent {}
