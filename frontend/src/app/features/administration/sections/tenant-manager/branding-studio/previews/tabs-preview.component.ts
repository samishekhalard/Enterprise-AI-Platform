import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TabsModule } from 'primeng/tabs';

@Component({
  selector: 'app-tabs-preview',
  standalone: true,
  imports: [TabsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="preview-grid" data-testid="tabs-preview">
      <h4>Basic Tabs</h4>
      <p-tabs value="0">
        <p-tablist>
          <p-tab value="0">Overview</p-tab>
          <p-tab value="1">Features</p-tab>
          <p-tab value="2">Pricing</p-tab>
        </p-tablist>
        <p-tabpanels>
          <p-tabpanel value="0"><p>Overview content for your application.</p></p-tabpanel>
          <p-tabpanel value="1"><p>Feature list and capabilities.</p></p-tabpanel>
          <p-tabpanel value="2"><p>Pricing plans and tiers.</p></p-tabpanel>
        </p-tabpanels>
      </p-tabs>
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
      p {
        margin: 0.5rem 0 0;
      }
    `,
  ],
})
export class TabsPreviewComponent {}
