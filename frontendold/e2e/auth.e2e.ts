import { test, expect, Page } from '@playwright/test';

const TEST_USER = {
  id: 'user-001',
  email: 'test@example.com',
  emailVerified: true,
  firstName: 'Test',
  lastName: 'User',
  displayName: 'Test User',
  locale: 'en',
  timezone: 'Asia/Dubai',
  roles: ['user'],
  permissions: [],
  tenantId: 'test-tenant-001',
  tenantRole: 'member',
  authProvider: 'local',
  lastLogin: '2025-01-01T08:00:00Z',
  createdAt: '2024-01-01T08:00:00Z'
};

function getTenantAuthProviders() {
  return [
    {
      id: 'provider-azure-001',
      type: 'azure-ad',
      name: 'azure-ad',
      displayName: 'Microsoft Entra ID',
      isEnabled: true,
      isPrimary: true,
      sortOrder: 1,
      config: {
        type: 'azure-ad',
        tenantId: 'azure-tenant-id',
        clientId: 'azure-client-id',
        redirectUri: 'http://localhost:4200/auth/callback',
        scopes: ['openid', 'profile', 'email']
      }
    },
    {
      id: 'provider-local-001',
      type: 'local',
      name: 'local',
      displayName: 'Email and Password',
      isEnabled: true,
      isPrimary: false,
      sortOrder: 2,
      config: {
        type: 'local',
        allowRegistration: false,
        requireEmailVerification: false,
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: false,
          preventReuse: 5,
          expirationDays: 90
        }
      }
    }
  ];
}

function getTenantResolutionResponse() {
  return {
    resolved: true,
    hostname: 'localhost',
    tenant: {
      id: 'test-tenant-001',
      uuid: '00000000-0000-0000-0000-000000000001',
      fullName: 'EMSIST Test Tenant',
      shortName: 'EMSIST',
      slug: 'emsist-test',
      tenantType: 'regular',
      tier: 'enterprise',
      status: 'active',
      domains: [
        {
          id: 'domain-001',
          domain: 'localhost',
          isPrimary: true,
          isVerified: true,
          verificationMethod: 'dns-txt',
          sslStatus: 'active',
          createdAt: '2025-01-01T00:00:00Z'
        }
      ],
      primaryDomain: 'localhost',
      authProviders: getTenantAuthProviders(),
      defaultAuthProvider: 'local',
      branding: {
        primaryColor: '#047481',
        primaryColorDark: '#035a64',
        secondaryColor: '#64748b',
        logoUrl: '/assets/images/logo.svg',
        faviconUrl: '/assets/favicon.ico',
        fontFamily: "'Gotham Rounded', 'Nunito', sans-serif"
      },
      sessionConfig: {
        accessTokenLifetime: 5,
        refreshTokenLifetime: 30,
        idleTimeout: 15,
        absoluteTimeout: 480,
        maxConcurrentSessions: 5,
        allowMultipleDevices: true,
        requireDeviceApproval: false,
        enforceIpBinding: false,
        allowRememberMe: true,
        rememberMeDuration: 30
      },
      mfaConfig: {
        enabled: true,
        required: false,
        allowedMethods: ['totp', 'email'],
        defaultMethod: 'totp',
        gracePeriodDays: 7,
        rememberDeviceDays: 30
      },
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z'
    }
  };
}

async function mockTenantResolution(page: Page): Promise<void> {
  await page.route('**/api/tenants/resolve*', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(getTenantResolutionResponse())
    });
  });
}

async function setupAuthenticatedSession(page: Page): Promise<void> {
  await page.addInitScript((user) => {
    sessionStorage.setItem('auth_user', JSON.stringify(user));
    sessionStorage.setItem('auth_refresh_token', 'mock-refresh-token');
    sessionStorage.setItem('auth_tenant_id', user.tenantId);

    // Backward compatibility for legacy checks in some components/tests
    localStorage.setItem('auth_access_token', 'mock-access-token');
    localStorage.setItem('auth_user', JSON.stringify(user));
  }, TEST_USER);

  await page.route('**/api/v1/auth/refresh', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        accessToken: 'refreshed-access-token',
        refreshToken: 'mock-refresh-token',
        tokenType: 'Bearer',
        expiresIn: 3600,
        refreshExpiresIn: 86400,
        scope: 'openid profile email',
        user: TEST_USER
      })
    });
  });
}

async function goToEmailSignInForm(page: Page): Promise<void> {
  await page.goto('/login');
  const emailSignInButton = page.getByRole('button', { name: /sign in with email/i });
  await expect(emailSignInButton).toBeVisible();

  try {
    await emailSignInButton.click();
  } catch {
    // WebKit can occasionally report the button as unstable due to animated layers.
    await emailSignInButton.click({ force: true });
  }

  await expect(page.getByLabel(/email/i)).toBeVisible();
}

async function mockMfaLoginResponse(page: Page): Promise<void> {
  await page.route('**/api/v1/auth/login', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        mfaRequired: true,
        mfaToken: 'mock-mfa-token'
      })
    });
  });
}

test.beforeEach(async ({ page }) => {
  await mockTenantResolution(page);
});

