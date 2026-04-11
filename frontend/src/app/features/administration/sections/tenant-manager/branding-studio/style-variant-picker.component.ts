import { Component, ChangeDetectionStrategy, input, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon } from '@ng-icons/core';
import { StyleVariant } from './component-catalog';

@Component({
  selector: 'app-style-variant-picker',
  standalone: true,
  imports: [CommonModule, NgIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './style-variant-picker.component.html',
  styleUrl: './style-variant-picker.component.scss',
})
export class StyleVariantPickerComponent {
  readonly variants = input.required<StyleVariant[]>();
  readonly selectedId = model<string>('default');
}
