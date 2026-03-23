import { test, expect, Page } from '@playwright/test';

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
      authProviders: [
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
      ],
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

async function assertNoHorizontalOverflow(page: Page): Promise<void> {
  const hasOverflow = await page.evaluate(() => {
    const maxWidth = Math.max(
      document.documentElement.scrollWidth,
      document.body.scrollWidth
    );
    return maxWidth > window.innerWidth + 1;
  });

  expect(hasOverflow).toBeFalsy();
}

test.beforeEach(async ({ page }) => {
  await mockTenantResolution(page);
});

test.describe('Responsive Authentication Experience', () => {
  test('should keep login entry point usable on small mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('/login');

    const emailButton = page.getByRole('button', { name: /sign in with email/i });
    await expect(emailButton).toBeVisible();

    const buttonBox = await emailButton.boundingBox();
    expect(buttonBox).not.toBeNull();
    expect((buttonBox?.x ?? 0) >= 0).toBeTruthy();
    expect((buttonBox?.width ?? 0) <= 320).toBeTruthy();

    await assertNoHorizontalOverflow(page);
  });

  test('should keep email/password form usable on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/login');
    await page.getByRole('button', { name: /sign in with email/i }).click();

    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page.getByLabel(/password/i);
    const signInButton = page.locator('button.submit-btn[type="submit"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(signInButton).toBeVisible();

    await emailInput.fill('test@example.com');
    await passwordInput.fill('TestPassword123!');
    await expect(signInButton).toBeEnabled();

    await assertNoHorizontalOverflow(page);
  });

  test('should preserve layout integrity on tablet and desktop viewports', async ({ page }) => {
    const viewports = [
      { width: 768, height: 1024 },
      { width: 1440, height: 900 }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('/login');

      await expect(page.getByRole('heading', { name: /welcome to/i })).toBeVisible();
      await expect(page.locator('.login-header')).toBeVisible();
      await expect(page.getByRole('button', { name: /sign in with email/i })).toBeVisible();

      await assertNoHorizontalOverflow(page);
    }
  });
});
