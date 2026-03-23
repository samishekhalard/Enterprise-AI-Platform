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
        color: var(--nm-muted, #3d3a3b);
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
      items: [
        { label: 'New', icon: 'pi pi-plus' },
        { label: 'Open', icon: 'pi pi-folder-open' },
        { label: 'Save', icon: 'pi pi-save' },
      ],
    },
    {
      label: 'Edit',
      items: [
        { label: 'Undo', icon: 'pi pi-undo' },
        { label: 'Redo', icon: 'pi pi-refresh' },
        { label: 'Cut', icon: 'pi pi-scissors' },
      ],
    },
  ];
}
