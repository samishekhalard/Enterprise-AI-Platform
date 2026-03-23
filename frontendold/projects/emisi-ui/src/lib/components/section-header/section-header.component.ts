import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'emisi-section-header',
  standalone: true,
  templateUrl: './section-header.component.html',
  styleUrl: './section-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmisiSectionHeaderComponent {
  @Input() overline = '';
  @Input() title = '';
  @Input() description = '';
  @Input() compact = false;
}
