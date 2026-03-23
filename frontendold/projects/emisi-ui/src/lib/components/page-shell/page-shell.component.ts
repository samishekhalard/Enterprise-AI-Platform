import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'emisi-page-shell',
  standalone: true,
  templateUrl: './page-shell.component.html',
  styleUrl: './page-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmisiPageShellComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() patternedBackground = true;
}
