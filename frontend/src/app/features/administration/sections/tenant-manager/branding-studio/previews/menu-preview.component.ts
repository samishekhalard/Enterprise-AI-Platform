import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-menu-preview',
  standalone: true,
  imports: [MenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="preview-grid" data-testid="menu-preview">
      <h4>Vertical Menu</h4>
      <p-menu [model]="items" />
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
export class MenuPreviewComponent {
  readonly items: MenuItem[] = [
    {
      label: 'File',
      items: [{ label: 'New' }, { label: 'Open' }, { label: 'Save' }],
    },
    {
      label: 'Edit',
      items: [{ label: 'Undo' }, { label: 'Redo' }, { label: 'Cut' }],
    },
  ];
}
