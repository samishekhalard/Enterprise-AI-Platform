import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-tooltip-preview',
  standalone: true,
  imports: [ButtonModule, TooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="preview-grid" data-testid="tooltip-preview">
      <h4>Tooltip Positions</h4>
      <div class="row">
        <p-button label="Top" pTooltip="Tooltip on top" tooltipPosition="top" />
        <p-button label="Right" pTooltip="Tooltip on right" tooltipPosition="right" />
        <p-button label="Bottom" pTooltip="Tooltip on bottom" tooltipPosition="bottom" />
        <p-button label="Left" pTooltip="Tooltip on left" tooltipPosition="left" />
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
export class TooltipPreviewComponent {}
