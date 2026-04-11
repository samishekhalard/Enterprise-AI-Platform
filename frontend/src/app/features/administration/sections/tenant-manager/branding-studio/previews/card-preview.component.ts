import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-card-preview',
  standalone: true,
  imports: [CardModule, ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="preview-grid" data-testid="card-preview">
      <h4>Basic Card</h4>
      <p-card header="Project Summary">
        <p>This is a basic card with a header and body content. Cards group related information.</p>
      </p-card>

      <h4>Card with Subtitle</h4>
      <p-card header="Analytics" subheader="Last 30 Days">
        <p>Revenue increased by 12% compared to the previous period.</p>
      </p-card>

      <h4>Card with Footer</h4>
      <p-card header="Team Member">
        <p>John Doe - Senior Developer</p>
        <ng-template #footer>
          <div class="card-footer">
            <p-button label="View Profile" severity="secondary" [outlined]="true" size="small" />
            <p-button label="Message" size="small" />
          </div>
        </ng-template>
      </p-card>
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
      .card-footer {
        display: flex;
        gap: 0.5rem;
      }
    `,
  ],
})
export class CardPreviewComponent {}
