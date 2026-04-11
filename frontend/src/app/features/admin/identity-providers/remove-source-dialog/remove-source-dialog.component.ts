import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { NgIcon } from '@ng-icons/core';
import { TenantIdentityProvider } from '../../../../core/api/models';
import { REMOVE_DIALOG_STYLE, dangerDialogPt } from '../../../../core/theme/overlay-presets';

export type UserDisposition = 'retain' | 'deactivate';

export interface RemoveSourceResult {
  readonly providerId: string;
  readonly userDisposition: UserDisposition;
}

interface SelectOption<T> {
  label: string;
  value: T;
}

@Component({
  selector: 'app-remove-source-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    NgIcon,
  ],
  templateUrl: './remove-source-dialog.component.html',
  styleUrl: './remove-source-dialog.component.scss',
})
export class RemoveSourceDialogComponent {
  @Input() visible = false;
  @Input() provider: TenantIdentityProvider | null = null;
  @Input() userCount = 0;
  @Input() tenantCount = 1;
  @Input() isLastActive = false;
  @Input() removing = false;

  @Output() closed = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<RemoveSourceResult>();

  protected readonly userDispositionOptions: SelectOption<UserDisposition>[] = [
    {
      label: 'Retain users and mark them as orphaned',
      value: 'retain',
    },
    {
      label: 'Deactivate all provisioned users',
      value: 'deactivate',
    },
  ];
  protected readonly dialogPt = dangerDialogPt;
  protected readonly dialogStyle = REMOVE_DIALOG_STYLE;

  protected readonly userDisposition = signal<UserDisposition>('retain');
  protected readonly confirmText = signal('');

  protected get confirmMatch(): boolean {
    if (!this.provider) return false;
    return (
      this.confirmText().trim().toLowerCase() === this.provider.displayName.trim().toLowerCase()
    );
  }

  protected get canRemove(): boolean {
    return this.confirmMatch && !this.isLastActive && !this.removing;
  }

  protected onDialogVisibleChange(visible: boolean): void {
    if (!visible) {
      this.onCancel();
    }
  }

  protected updateConfirmText(value: string): void {
    this.confirmText.set(value);
  }

  protected onCancel(): void {
    this.resetState();
    this.closed.emit();
  }

  protected onConfirm(): void {
    if (!this.canRemove || !this.provider) return;
    this.confirmed.emit({
      providerId: this.provider.id,
      userDisposition: this.userDisposition(),
    });
  }

  private resetState(): void {
    this.userDisposition.set('retain');
    this.confirmText.set('');
  }
}
