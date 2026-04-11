import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CreateTenantFormComponent } from './create-tenant-form.component';

describe('CreateTenantFormComponent', () => {
  let component: CreateTenantFormComponent;
  let fixture: ComponentFixture<CreateTenantFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CreateTenantFormComponent,
        ReactiveFormsModule,
        NoopAnimationsModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateTenantFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('form initialization', () => {
    it('should have all four form controls', () => {
      expect(component.form.contains('tenantName')).toBe(true);
      expect(component.form.contains('tenantUrl')).toBe(true);
      expect(component.form.contains('adminEmail')).toBe(true);
      expect(component.form.contains('licenseTierId')).toBe(true);
    });

    it('should start with invalid form', () => {
      expect(component.form.valid).toBe(false);
    });

    it('should start in form phase', () => {
      expect(component.phase()).toBe('form');
    });

    it('should have empty slug initially', () => {
      expect(component.slug()).toBe('');
    });
  });

  describe('slug generation', () => {
    it('should generate slug from tenant name', fakeAsync(() => {
      component.form.get('tenantName')!.setValue('Acme Corporation');
      tick();
      expect(component.slug()).toBe('acme-corporation');
    }));

    it('should strip special characters from slug', fakeAsync(() => {
      component.form.get('tenantName')!.setValue('Test@Company#123');
      tick();
      expect(component.slug()).toBe('testcompany123');
    }));

    it('should convert spaces to hyphens', fakeAsync(() => {
      component.form.get('tenantName')!.setValue('My New Tenant');
      tick();
      expect(component.slug()).toBe('my-new-tenant');
    }));
  });

  describe('tenant name validation', () => {
    it('should require tenant name', () => {
      const control = component.form.get('tenantName')!;
      control.setValue('');
      control.markAsTouched();

      expect(control.hasError('required')).toBe(true);
    });

    it('should reject names shorter than 2 characters', () => {
      const control = component.form.get('tenantName')!;
      control.setValue('A');
      control.markAsTouched();

      expect(control.hasError('tenantNameLength')).toBe(true);
    });

    it('should reject names with special characters', () => {
      const control = component.form.get('tenantName')!;
      control.setValue('Test@Corp!');
      control.markAsTouched();

      expect(control.hasError('tenantNameChars')).toBe(true);
    });

    it('should accept valid tenant name', () => {
      const control = component.form.get('tenantName')!;
      control.setValue('Valid Tenant Name');
      control.markAsTouched();

      expect(control.hasError('required')).toBe(false);
      expect(control.hasError('tenantNameLength')).toBe(false);
      expect(control.hasError('tenantNameChars')).toBe(false);
    });
  });

  describe('tenant URL validation', () => {
    it('should require tenant URL', () => {
      const control = component.form.get('tenantUrl')!;
      control.setValue('');
      control.markAsTouched();

      expect(control.hasError('required')).toBe(true);
    });

    it('should reject invalid tenant URL format', () => {
      const control = component.form.get('tenantUrl')!;
      control.setValue('not-a-tenant-url');
      control.markAsTouched();

      // TEN-E-009
      expect(control.hasError('tenantUrlFormat')).toBe(true);
    });

    it('should accept valid tenant URL', () => {
      const control = component.form.get('tenantUrl')!;
      control.setValue('ems.digitaldubai.ae');
      control.markAsTouched();

      expect(control.hasError('required')).toBe(false);
      expect(control.hasError('tenantUrlFormat')).toBe(false);
    });
  });

  describe('email validation', () => {
    it('should require admin email', () => {
      const control = component.form.get('adminEmail')!;
      control.setValue('');
      control.markAsTouched();

      expect(control.hasError('required')).toBe(true);
    });

    it('should reject invalid email', () => {
      const control = component.form.get('adminEmail')!;
      control.setValue('not-an-email');
      control.markAsTouched();

      // TEN-E-016
      expect(control.hasError('email')).toBe(true);
    });

    it('should accept valid email', () => {
      const control = component.form.get('adminEmail')!;
      control.setValue('admin@acme.com');
      control.markAsTouched();

      expect(control.hasError('required')).toBe(false);
      expect(control.hasError('email')).toBe(false);
    });
  });

  describe('license allocation', () => {
    it('should require license selection', () => {
      const control = component.form.get('licenseTierId')!;
      control.setValue('');
      control.markAsTouched();

      expect(control.hasError('required')).toBe(true);
    });

    it('should have license tier options', () => {
      expect(component.licenseTierOptions().length).toBeGreaterThan(0);
    });
  });

  describe('provisioning', () => {
    it('should have 7 provisioning steps', () => {
      expect(component.provisioningSteps().length).toBe(7);
    });

    it('should start with 0% progress', () => {
      expect(component.provisioningProgress()).toBe(0);
    });

    it('should not be in provisioning complete state initially', () => {
      expect(component.provisioningComplete()).toBe(false);
    });
  });

  describe('dialog behavior', () => {
    it('should emit visibleChange(false) on close', () => {
      const spy = jest.fn();
      component.visibleChange.subscribe(spy);

      component.close();

      expect(spy).toHaveBeenCalledWith(false);
    });

    it('should reset state on close', () => {
      component.phase.set('provisioning');
      component.close();

      expect(component.phase()).toBe('form');
      expect(component.slug()).toBe('');
      expect(component.provisioning()).toBe(false);
    });
  });

  describe('step status helpers', () => {
    it('should return correct icon classes', () => {
      expect(component.stepStatusIcon('completed')).toContain('check-circle');
      expect(component.stepStatusIcon('in-progress')).toContain('spinner');
      expect(component.stepStatusIcon('failed')).toContain('times-circle');
      expect(component.stepStatusIcon('pending')).toContain('circle');
    });

    it('should return correct CSS classes', () => {
      expect(component.stepStatusClass('completed')).toBe('step-completed');
      expect(component.stepStatusClass('in-progress')).toBe('step-in-progress');
      expect(component.stepStatusClass('failed')).toBe('step-failed');
      expect(component.stepStatusClass('pending')).toBe('step-pending');
    });
  });
});
