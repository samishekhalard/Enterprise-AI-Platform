import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmisiKeyboardHint } from '../../tokens/emisi-a11y.tokens';

@Component({
  selector: 'emisi-keyboard-hints',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './keyboard-hints.component.html',
  styleUrl: './keyboard-hints.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmisiKeyboardHintsComponent {
  @Input() title = 'Keyboard Shortcuts';
  @Input() hints: EmisiKeyboardHint[] = [];
  @Input() compact = false;

  trackByHint(_index: number, hint: EmisiKeyboardHint): string {
    return `${hint.description}-${hint.keys.join('+')}`;
  }
}
