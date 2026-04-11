import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-tag-preview',
  standalone: true,
  imports: [TagModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="preview-grid" data-testid="tag-preview">
      <h4>Severity Tags</h4>
      <div class="row">
        <p-tag value="Primary" />
        <p-tag value="Success" severity="success" />
        <p-tag value="Info" severity="info" />
        <p-tag value="Warn" severity="warn" />
        <p-tag value="Danger" severity="danger" />
        <p-tag value="Secondary" severity="secondary" />
        <p-tag value="Contrast" severity="contrast" />
      </div>

      <h4>Rounded Tags</h4>
      <div class="row">
        <p-tag value="Active" severity="success" [rounded]="true" />
        <p-tag value="Pending" severity="warn" [rounded]="true" />
        <p-tag value="Expired" severity="danger" [rounded]="true" />
      </div>

      <h4>Icon Tags</h4>
      <div class="row">
        <p-tag value="User" />
        <p-tag value="Settings" severity="info" />
        <p-tag value="Alert" severity="warn" />
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
export class TagPreviewComponent {}
