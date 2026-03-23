import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'emisi-skip-link',
  standalone: true,
  templateUrl: './skip-link.component.html',
  styleUrl: './skip-link.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmisiSkipLinkComponent {
  @Input() targetId = 'main-content';
  @Input() label = 'Skip to main content';
}
