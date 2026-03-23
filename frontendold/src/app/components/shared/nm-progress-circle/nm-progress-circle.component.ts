import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'nm-progress-circle',
  standalone: true,
  template: `
    <div class="nm-progress-well" [style.width.px]="outerSize()" [style.height.px]="outerSize()">
      <svg [attr.width]="svgSize()" [attr.height]="svgSize()"
           [attr.viewBox]="'0 0 ' + svgSize() + ' ' + svgSize()"
           role="progressbar"
           [attr.aria-valuenow]="value()"
           aria-valuemin="0"
           aria-valuemax="100"
           [attr.aria-label]="label() + ': ' + value() + '%'">

        <!-- Track circle (concave well look) -->
        <circle
          [attr.cx]="center()"
          [attr.cy]="center()"
          [attr.r]="radius()"
          fill="none"
          [attr.stroke]="trackColor()"
          [attr.stroke-width]="strokeWidth()"
          stroke-linecap="round"
        />

        <!-- Value arc -->
        <circle
          [attr.cx]="center()"
          [attr.cy]="center()"
          [attr.r]="radius()"
          fill="none"
          [attr.stroke]="valueColor()"
          [attr.stroke-width]="strokeWidth()"
          [attr.stroke-dasharray]="circumference()"
          [attr.stroke-dashoffset]="dashOffset()"
          stroke-linecap="round"
          [attr.transform]="'rotate(-90 ' + center() + ' ' + center() + ')'"
          class="nm-progress-arc"
        />

        <!-- Center text -->
        <text
          [attr.x]="center()"
          [attr.y]="center()"
          text-anchor="middle"
          dominant-baseline="central"
          class="nm-progress-text"
          [attr.font-size]="fontSize()">
          {{ value() }}%
        </text>
      </svg>
    </div>
  `,
  styles: [`
    :host {
      display: inline-block;
    }

    .nm-progress-arc {
      transition: stroke-dashoffset 0.6s ease;
    }

    .nm-progress-text {
      fill: var(--nm-text-primary, #2d3748);
      font-weight: 700;
      font-family: 'Inter', -apple-system, sans-serif;
    }
  `]
})
export class NmProgressCircleComponent {
  /** Percentage value (0-100) */
  value = input<number>(76);

  /** Accessible label */
  label = input<string>('Progress');

  /** SVG size in pixels */
  svgSize = input<number>(120);

  /** Stroke width */
  strokeWidth = input<number>(10);

  /** Track color */
  trackColor = input<string>('rgba(163,177,198,0.3)');

  /** Value arc color */
  valueColor = input<string>('#047481');

  /** Computed properties */
  outerSize = computed(() => this.svgSize() + 32); // 16px padding each side
  center = computed(() => this.svgSize() / 2);
  radius = computed(() => (this.svgSize() - this.strokeWidth()) / 2);
  circumference = computed(() => 2 * Math.PI * this.radius());
  dashOffset = computed(() => {
    const clamped = Math.max(0, Math.min(100, this.value()));
    return this.circumference() * (1 - clamped / 100);
  });
  fontSize = computed(() => this.svgSize() * 0.22 + 'px');
}
