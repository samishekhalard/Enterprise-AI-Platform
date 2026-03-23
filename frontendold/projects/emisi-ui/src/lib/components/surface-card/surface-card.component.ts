import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export type EmisiSurfaceVariant = 'flat' | 'raised' | 'inset';
export type EmisiSurfacePadding = 'sm' | 'md' | 'lg';

@Component({
  selector: 'emisi-surface-card',
  standalone: true,
  templateUrl: './surface-card.component.html',
  styleUrl: './surface-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmisiSurfaceCardComponent {
  @Input() variant: EmisiSurfaceVariant = 'raised';
  @Input() padding: EmisiSurfacePadding = 'md';
}
