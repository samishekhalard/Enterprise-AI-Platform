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
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Observable, of, timer } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { ProgressBarModule } from 'primeng/progressbar';
import { SelectModule } from 'primeng/select';

import {
  CreateTenantFormRequest,
  LicenseTier,
  ProvisioningStep,
  PROVISIONING_STEPS,
  ProvisioningStepStatus,
  TENANT_ERROR_CODES,
  TENANT_SUCCESS_CODES,
} from './create-tenant.models';

// ─── Slug generation ───────────────────────────────────────────────────────────

function toSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// ─── Custom validators ────────────────────────────────────────────────────────

function tenantNameValidator(control: AbstractControl): ValidationErrors | null {
  const value = (control.value ?? '').trim();
  if (!value) return null; // let required handle empty

  if (value.length < 2 || value.length > 100) {
    // TEN-E-002: Tenant name must be 2-100 characters
    return { tenantNameLength: true };
  }

  if (/[^a-zA-Z0-9\s\-_.]/.test(value)) {
    // TEN-E-002: No special characters allowed
    return { tenantNameChars: true };
  }

  return null;
}

function tenantUrlFormatValidator(control: AbstractControl): ValidationErrors | null {
  const value = (control.value ?? '').trim();
  if (!value) return null; // let required handle empty

  // TEN-E-009: Must be a valid tenant URL format
  const tenantUrlRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
  if (!tenantUrlRegex.test(value)) {
    return { tenantUrlFormat: true };
  }

  return null;
}

// ─── Async validators (simulated for prototype) ────────────────────────────────

/**
 * In production these would call the real API endpoints.
 * For prototype purposes they simulate a 600ms network round-trip.
 */
