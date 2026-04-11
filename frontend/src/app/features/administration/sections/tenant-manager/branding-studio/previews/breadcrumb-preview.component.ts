import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-breadcrumb-preview',
  standalone: true,
  imports: [BreadcrumbModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="preview-grid" data-testid="breadcrumb-preview">
      <h4>Breadcrumb</h4>
      <p-breadcrumb [model]="items" [home]="home" />
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
export class BreadcrumbPreviewComponent {
  readonly home: MenuItem = { label: 'Home' };
  readonly items: MenuItem[] = [
    { label: 'Administration' },
    { label: 'Tenants' },
    { label: 'Branding Studio' },
  ];
}
