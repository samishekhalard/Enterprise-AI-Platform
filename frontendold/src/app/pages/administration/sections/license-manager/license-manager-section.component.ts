import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LicenseAdminService } from './license-admin.service';
import { LICENSE_STATE_LABELS } from '../../models/administration.models';

interface StatCard {
  label: string;
  value: string | number;
  icon: string;
  iconClass: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

@Component({
  selector: 'app-license-manager-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './license-manager-section.component.html',
  styleUrl: './license-manager-section.component.scss'
})
export class LicenseManagerSectionComponent implements OnInit {
  readonly licenseService = inject(LicenseAdminService);

  // View state
  readonly licenseView = signal<'grid' | 'table'>('grid');

  // Modal state
  readonly showImportModal = signal(false);
  readonly selectedFile = signal<File | null>(null);
  readonly isDragging = signal(false);
  readonly importError = signal<string | null>(null);

  /** True when license state is anything other than UNLICENSED. */
  readonly hasLicense = computed(() => this.licenseService.hasLicense());

  /** Human-readable label for the current license state. */
  readonly stateLabel = computed(() =>
    LICENSE_STATE_LABELS[this.licenseService.licenseState()] ?? 'Unknown'
  );

  /** Computed stat cards derived from license status. */
  readonly statCards = computed<StatCard[]>(() => {
    const status = this.licenseService.licenseStatus();
    const state = this.licenseService.licenseState();

    const hasActive = state === 'ACTIVE' || state === 'GRACE';
    const isExpiringSoon = hasActive && (this.licenseService.daysUntilExpiry() ?? Infinity) <= 30;
    const tenants = status?.activeTenantCount ?? 0;

    return [
      {
        label: 'Total Licenses',
        value: hasActive || state === 'EXPIRED' || state === 'TAMPERED' ? 1 : 0,
        icon: 'assets/icons/briefcase.svg',
        iconClass: 'stat-icon-primary'
      },
      {
        label: 'Active',
        value: hasActive ? 1 : 0,
        icon: 'assets/icons/check-circle.svg',
        iconClass: 'stat-icon-success'
      },
      {
        label: 'Expiring Soon',
        value: isExpiringSoon ? 1 : 0,
        icon: 'assets/icons/clock.svg',
        iconClass: 'stat-icon-warning'
      },
      {
        label: 'Assigned to Tenants',
        value: tenants,
        icon: 'assets/icons/building.svg',
        iconClass: 'stat-icon-neutral'
      }
    ];
  });

  /** Text describing days until expiry. */
  readonly daysRemainingText = computed<string | null>(() => {
    const days = this.licenseService.daysUntilExpiry();
    if (days === null) return null;
    if (days > 0) return `${days} days remaining`;
    if (days === 0) return 'Expires today';
    return `Expired ${Math.abs(days)} days ago`;
  });

  /** CSS class for the days remaining badge. */
  readonly daysRemainingClass = computed(() => {
    const days = this.licenseService.daysUntilExpiry();
    if (days === null) return '';
    if (days > 30) return 'days-ok';
    if (days > 0) return 'days-warning';
    return 'days-danger';
  });

  ngOnInit(): void {
    this.licenseService.loadLicenseStatus();
  }

  /** Check whether a feature is in the degraded features list. */
  isDegraded(feature: string): boolean {
    return (this.licenseService.licenseStatus()?.degradedFeatures ?? []).includes(feature);
  }

  /** Retry loading license status. */
  retry(): void {
    this.licenseService.clearError();
    this.licenseService.loadLicenseStatus();
  }

  // ---------------------------------------------------------------------------
  // File Upload Handlers
  // ---------------------------------------------------------------------------

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
    // Reset input so the same file can be re-selected
    input.value = '';
  }

  removeFile(event: Event): void {
    event.stopPropagation();
    this.selectedFile.set(null);
    this.importError.set(null);
  }

  closeImportModal(): void {
    this.showImportModal.set(false);
    this.selectedFile.set(null);
    this.importError.set(null);
    this.isDragging.set(false);
  }

  importLicense(): void {
    const file = this.selectedFile();
    if (!file) return;

    this.importError.set(null);
    this.licenseService.importLicense(file);

    // Watch for completion — close modal on success
    const checkInterval = setInterval(() => {
      if (!this.licenseService.isImporting()) {
        clearInterval(checkInterval);
        if (!this.licenseService.error()) {
          this.closeImportModal();
        } else {
          this.importError.set(this.licenseService.error());
        }
      }
    }, 100);
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  private validateAndSetFile(file: File): void {
    this.importError.set(null);

    if (!file.name.endsWith('.lic')) {
      this.importError.set('Only .lic files are accepted.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      this.importError.set('File size exceeds 10 MB limit.');
      return;
    }

    this.selectedFile.set(file);
  }
}
