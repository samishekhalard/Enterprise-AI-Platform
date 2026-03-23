import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-tag-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="tag-input-container">
      <div class="tags-list mb-2" *ngIf="tags().length">
        <span *ngFor="let tag of tags(); let i = index"
              class="badge me-1 mb-1"
              [style.background-color]="color() + '20'"
              [style.border]="'1px solid ' + color() + '50'"
              [style.color]="color()">
          {{ tag }}
          <button type="button" class="btn-close btn-close-sm ms-1"
                  (click)="onRemove.emit(i)"
                  aria-label="Remove"></button>
        </span>
      </div>
      <input type="text"
             class="form-control form-control-sm rounded-pill"
             [(ngModel)]="inputValue"
             [placeholder]="placeholder()"
             (keydown)="onKeyDown($event)">
    </div>
  `,
  styles: [`
    .badge {
      font-weight: 500;
      font-size: 0.75rem;
      padding: 0.35em 0.65em;
    }
    .btn-close-sm {
      font-size: 0.5rem;
      padding: 0.25em;
      vertical-align: middle;
    }
    .form-control {
      border-color: var(--bs-primary);
    }
  `]
})
export class TagInputComponent {
  tags = input<string[]>([]);
  placeholder = input<string>('Type and press Enter');
  color = input<string>('#b9a779');

  onAdd = output<string>();
  onRemove = output<number>();

  inputValue = '';

  onKeyDown(event: KeyboardEvent): void {
    if ((event.key === 'Enter' || event.key === ',') && this.inputValue.trim()) {
      event.preventDefault();
      this.onAdd.emit(this.inputValue.trim());
      this.inputValue = '';
    }
  }
}
