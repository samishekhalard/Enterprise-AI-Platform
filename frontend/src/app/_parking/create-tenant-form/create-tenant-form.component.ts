import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  output,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Observable, of, timer } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { ProgressBarModule } from 'primeng/progressbar';
import { Slider } from 'primeng/slider';

import {
  CreateTenantFormRequest,
  LicenseAvailability,
  LicenseAllocation,
  TenantLicenseStatus,
  ProvisioningStep,
  PROVISIONING_STEPS,
  ProvisioningStepStatus,
  TENANT_ERROR_CODES,
  TENANT_SUCCESS_CODES,
} from './create-tenant.models';

// ─── Custom validators ────────────────────────────────────────────────────────

function tenantNameValidator(control: AbstractControl): ValidationErrors | null {
  const value = (control.value ?? '').trim();
  if (!value) return null; // let required handle empty

  if (value.length < 2 || value.length > 100) {
    return { tenantNameLength: true };
  }

  if (/[^a-zA-Z0-9\s\-_.]/.test(value)) {
    return { tenantNameChars: true };
  }

  return null;
}

function shortNameValidator(control: AbstractControl): ValidationErrors | null {
  const value = (control.value ?? '').trim();
  if (!value) return null; // let required handle empty

  if (value.length < 2 || value.length > 50) {
    return { shortNameLength: true };
  }

  // Must be lowercase alphanumeric + hyphens only, no leading/trailing hyphens
  if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(value)) {
    return { shortNameFormat: true };
  }

  return null;
}

function tenantUrlFormatValidator(control: AbstractControl): ValidationErrors | null {
  const value = (control.value ?? '').trim();
  if (!value) return null;

  const tenantUrlRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
  if (!tenantUrlRegex.test(value)) {
    return { tenantUrlFormat: true };
  }

  return null;
}

// ─── Async validators (simulated for prototype) ────────────────────────────────

function asyncTenantNameValidator(
  control: AbstractControl,
): Observable<ValidationErrors | null> {
  const value = (control.value ?? '').trim();
  if (!value || value.length < 2) return of(null);

  return timer(600).pipe(
    switchMap(() => {
      if (value.toLowerCase() === 'acme') {
        return of({ tenantNameTaken: true });
      }
      return of(null);
    }),
    catchError(() => of(null)),
  );
}

function asyncShortNameValidator(
  control: AbstractControl,
): Observable<ValidationErrors | null> {
  const value = (control.value ?? '').trim();
  if (!value || value.length < 2) return of(null);

  return timer(600).pipe(
    switchMap(() => {
      // Simulate: "acme-corp" is taken
      if (value.toLowerCase() === 'acme-corp') {
        return of({ shortNameTaken: true });
      }
      return of(null);
    }),
    catchError(() => of(null)),
  );
}

function asyncTenantUrlValidator(
  control: AbstractControl,
): Observable<ValidationErrors | null> {
  const value = (control.value ?? '').trim();
  if (!value) return of(null);

  return timer(600).pipe(
    switchMap(() => {
      if (value.toLowerCase() === 'acme.com') {
        return of({ tenantUrlClaimed: true });
      }
      return of(null);
    }),
    catchError(() => of(null)),
  );
}

