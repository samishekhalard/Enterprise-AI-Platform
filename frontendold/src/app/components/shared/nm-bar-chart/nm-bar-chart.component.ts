import { Component, input, computed } from '@angular/core';

export interface BarChartDataItem {
  label: string;
  value: number;
}

@Component({
  selector: 'nm-bar-chart',
  standalone: true,
  template: `
    <div class="nm-chart-container" role="img" [attr.aria-label]="ariaLabel()">
      <div class="nm-bar-chart" [style.height.px]="height()">
        @for (item of data(); track item.label) {
          <div class="nm-bar-column">
            <div class="nm-bar"
                 [style.height.%]="barHeight(item.value)"
                 [attr.title]="item.label + ': ' + item.value">
            </div>
            <span class="nm-bar-value">{{ item.value }}</span>
            <span class="nm-bar-label">{{ item.label }}</span>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .nm-bar-chart {
      display: flex;
      align-items: flex-end;
      justify-content: space-around;
      gap: 12px;
      padding: 8px 0;
    }

    .nm-bar-column {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
      min-width: 32px;
    }

    .nm-bar {
      width: 100%;
      max-width: 40px;
      min-height: 4px;
      background: var(--nm-accent, #047481);
      border-radius: 8px 8px 0 0;
      box-shadow:
        4px 4px 8px var(--nm-shadow-dark, rgba(163,177,198,0.6)),
        -4px -4px 8px var(--nm-shadow-light, rgba(255,255,255,0.8));
      transition: height 0.4s ease;
    }

    .nm-bar-value {
      font-size: 0.6875rem;
      font-weight: 700;
      color: var(--nm-accent, #047481);
      margin-top: 6px;
    }

    .nm-bar-label {
      font-size: 0.625rem;
      color: var(--nm-text-secondary, #454e5c);
      margin-top: 2px;
      text-align: center;
    }
  `]
})
export class NmBarChartComponent {
  /** Chart data array */
  data = input<BarChartDataItem[]>([]);

  /** Chart height in pixels */
  height = input<number>(160);

  /** Accessible label */
  ariaLabel = input<string>('Bar chart');

  /** Compute max value for proportional bar heights */
  maxValue = computed(() => {
    const items = this.data();
    return items.length ? Math.max(...items.map(i => i.value)) : 100;
  });

  /** Calculate bar height as percentage of max */
  barHeight(value: number): number {
    const max = this.maxValue();
    return max > 0 ? (value / max) * 85 : 0; // 85% max to leave room for labels
  }
}