test.describe('Authentication Flow', () => {
  test.describe('Login Page', () => {
    test('should display sign-in options and email login form', async ({ page }) => {
      await page.goto('/login');

      await expect(page.getByRole('button', { name: /sign in with email/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /sign in with microsoft|entra|azure/i })).toBeVisible();

      await page.getByRole('button', { name: /sign in with email/i }).click();

      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
      await expect(page.locator('button.submit-btn[type="submit"]')).toBeVisible();
    });

    test('should show validation errors for empty fields', async ({ page }) => {
      await goToEmailSignInForm(page);
      await page.locator('button.submit-btn[type="submit"]').click();

      await expect(page.getByText(/email is required/i)).toBeVisible();
    });

    test('should show validation error for invalid email', async ({ page }) => {
      await goToEmailSignInForm(page);
      const emailInput = page.getByLabel(/email/i);
      await emailInput.fill('invalid-email');
      await page.getByLabel(/password/i).fill('password123');
      await page.locator('button.submit-btn[type="submit"]').click();

      const isValidEmail = await emailInput.evaluate((el) => (el as HTMLInputElement).validity.valid);
      const validationMessage = await emailInput.evaluate((el) => (el as HTMLInputElement).validationMessage);

      expect(isValidEmail).toBeFalsy();
      expect(validationMessage.length > 0).toBeTruthy();
    });

    test('should toggle password visibility', async ({ page }) => {
      await goToEmailSignInForm(page);
      const passwordInput = page.getByLabel(/password/i);

      await passwordInput.fill('secretpassword');
      await expect(passwordInput).toHaveAttribute('type', 'password');

      await page.locator('.toggle-password').click();
      await expect(passwordInput).toHaveAttribute('type', 'text');
    });

    test('should have forgot password link in email login form', async ({ page }) => {
      await goToEmailSignInForm(page);
      await expect(page.getByRole('link', { name: /forgot password/i })).toBeVisible();
    });

    test('should redirect to products after successful login', async ({ page }) => {
      await goToEmailSignInForm(page);

      await page.route('**/api/v1/auth/login', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
            tokenType: 'Bearer',
            expiresIn: 3600,
            refreshExpiresIn: 86400,
            scope: 'openid profile email',
            user: TEST_USER
          })
        });
      });

      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/password/i).fill('TestPassword123!');
      await page.locator('button.submit-btn[type="submit"]').click();

      await expect(page).toHaveURL(/\/products/);
    });
  });

  test.describe('Protected Routes', () => {
    const protectedRoutes = ['/products', '/personas', '/process-modeler', '/administration'];

    for (const routePath of protectedRoutes) {
      test(`should redirect unauthenticated users from ${routePath} to login`, async ({ page }) => {
        await page.goto(routePath);
        await expect(page).toHaveURL(/\/login/);
      });
    }

    test('should allow authenticated users to access protected route', async ({ page }) => {
      await setupAuthenticatedSession(page);
      await page.goto('/products');
      await expect(page).toHaveURL(/\/products/);
    });
  });

  test.describe('Password Reset', () => {
    test('should navigate to password reset page', async ({ page }) => {
      await goToEmailSignInForm(page);
      await page.getByRole('link', { name: /forgot password/i }).click();
      await expect(page).toHaveURL(/\/auth\/password-reset/);
    });

    test('should display password reset form', async ({ page }) => {
      await page.goto('/auth/password-reset');
      await expect(page.getByLabel(/email address/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /send reset link/i })).toBeVisible();
    });

    test('should show success message after submitting reset request', async ({ page }) => {
      await page.route('**/api/v1/auth/password/reset', async route => {
        await route.fulfill({ status: 202 });
      });

      await page.goto('/auth/password-reset');
      await page.getByLabel(/email address/i).fill('test@example.com');
      await page.getByRole('button', { name: /send reset link/i }).click();

      await expect(page.getByRole('heading', { name: /check your email/i })).toBeVisible();
    });
  });

  test.describe('Logout', () => {
    test('should logout and navigate back to login', async ({ page }) => {
      await setupAuthenticatedSession(page);

      await page.route('**/api/v1/auth/logout', async route => {
        await route.fulfill({ status: 200 });
      });

      await page.goto('/auth/logout');
      await expect(page).toHaveURL(/\/login/);
    });
  });
});

test.describe('MFA Flow', () => {
  test('should redirect to MFA verification page when required', async ({ page }) => {
    await goToEmailSignInForm(page);
    await mockMfaLoginResponse(page);

    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('TestPassword123!');
    await page.locator('button.submit-btn[type="submit"]').click();

    await expect(page).toHaveURL(/\/auth\/mfa\/verify/);
  });

  test('should display MFA code input and verify button', async ({ page }) => {
    await goToEmailSignInForm(page);
    await mockMfaLoginResponse(page);

    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('TestPassword123!');
    await page.locator('button.submit-btn[type="submit"]').click();

    await expect(page.locator('input[name="code"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /^verify$/i })).toBeVisible();
  });
});

test.describe('Error Pages', () => {
  test('should display tenant not found page', async ({ page }) => {
    await page.goto('/errors/tenant-not-found');
    await expect(page.getByRole('heading', { name: /organization not found/i })).toBeVisible();
  });

  test('should display access denied page', async ({ page }) => {
    await page.goto('/errors/access-denied');
    await expect(page.getByRole('heading', { name: /access denied/i })).toBeVisible();
  });

  test('should display session expired page', async ({ page }) => {
    await page.goto('/errors/session-expired');
    await expect(page.getByRole('heading', { name: /session expired/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
  });
});
