import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AccordionModule } from 'primeng/accordion';

@Component({
  selector: 'app-accordion-preview',
  standalone: true,
  imports: [AccordionModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="preview-grid" data-testid="accordion-preview">
      <h4>Accordion</h4>
      <p-accordion [value]="['0']">
        <p-accordion-panel value="0">
          <p-accordion-header>Getting Started</p-accordion-header>
          <p-accordion-content>
            <p>
              Welcome to the platform. This section covers the basics of setting up your workspace.
            </p>
          </p-accordion-content>
        </p-accordion-panel>
        <p-accordion-panel value="1">
          <p-accordion-header>Configuration</p-accordion-header>
          <p-accordion-content>
            <p>Configure your environment settings, integrations, and notification preferences.</p>
          </p-accordion-content>
        </p-accordion-panel>
        <p-accordion-panel value="2">
          <p-accordion-header>Advanced Options</p-accordion-header>
          <p-accordion-content>
            <p>Explore advanced features including API access, webhooks, and custom workflows.</p>
          </p-accordion-content>
        </p-accordion-panel>
      </p-accordion>
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
        margin: 0;
      }
    `,
  ],
})
export class AccordionPreviewComponent {}
