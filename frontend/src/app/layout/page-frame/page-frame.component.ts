import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-page-frame',
  standalone: true,
  templateUrl: './page-frame.component.html',
  styleUrl: './page-frame.component.scss',
})
export class PageFrameComponent {
  @Input({ required: true }) title!: string;
  @Input() subtitle = '';
}