@Component({
  selector: 'app-create-tenant-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    MessageModule,
    ProgressBarModule,
    Slider,
  ],
  templateUrl: './create-tenant-form.component.html',
  styleUrl: './create-tenant-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateTenantFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  // ─── Inputs / Outputs ──────────────────────────────────────────────────────

  /** Controls dialog visibility from the parent. */
  readonly visible = input<boolean>(false);

  /** Emits when the dialog should close. */
  readonly visibleChange = output<boolean>();

  /** Emits after successful tenant creation with the new tenant ID (UUID). */
  readonly tenantCreated = output<string>();

  // ─── Form ──────────────────────────────────────────────────────────────────

  readonly form: FormGroup = this.fb.group({
    tenantName: [
      '',
      [Validators.required, tenantNameValidator],
      [asyncTenantNameValidator],
    ],
    shortName: [
      '',
      [Validators.required, shortNameValidator],
      [asyncShortNameValidator],
    ],
    tenantUrl: [
      '',
      [Validators.required, tenantUrlFormatValidator],
      [asyncTenantUrlValidator],
    ],
    adminEmail: [
      '',
      [Validators.required, Validators.email],
    ],
  });

  // ─── Signals ───────────────────────────────────────────────────────────────

  /** Tracks form validity as a signal so computed() can react to it. */
  readonly formValid = signal(false);
  readonly formPending = signal(false);

  /** Current dialog phase: 'form' or 'provisioning'. */
  readonly phase = signal<'form' | 'provisioning'>('form');

  /** Provisioning steps with live status. */
  readonly provisioningSteps = signal<ProvisioningStep[]>([...PROVISIONING_STEPS]);

  /** Whether provisioning is in progress. */
  readonly provisioning = signal(false);

  /** Provisioning error message. */
  readonly provisioningError = signal<string | null>(null);

  /** Failed step ID for retry UX. */
  readonly failedStepId = signal<string | null>(null);

  /** ID of the newly created tenant — auto-generated UUID. */
  readonly createdTenantId = signal<string | null>(null);

  // ─── License Allocation ────────────────────────────────────────────────────

  readonly adminSeats = signal(0);
  readonly userSeats = signal(0);
  readonly viewerSeats = signal(0);

  readonly licenseAvailability = signal<LicenseAvailability[]>([
    { type: 'ADMIN', label: 'Admin', totalPlatform: 50, allocatedOther: 30, available: 20 },
    { type: 'USER', label: 'User', totalPlatform: 200, allocatedOther: 150, available: 50 },
    { type: 'VIEWER', label: 'Viewer', totalPlatform: 500, allocatedOther: 300, available: 200 },
  ]);

  readonly tenantLicenseStatus = signal<TenantLicenseStatus>({
    totalTenantLicenses: 10,
    usedTenantLicenses: 7,
    available: true,
  });

  readonly canCreateTenant = computed(() => this.tenantLicenseStatus().available);

  readonly licenseAllocationValid = computed(() => this.adminSeats() >= 1);

  readonly provisioningProgress = computed(() => {
    const steps = this.provisioningSteps();
    if (steps.length === 0) return 0;
    const completed = steps.filter((s) => s.status === 'completed').length;
    return Math.round((completed / steps.length) * 100);
  });

  readonly provisioningComplete = computed(() =>
    this.provisioningSteps().every((s) => s.status === 'completed'),
  );

  // ─── Dialog passthrough styles ─────────────────────────────────────────────

  readonly dialogStyle = { width: 'min(36rem, 92vw)' } as const;

  readonly dialogBreakpoints = { '768px': '92vw' } as const;

  readonly dialogPt = {
    root: {
      style: {
        'border-radius': 'var(--nm-radius-lg)',
        overflow: 'hidden',
      },
    },
    header: {
      style: {
        background: 'var(--tp-surface-raised)',
        padding: 'var(--tp-space-4) var(--tp-space-5)',
        color: 'var(--tp-text-dark)',
        'border-block-end': '1px solid var(--tp-border)',
        'align-items': 'flex-start',
      },
    },
    content: {
      style: {
        background: 'var(--tp-surface-raised)',
        padding: 'var(--tp-space-4) var(--tp-space-5)',
      },
    },
    footer: {
      style: {
        background: 'var(--tp-surface-raised)',
        padding: 'var(--tp-space-3) var(--tp-space-5)',
        'border-block-start': '1px solid var(--tp-border)',
        display: 'flex',
        'justify-content': 'flex-end',
        gap: 'var(--tp-space-2)',
        'flex-wrap': 'wrap',
      },
    },
    mask: {
      style: {
        background: 'color-mix(in srgb, var(--tp-text-dark) 35%, transparent)',
        'backdrop-filter': 'blur(2px)',
      },
    },
  } as const;

  constructor() {
    // Track form validity changes as signals for reactive canSubmit
    this.form.statusChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.formValid.set(this.form.valid);
        this.formPending.set(this.form.pending);
      });
  }

  // ─── Template Helpers ──────────────────────────────────────────────────────

  /** Whether the submit button should be enabled. */
  readonly canSubmit = computed(() => {
    if (this.phase() !== 'form') return false;
    if (!this.canCreateTenant()) return false;
    if (!this.licenseAllocationValid()) return false;
    // formValid and formPending are signals — reactive
    return this.formValid() && !this.formPending();
  });

  hasError(field: string, error: string): boolean {
    const control = this.form.get(field);
    return !!control && control.hasError(error) && (control.dirty || control.touched);
  }

  isValidating(field: string): boolean {
    const control = this.form.get(field);
    return !!control && control.pending;
  }

  stepStatusIcon(status: ProvisioningStepStatus): string {
    switch (status) {
      case 'completed':
        return 'pi pi-check-circle';
      case 'in-progress':
        return 'pi pi-spin pi-spinner';
      case 'failed':
        return 'pi pi-times-circle';
      default:
        return 'pi pi-circle';
    }
  }

  stepStatusClass(status: ProvisioningStepStatus): string {
    switch (status) {
      case 'completed':
        return 'step-completed';
      case 'in-progress':
        return 'step-in-progress';
      case 'failed':
        return 'step-failed';
      default:
        return 'step-pending';
    }
  }

  // ─── Slider Helpers ──────────────────────────────────────────────────────

  getSliderValue(type: 'ADMIN' | 'USER' | 'VIEWER'): number {
    switch (type) {
      case 'ADMIN': return this.adminSeats();
      case 'USER': return this.userSeats();
      case 'VIEWER': return this.viewerSeats();
    }
  }

  setSliderValue(type: 'ADMIN' | 'USER' | 'VIEWER', value: number): void {
    switch (type) {
      case 'ADMIN': this.adminSeats.set(value); break;
      case 'USER': this.userSeats.set(value); break;
      case 'VIEWER': this.viewerSeats.set(value); break;
    }
  }

  // ─── Actions ───────────────────────────────────────────────────────────────

  onVisibleChange(visible: boolean): void {
    if (!visible) {
      this.close();
    }
  }

  close(): void {
    this.visibleChange.emit(false);
    this.resetState();
  }

  submit(): void {
    if (!this.form.valid || this.form.pending || !this.licenseAllocationValid()) return;

    // Auto-generate UUID for the tenant node
    const tenantId = crypto.randomUUID();

    const request: CreateTenantFormRequest = {
      id: tenantId,
      tenantName: this.form.value.tenantName.trim(),
      shortName: this.form.value.shortName.trim(),
      tenantUrl: this.form.value.tenantUrl.trim(),
      adminEmail: this.form.value.adminEmail.trim(),
      licenseAllocation: {
        adminSeats: this.adminSeats(),
        userSeats: this.userSeats(),
        viewerSeats: this.viewerSeats(),
      },
    };

    this.startProvisioning(request);
  }

  retry(): void {
    const failedId = this.failedStepId();
    if (!failedId) return;

    this.provisioningSteps.update((steps) =>
      steps.map((step) => {
        if (step.order >= (steps.find((s) => s.id === failedId)?.order ?? 0)) {
          return { ...step, status: 'pending' as const };
        }
        return step;
      }),
    );

    this.provisioningError.set(null);
    this.failedStepId.set(null);
    this.simulateProvisioning();
  }

  navigateToTenant(): void {
    const tenantId = this.createdTenantId();
    if (tenantId) {
      this.tenantCreated.emit(tenantId);
    }
    this.close();
  }

  // ─── Provisioning Simulation ───────────────────────────────────────────────

  private startProvisioning(request: CreateTenantFormRequest): void {
    this.phase.set('provisioning');
    this.provisioning.set(true);
    this.provisioningError.set(null);
    this.failedStepId.set(null);
    this.createdTenantId.set(request.id);
    this.provisioningSteps.set(
      PROVISIONING_STEPS.map((s) => ({ ...s })),
    );

    this.simulateProvisioning();
  }

  private simulateProvisioning(): void {
    const steps = this.provisioningSteps();
    const nextPending = steps.find((s) => s.status === 'pending');

    if (!nextPending) {
      this.provisioning.set(false);
      return;
    }

    this.provisioningSteps.update((current) =>
      current.map((s) =>
        s.id === nextPending.id ? { ...s, status: 'in-progress' as const } : s,
      ),
    );

    const delay = 800 + Math.random() * 600;

    setTimeout(() => {
      this.provisioningSteps.update((current) =>
        current.map((s) =>
          s.id === nextPending.id ? { ...s, status: 'completed' as const } : s,
        ),
      );

      this.simulateProvisioning();
    }, delay);
  }

  private resetState(): void {
    this.form.reset();
    this.adminSeats.set(0);
    this.userSeats.set(0);
    this.viewerSeats.set(0);
    this.phase.set('form');
    this.provisioning.set(false);
    this.provisioningError.set(null);
    this.failedStepId.set(null);
    this.createdTenantId.set(null);
    this.provisioningSteps.set([...PROVISIONING_STEPS]);
    this.formValid.set(false);
    this.formPending.set(false);
  }
}
