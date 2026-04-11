import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { LICENSE_STATE_LABELS } from '../../models/administration.models';
import { AdminLicenseService } from '../../services/admin-license.service';
import {
  MOBILE_DIALOG_BREAKPOINTS,
  standardDialogPt as sharedStandardDialogPt,
} from '../../../../core/theme/overlay-presets';

interface StatCard {
  readonly label: string;
  readonly value: string | number;
  readonly icon: string;
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

@Component({
  selector: 'app-license-manager-section',
  standalone: true,
  imports: [CommonModule, ButtonModule, DialogModule, MessageModule, SkeletonModule, TableModule],
  templateUrl: './license-manager-section.component.html',
  styleUrl: './license-manager-section.component.scss',
})
export class LicenseManagerSectionComponent implements OnInit, OnDestroy {
  private readonly service = inject(AdminLicenseService);
  private importCompletionTimer: ReturnType<typeof setInterval> | null = null;

  readonly licenseView = signal<'grid' | 'table'>('grid');
  readonly showImportModal = signal(false);
  readonly selectedFile = signal<File | null>(null);
  readonly isDragging = signal(false);
  readonly importError = signal<string | null>(null);

  readonly status = this.service.status;
  readonly currentLicense = this.service.currentLicense;
  readonly isLoading = this.service.isLoading;
  readonly isImporting = this.service.isImporting;
  readonly error = this.service.error;
  readonly features = this.service.features;
  readonly state = this.service.state;
  readonly degradedFeatures = computed(() => this.status()?.degradedFeatures ?? []);
  readonly hasLicense = computed(() => this.state() !== 'UNLICENSED');

  readonly stateLabel = computed(() => LICENSE_STATE_LABELS[this.state()] ?? this.state());
  readonly licenseTablePt = {
    root: {
      style: {
        border: '1px solid var(--tp-border)',
        'border-radius': 'var(--nm-radius-lg)',
        overflow: 'hidden',
        background: 'var(--tp-surface-raised)',
      },
    },
    headerCell: {
      style: {
        padding: 'var(--tp-space-3)',
        color: 'var(--tp-text-muted)',
        'font-size': 'var(--tp-font-sm)',
        'font-weight': '600',
        'text-transform': 'uppercase',
        'letter-spacing': '0.03em',
        background: 'var(--tp-surface)',
        'border-block-end': '1px solid var(--tp-border)',
      },
    },
    bodyCell: {
      style: {
        padding: 'var(--tp-space-3)',
        color: 'var(--tp-text)',
        'border-block-end': '1px solid color-mix(in srgb, var(--tp-border) 35%, transparent)',
      },
    },
  } as const;
  readonly dialogPt = sharedStandardDialogPt;
  readonly dialogBreakpoints = MOBILE_DIALOG_BREAKPOINTS;

  readonly daysText = computed(() => {
    const days = this.service.daysUntilExpiry();
    if (days === null) {
      return 'No expiry metadata';
    }
    if (days > 0) {
      return `${days} days remaining`;
    }
    if (days === 0) {
      return 'Expires today';
    }
    return `Expired ${Math.abs(days)} days ago`;
  });

  readonly daysBadgeClass = computed(() => {
    const days = this.service.daysUntilExpiry();
    if (days === null) {
      return 'days-muted';
    }
    if (days > 30) {
      return 'days-ok';
    }
    if (days > 0) {
      return 'days-warning';
    }
    return 'days-danger';
  });

  readonly statCards = computed<readonly StatCard[]>(() => {
    const status = this.status();
    const state = this.state();
    const tenantsUsed = status?.activeTenantCount ?? 0;
    const tenantsLimit = status?.maxTenants ?? 0;
    const days = this.service.daysUntilExpiry();
    const expiringSoon =
      (state === 'ACTIVE' || state === 'GRACE') && days !== null && days <= 30 && days >= 0 ? 1 : 0;

    return [
      { label: 'State', value: this.stateLabel(), icon: 'assets/icons/check-circle.svg' },
      {
        label: 'Tenants Used',
        value: `${tenantsUsed} / ${tenantsLimit}`,
        icon: 'assets/icons/building.svg',
      },
      { label: 'Features', value: this.features().length, icon: 'assets/icons/layers.svg' },
      { label: 'Expiring Soon', value: expiringSoon, icon: 'assets/icons/clock.svg' },
    ];
  });

  ngOnInit(): void {
    this.service.load();
  }

  ngOnDestroy(): void {
    this.clearImportTimer();
  }

  openImportModal(): void {
    this.importError.set(null);
    this.showImportModal.set(true);
  }

  closeImportModal(): void {
    this.showImportModal.set(false);
    this.selectedFile.set(null);
    this.isDragging.set(false);
    this.importError.set(null);
    this.clearImportTimer();
  }

  onImportModalVisibleChange(visible: boolean): void {
    if (visible) {
      this.showImportModal.set(true);
      return;
    }

    this.closeImportModal();
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    const file = event.dataTransfer?.files[0];
    if (file) {
      this.validateAndSetFile(file);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.validateAndSetFile(file);
    }
    input.value = '';
  }

  removeFile(event: Event): void {
    event.stopPropagation();
    this.selectedFile.set(null);
    this.importError.set(null);
  }

  importSelected(): void {
    const file = this.selectedFile();
    if (!file) {
      return;
    }

    this.importError.set(null);
    this.service.importLicense(file);
    this.waitForImportCompletion();
  }

  refresh(): void {
    this.service.clearError();
    this.service.load();
  }

  clearError(): void {
    this.service.clearError();
  }

  isDegraded(feature: string): boolean {
    return this.degradedFeatures().includes(feature);
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  private validateAndSetFile(file: File): void {
    this.importError.set(null);

    if (!file.name.toLowerCase().endsWith('.lic')) {
      this.importError.set('Only .lic files are accepted.');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      this.importError.set('File size exceeds 10 MB limit.');
      return;
    }

    this.selectedFile.set(file);
  }

  private waitForImportCompletion(): void {
    this.clearImportTimer();
    this.importCompletionTimer = setInterval(() => {
      if (this.isImporting()) {
        return;
      }

      this.clearImportTimer();
      if (this.error()) {
        this.importError.set(this.error());
        return;
      }

      this.closeImportModal();
    }, 120);
  }

  private clearImportTimer(): void {
    if (this.importCompletionTimer !== null) {
      clearInterval(this.importCompletionTimer);
      this.importCompletionTimer = null;
    }
  }
}
