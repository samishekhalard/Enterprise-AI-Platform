import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfidenceLevel } from '../../models/persona.model';

@Component({
  selector: 'app-confidence-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="btn-group btn-group-sm" role="group">
      <button *ngFor="let level of levels"
              type="button"
              class="btn"
              [class.active]="value() === level"
              [style.border-color]="value() === level ? getColor(level) : '#dee2e6'"
              [style.background-color]="value() === level ? getColor(level) + '20' : 'transparent'"
              [style.color]="value() === level ? getColor(level) : '#6c757d'"
              (click)="onChange.emit(level)">
        {{ level }}
      </button>
    </div>
  `,
  styles: [`
    .btn {
      font-size: 0.7rem;
      padding: 0.25rem 0.75rem;
      text-transform: capitalize;
    }
  `]
})
export class ConfidenceBadgeComponent {
  value = input<ConfidenceLevel>('inferred');
  onChange = output<ConfidenceLevel>();

  levels: ConfidenceLevel[] = ['validated', 'inferred', 'assumed'];

  getColor(level: string): string {
    switch (level) {
      case 'validated': return '#054239'; // Forest
      case 'inferred': return '#b9a779'; // Golden Wheat
      case 'assumed': return '#988561'; // Golden Wheat Dark
      default: return '#3d3a3b'; // Charcoal
    }
  }
}