function asyncTenantNameValidator(
  control: AbstractControl,
): Observable<ValidationErrors | null> {
  const value = (control.value ?? '').trim();
  if (!value || value.length < 2) return of(null);

  return timer(600).pipe(
    switchMap(() => {
      // Simulate: "acme" is taken
      if (value.toLowerCase() === 'acme') {
        return of({ tenantNameTaken: true });
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
      // TEN-E-010: Simulate a claimed tenant URL
      if (value.toLowerCase() === 'acme.com') {
        return of({ tenantUrlClaimed: true });
      }
      return of(null);
    }),
    catchError(() => of(null)),
  );
}

// ─── Select option interface ───────────────────────────────────────────────────

interface LicenseTierOption {
  readonly label: string;
  readonly value: string;
}

@Component({
  selector: 'app-create-tenant-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    MessageModule,
    ProgressBarModule,
    SelectModule,
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

  /** Emits after successful tenant creation with the new tenant ID. */
  readonly tenantCreated = output<string>();

  // ─── Form ──────────────────────────────────────────────────────────────────

  readonly form: FormGroup = this.fb.group({
    tenantName: [
      '',
      [Validators.required, tenantNameValidator],
      [asyncTenantNameValidator],
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
    licenseTierId: ['', [Validators.required]],
  });

  // ─── Signals ───────────────────────────────────────────────────────────────

  /** Auto-generated slug from tenant name. */
  readonly slug = signal('');

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

  /** ID of the newly created tenant (set on success). */
  readonly createdTenantId = signal<string | null>(null);

  /** Available license tiers (loaded from API in production). */
  readonly licenseTiers = signal<LicenseTier[]>([
    {
      id: 'free-001',
      name: 'Free',
      tier: 'FREE',
      maxSeats: 5,
      availableSeats: 5,
      features: ['Basic'],
    },
    {
      id: 'std-001',
      name: 'Standard',
      tier: 'STANDARD',
      maxSeats: 50,
      availableSeats: 42,
      features: ['Basic', 'API Access'],
    },
    {
      id: 'pro-001',
      name: 'Professional',
      tier: 'PROFESSIONAL',
      maxSeats: 200,
      availableSeats: 178,
      features: ['Basic', 'API Access', 'SSO', 'Audit'],
    },
    {
      id: 'ent-001',
      name: 'Enterprise',
      tier: 'ENTERPRISE',
      maxSeats: -1,
      availableSeats: -1,
      features: ['Unlimited'],
    },
  ]);

  /** Mapped license options for the p-select dropdown. */
  readonly licenseTierOptions = computed<LicenseTierOption[]>(() =>
    this.licenseTiers().map((lt) => ({
      label:
        lt.tier === 'ENTERPRISE'
          ? `${lt.name} (Unlimited seats)`
          : `${lt.name} (${lt.availableSeats}/${lt.maxSeats} seats available)`,
      value: lt.id,
    })),
  );

  /** Overall provisioning progress (0-100). */
  readonly provisioningProgress = computed(() => {
    const steps = this.provisioningSteps();
    if (steps.length === 0) return 0;
    const completed = steps.filter((s) => s.status === 'completed').length;
    return Math.round((completed / steps.length) * 100);
  });

  /** Whether provisioning completed successfully. */
  readonly provisioningComplete = computed(() =>
    this.provisioningSteps().every((s) => s.status === 'completed'),
  );

  // ─── Dialog passthrough styles ─────────────────────────────────────────────

  readonly dialogStyle = { width: 'min(36rem, 92vw)' } as const;

  readonly dialogBreakpoints = { '768px': '92vw' } as const;

  readonly dialogPt = {
    root: {
      style: {
        'border-radius': 'var(--nm-radius-xl)',
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
    // Watch tenant name changes to generate slug
    this.form
      .get('tenantName')!
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((name: string) => {
        this.slug.set(toSlug(name ?? ''));
      });
  }

  // ─── Template Helpers ──────────────────────────────────────────────────────

  /** Whether the submit button should be disabled. */
  readonly canSubmit = computed(() => {
    // In provisioning phase, submit is not relevant
    if (this.phase() !== 'form') return false;
    // Form must be valid and not currently validating async
    return this.form.valid && !this.form.pending;
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
    if (!this.form.valid || this.form.pending) return;

    const request: CreateTenantFormRequest = {
      tenantName: this.form.value.tenantName.trim(),
      slug: this.slug(),
      tenantUrl: this.form.value.tenantUrl.trim(),
      adminEmail: this.form.value.adminEmail.trim(),
      licenseTierId: this.form.value.licenseTierId,
    };

    this.startProvisioning(request);
  }

  retry(): void {
    const failedId = this.failedStepId();
    if (!failedId) return;

    // Reset the failed step and all subsequent steps back to pending
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

  private startProvisioning(_request: CreateTenantFormRequest): void {
    this.phase.set('provisioning');
    this.provisioning.set(true);
    this.provisioningError.set(null);
    this.failedStepId.set(null);
    this.provisioningSteps.set(
      PROVISIONING_STEPS.map((s) => ({ ...s })),
    );

    this.simulateProvisioning();
  }

  /**
   * Simulates provisioning steps with staggered delays.
   * In production this would poll GET /api/tenants/{id}/provisioning-status.
   */
  private simulateProvisioning(): void {
    const steps = this.provisioningSteps();
    const nextPending = steps.find((s) => s.status === 'pending');

    if (!nextPending) {
      // All steps completed
      this.provisioning.set(false);
      this.createdTenantId.set('tenant-' + crypto.randomUUID().substring(0, 8));
      return;
    }

    // Mark current step as in-progress
    this.provisioningSteps.update((current) =>
      current.map((s) =>
        s.id === nextPending.id ? { ...s, status: 'in-progress' as const } : s,
      ),
    );

    // Simulate step completion after a delay
    const delay = 800 + Math.random() * 600;

    setTimeout(() => {
      // Mark step as completed
      this.provisioningSteps.update((current) =>
        current.map((s) =>
          s.id === nextPending.id ? { ...s, status: 'completed' as const } : s,
        ),
      );

      // Continue to next step
      this.simulateProvisioning();
    }, delay);
  }

  private resetState(): void {
    this.form.reset();
    this.slug.set('');
    this.phase.set('form');
    this.provisioning.set(false);
    this.provisioningError.set(null);
    this.failedStepId.set(null);
    this.createdTenantId.set(null);
    this.provisioningSteps.set([...PROVISIONING_STEPS]);
  }
}
