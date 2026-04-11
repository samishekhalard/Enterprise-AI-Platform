import { expect, test } from '@playwright/test';

/**
 * US-AC-02: Add Authentication Source Wizard E2E Tests
 *
 * Tests verify the 5-step wizard modal for creating authentication sources.
 * All API calls are intercepted so no backend is required.
 *
 * Architecture under test:
 *   ProviderEmbeddedComponent
 *     -> AuthSourceWizardComponent (modal overlay with 5 steps)
 *     -> ApiGatewayService.createTenantIdentityProvider()
 *
 * Key files:
 *   - frontend/src/app/features/admin/identity-providers/
 *     auth-source-wizard/auth-source-wizard.component.ts
 *   - frontend/src/app/features/admin/identity-providers/
 *     provider-embedded.component.ts (wires wizard open)
 */

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const MOCK_PROVIDERS = [
  {
    id: 'prov-1',
    providerName: 'KEYCLOAK',
    providerType: 'KEYCLOAK',
    displayName: 'Keycloak SSO',
    protocol: 'OIDC',
    enabled: true,
    status: 'active',
    clientId: 'emsist-client',
    discoveryUrl: 'https://kc.example.com/realms/master/.well-known/openid-configuration',
  },
];

const MOCK_ACCESS_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJzdWIiOiJ1c2VyLTEiLCJpYXQiOjE3MDAwMDAwMDB9.' +
  'mock-signature';
const MOCK_REFRESH_TOKEN = 'mock-refresh-token-value';
const ACCESS_TOKEN_KEY = 'tp_access_token';
const REFRESH_TOKEN_KEY = 'tp_refresh_token';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function interceptAllApi(page: import('@playwright/test').Page): Promise<void> {
  await page.route('**/api/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({}),
    }),
  );
}

async function seedAuthenticatedSession(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/auth/login');
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(
    ({ accessKey, refreshKey, accessToken, refreshToken }) => {
      sessionStorage.setItem(accessKey, accessToken);
      sessionStorage.setItem(refreshKey, refreshToken);
    },
    {
      accessKey: ACCESS_TOKEN_KEY,
      refreshKey: REFRESH_TOKEN_KEY,
      accessToken: MOCK_ACCESS_TOKEN,
      refreshToken: MOCK_REFRESH_TOKEN,
    },
  );
}

async function navigateToAuthSection(page: import('@playwright/test').Page): Promise<void> {
  await interceptAllApi(page);

  // Tenant resolve mock
  await page.route('**/api/tenants/resolve**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'master', name: 'Master Tenant', status: 'active' }),
    }),
  );

  // Tenant list mock - must include a MASTER type tenant
  await page.route('**/api/tenants**', (route) => {
    const url = route.request().url();
    // Skip resolve and branding endpoints
    if (url.includes('/resolve') || url.includes('/branding')) {
      return route.continue();
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        tenants: [
          {
            id: 'master',
            uuid: 'master-uuid',
            shortName: 'master',
            fullName: 'Master Tenant',
            name: 'Master Tenant',
            description: 'Platform master tenant',
            tenantType: 'MASTER',
            tier: 'ENTERPRISE',
            status: 'active',
            isProtected: true,
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
      }),
    });
  });

  // Provider list mock
  await page.route('**/api/v1/admin/tenants/*/providers**', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ providers: MOCK_PROVIDERS }),
      });
    }
    if (route.request().method() === 'POST') {
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'prov-new',
          providerName: 'CORPORATE_AD',
          displayName: 'Corporate AD',
          protocol: 'LDAP',
          enabled: true,
          status: 'active',
        }),
      });
    }
    return route.continue();
  });

  // Tenant users mock
  await page.route('**/api/v1/admin/tenants/*/users**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ content: [], page: 0, size: 100, totalElements: 0, totalPages: 0 }),
    }),
  );

  await seedAuthenticatedSession(page);
  await page.goto('/administration?section=tenant-manager');
  await page.waitForLoadState('domcontentloaded');
}

async function openWizard(page: import('@playwright/test').Page): Promise<void> {
  // 1. Wait for tenant list to load and click the Master Tenant
  const tenantBtn = page.locator('button.tenant-item').first();
  await expect(tenantBtn).toBeVisible({ timeout: 15_000 });
  await tenantBtn.click();

  // 2. Click the "Authentication" tab (only visible for MASTER type tenants)
  const authTab = page.getByRole('tab', { name: 'Authentication' });
  await expect(authTab).toBeVisible({ timeout: 5_000 });
  await authTab.click();

  // 3. Wait for providers embedded component and click "Add Source"
  const addBtn = page.locator('[data-testid="btn-add-source"]');
  await expect(addBtn.first()).toBeVisible({ timeout: 10_000 });
  await addBtn.first().click();

  // 4. Wait for wizard modal to appear
  await expect(page.locator('[data-testid="auth-source-wizard-modal"]')).toBeVisible({
    timeout: 5_000,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('US-AC-02: Add Authentication Source Wizard', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToAuthSection(page);
  });

  // ── AC-1: Wizard Modal opens with 5-step progress indicator ────────
  test('AC-1: wizard opens as modal with 5-step progress indicator', async ({ page }) => {
    await openWizard(page);

    const modal = page.locator('[data-testid="auth-source-wizard-modal"]');
    await expect(modal).toBeVisible();

    // Verify title
    await expect(page.locator('[data-testid="wizard-title"]')).toHaveText(
      'Add Authentication Source',
    );

    // Verify 5 step indicators
    const stepper = page.locator('[data-testid="wizard-stepper"]');
    await expect(stepper).toBeVisible();

    await expect(page.locator('[data-testid="wizard-step-protocol"]')).toBeVisible();
    await expect(page.locator('[data-testid="wizard-step-connection"]')).toBeVisible();
    await expect(page.locator('[data-testid="wizard-step-mapping"]')).toBeVisible();
    await expect(page.locator('[data-testid="wizard-step-sync"]')).toBeVisible();
    await expect(page.locator('[data-testid="wizard-step-review"]')).toBeVisible();

    // Step 1 should be active
    await expect(page.locator('[data-testid="wizard-step-protocol"]')).toHaveClass(/active/);
  });

  // ── AC-2: Step 1 - Protocol Selection ──────────────────────────────
  test('AC-2: Step 1 shows display name input and 5 protocol cards', async ({ page }) => {
    await openWizard(page);

    // Display name input
    await expect(page.locator('[data-testid="input-display-name"]')).toBeVisible();

    // Info banner
    await expect(page.locator('[data-testid="protocol-info-banner"]')).toBeVisible();
    await expect(page.locator('[data-testid="protocol-info-banner"]')).toContainText(
      'Multiple authentication sources',
    );

    // 5 protocol cards
    await expect(page.locator('[data-testid="protocol-card-LDAP"]')).toBeVisible();
    await expect(page.locator('[data-testid="protocol-card-SAML"]')).toBeVisible();
    await expect(page.locator('[data-testid="protocol-card-SCIM"]')).toBeVisible();
    await expect(page.locator('[data-testid="protocol-card-OAUTH2"]')).toBeVisible();
    await expect(page.locator('[data-testid="protocol-card-OIDC"]')).toBeVisible();

    // Each card has label and description
    await expect(page.locator('[data-testid="protocol-card-LDAP"]')).toContainText(
      'LDAP / Active Directory',
    );
    await expect(page.locator('[data-testid="protocol-card-SAML"]')).toContainText('SAML 2.0');
    await expect(page.locator('[data-testid="protocol-card-SCIM"]')).toContainText('SCIM 2.0');
    await expect(page.locator('[data-testid="protocol-card-OAUTH2"]')).toContainText('OAuth 2.0');
    await expect(page.locator('[data-testid="protocol-card-OIDC"]')).toContainText(
      'OpenID Connect',
    );
  });

  // ── AC-2b: Next button disabled until name + protocol selected ─────
  test('AC-2b: Next is disabled until display name and protocol are set', async ({ page }) => {
    await openWizard(page);

    const nextBtn = page.locator('[data-testid="btn-wizard-next"]');
    await expect(nextBtn).toBeDisabled();

    // Fill name only
    await page.locator('[data-testid="input-display-name"]').fill('Corporate AD');
    await expect(nextBtn).toBeDisabled();

    // Select protocol
    await page.locator('[data-testid="protocol-card-LDAP"]').click();
    await expect(page.locator('[data-testid="protocol-card-LDAP"]')).toHaveClass(/selected/);

    // Now next should be enabled
    await expect(nextBtn).toBeEnabled();
  });

  // ── AC-3: Step 2 - LDAP Connection ────────────────────────────────
  test('AC-3: LDAP connection step collects required fields', async ({ page }) => {
    await openWizard(page);

    // Complete Step 1
    await page.locator('[data-testid="input-display-name"]').fill('Corporate AD');
    await page.locator('[data-testid="protocol-card-LDAP"]').click();
    await page.locator('[data-testid="btn-wizard-next"]').click();

    // Verify we're on Step 2
    await expect(page.locator('[data-testid="step-connection"]')).toBeVisible();
    await expect(page.locator('[data-testid="ldap-connection-form"]')).toBeVisible();

    // Verify key LDAP fields exist
    await expect(page.locator('[data-testid="input-ldap-server-urls"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-ldap-base-dn"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-ldap-bind-dn"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-ldap-bind-password"]')).toBeVisible();
    await expect(page.locator('[data-testid="select-ldap-tls-mode"]')).toBeVisible();
    await expect(page.locator('[data-testid="check-ldap-ssl-verify"]')).toBeVisible();

    // Next should be disabled without required fields
    const nextBtn = page.locator('[data-testid="btn-wizard-next"]');
    await expect(nextBtn).toBeDisabled();

    // Fill required fields
    await page.locator('[data-testid="input-ldap-server-urls"]').fill('ldap://dc01.corp.local:389');
    await page.locator('[data-testid="input-ldap-base-dn"]').fill('dc=corp,dc=local');
    await page.locator('[data-testid="input-ldap-bind-dn"]').fill('cn=admin,dc=corp,dc=local');

    // Now next should be enabled
    await expect(nextBtn).toBeEnabled();
  });

  // ── AC-3b: Password visibility toggle ──────────────────────────────
  test('AC-3b: LDAP bind password has visibility toggle', async ({ page }) => {
    await openWizard(page);
    await page.locator('[data-testid="input-display-name"]').fill('Corporate AD');
    await page.locator('[data-testid="protocol-card-LDAP"]').click();
    await page.locator('[data-testid="btn-wizard-next"]').click();

    const pwInput = page.locator('[data-testid="input-ldap-bind-password"]');
    await expect(pwInput).toHaveAttribute('type', 'password');

    // Click toggle
    await page.locator('[data-testid="toggle-ldap-bind-password"]').click();
    await expect(pwInput).toHaveAttribute('type', 'text');

    // Click again
    await page.locator('[data-testid="toggle-ldap-bind-password"]').click();
    await expect(pwInput).toHaveAttribute('type', 'password');
  });

  // ── AC-4: Step 2 - SAML Connection ────────────────────────────────
  test('AC-4: SAML connection step shows metadata URL and upload modes', async ({ page }) => {
    await openWizard(page);
    await page.locator('[data-testid="input-display-name"]').fill('ADFS SSO');
    await page.locator('[data-testid="protocol-card-SAML"]').click();
    await page.locator('[data-testid="btn-wizard-next"]').click();

    await expect(page.locator('[data-testid="saml-connection-form"]')).toBeVisible();
    await expect(page.locator('[data-testid="select-saml-metadata-source"]')).toBeVisible();

    // URL mode by default
    await expect(page.locator('[data-testid="input-saml-metadata-url"]')).toBeVisible();

    // Switch to upload mode
    await page.locator('[data-testid="select-saml-metadata-source"]').selectOption('upload');
    await expect(page.locator('[data-testid="input-saml-metadata-xml"]')).toBeVisible();
  });

  // ── AC-5: Step 2 - SCIM Connection ────────────────────────────────
  test('AC-5: SCIM connection step shows endpoint and auth method', async ({ page }) => {
    await openWizard(page);
    await page.locator('[data-testid="input-display-name"]').fill('Azure SCIM');
    await page.locator('[data-testid="protocol-card-SCIM"]').click();
    await page.locator('[data-testid="btn-wizard-next"]').click();

    await expect(page.locator('[data-testid="scim-connection-form"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-scim-endpoint"]')).toBeVisible();
    await expect(page.locator('[data-testid="select-scim-auth-method"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-scim-bearer-token"]')).toBeVisible();
    await expect(page.locator('[data-testid="check-scim-realtime"]')).toBeVisible();
  });

  // ── AC-6: Step 2 - OIDC Connection ────────────────────────────────
  test('AC-6: OIDC connection step shows discovery URL and client fields', async ({ page }) => {
    await openWizard(page);
    await page.locator('[data-testid="input-display-name"]').fill('Keycloak OIDC');
    await page.locator('[data-testid="protocol-card-OIDC"]').click();
    await page.locator('[data-testid="btn-wizard-next"]').click();

    await expect(page.locator('[data-testid="oidc-connection-form"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-oidc-discovery-url"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-oidc-client-id"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-oidc-client-secret"]')).toBeVisible();
    await expect(page.locator('[data-testid="check-oidc-pkce"]')).toBeVisible();
  });

  // ── AC-7: Step 3 - Attribute Mapping ──────────────────────────────
  test('AC-7: Mapping step shows attribute and group-role mapping tables', async ({ page }) => {
    await openWizard(page);

    // Complete steps 1-2 with OIDC (minimal required fields)
    await page.locator('[data-testid="input-display-name"]').fill('Test OIDC');
    await page.locator('[data-testid="protocol-card-OIDC"]').click();
    await page.locator('[data-testid="btn-wizard-next"]').click();
    await page.locator('[data-testid="input-oidc-discovery-url"]').fill('https://kc.example.com/.well-known/openid-configuration');
    await page.locator('[data-testid="input-oidc-client-id"]').fill('my-client');
    await page.locator('[data-testid="btn-wizard-next"]').click();

    // Step 3
    await expect(page.locator('[data-testid="step-mapping"]')).toBeVisible();
    await expect(page.locator('[data-testid="attribute-mapping-table"]')).toBeVisible();

    // Default mappings should exist (email, firstName, lastName)
    await expect(page.locator('[data-testid="attr-mapping-row-0"]')).toBeVisible();
    await expect(page.locator('[data-testid="attr-mapping-row-1"]')).toBeVisible();
    await expect(page.locator('[data-testid="attr-mapping-row-2"]')).toBeVisible();

    // Add attribute mapping button
    await expect(page.locator('[data-testid="btn-add-attr-mapping"]')).toBeVisible();

    // Group-role mapping section
    await expect(page.locator('[data-testid="group-role-mapping-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-add-group-mapping"]')).toBeVisible();
  });

  // ── AC-7b: Can add and remove attribute mappings ───────────────────
  test('AC-7b: Can add and remove attribute mappings', async ({ page }) => {
    await openWizard(page);
    await page.locator('[data-testid="input-display-name"]').fill('Test OIDC');
    await page.locator('[data-testid="protocol-card-OIDC"]').click();
    await page.locator('[data-testid="btn-wizard-next"]').click();
    await page.locator('[data-testid="input-oidc-discovery-url"]').fill('https://kc.example.com/.well-known/openid-configuration');
    await page.locator('[data-testid="input-oidc-client-id"]').fill('my-client');
    await page.locator('[data-testid="btn-wizard-next"]').click();

    // Add a new mapping
    await page.locator('[data-testid="btn-add-attr-mapping"]').click();
    await expect(page.locator('[data-testid="attr-mapping-row-3"]')).toBeVisible();

    // Remove first mapping
    await page.locator('[data-testid="btn-remove-attr-0"]').click();
    // Row 3 should no longer exist (shifted to 2)
    await expect(page.locator('[data-testid="attr-mapping-row-3"]')).not.toBeVisible();
  });

  // ── AC-8: Step 4 - Sync & Tenants ─────────────────────────────────
  test('AC-8: Sync step shows schedule controls and tenant assignment info', async ({ page }) => {
    await openWizard(page);
    await page.locator('[data-testid="input-display-name"]').fill('Test OIDC');
    await page.locator('[data-testid="protocol-card-OIDC"]').click();
    await page.locator('[data-testid="btn-wizard-next"]').click();
    await page.locator('[data-testid="input-oidc-discovery-url"]').fill('https://kc.example.com/.well-known/openid-configuration');
    await page.locator('[data-testid="input-oidc-client-id"]').fill('my-client');
    await page.locator('[data-testid="btn-wizard-next"]').click();
    await page.locator('[data-testid="btn-wizard-next"]').click();

    // Step 4
    await expect(page.locator('[data-testid="step-sync"]')).toBeVisible();
    await expect(page.locator('[data-testid="check-sync-enabled"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-sync-interval"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-sync-cron"]')).toBeVisible();
    await expect(page.locator('[data-testid="select-conflict-resolution"]')).toBeVisible();
    await expect(page.locator('[data-testid="tenant-assignment-info"]')).toBeVisible();
  });

  // ── AC-9: Step 5 - Test & Review ──────────────────────────────────
  test('AC-9: Review step shows 4 test checks and config summary', async ({ page }) => {
    await openWizard(page);
    await page.locator('[data-testid="input-display-name"]').fill('Test OIDC');
    await page.locator('[data-testid="protocol-card-OIDC"]').click();
    await page.locator('[data-testid="btn-wizard-next"]').click();
    await page.locator('[data-testid="input-oidc-discovery-url"]').fill('https://kc.example.com/.well-known/openid-configuration');
    await page.locator('[data-testid="input-oidc-client-id"]').fill('my-client');
    await page.locator('[data-testid="btn-wizard-next"]').click();
    await page.locator('[data-testid="btn-wizard-next"]').click();
    await page.locator('[data-testid="btn-wizard-next"]').click();

    // Step 5
    await expect(page.locator('[data-testid="step-review"]')).toBeVisible();

    // 4 test checks
    await expect(page.locator('[data-testid="test-check-0"]')).toBeVisible();
    await expect(page.locator('[data-testid="test-check-1"]')).toBeVisible();
    await expect(page.locator('[data-testid="test-check-2"]')).toBeVisible();
    await expect(page.locator('[data-testid="test-check-3"]')).toBeVisible();

    // Run tests button
    await expect(page.locator('[data-testid="btn-run-tests"]')).toBeVisible();

    // Config summary
    await expect(page.locator('[data-testid="config-summary"]')).toBeVisible();

    // Create Source button (final submit)
    await expect(page.locator('[data-testid="btn-wizard-submit"]')).toBeVisible();
  });

  // ── AC-10: Run connection tests ────────────────────────────────────
  test('AC-10: Connection tests run with status indicators', async ({ page }) => {
    await openWizard(page);
    await page.locator('[data-testid="input-display-name"]').fill('Test OIDC');
    await page.locator('[data-testid="protocol-card-OIDC"]').click();
    await page.locator('[data-testid="btn-wizard-next"]').click();
    await page.locator('[data-testid="input-oidc-discovery-url"]').fill('https://kc.example.com/.well-known/openid-configuration');
    await page.locator('[data-testid="input-oidc-client-id"]').fill('my-client');
    await page.locator('[data-testid="btn-wizard-next"]').click();
    await page.locator('[data-testid="btn-wizard-next"]').click();
    await page.locator('[data-testid="btn-wizard-next"]').click();

    // Run tests
    await page.locator('[data-testid="btn-run-tests"]').click();

    // Wait for all 4 tests to complete (simulated with 800ms intervals)
    await expect(page.locator('[data-testid="test-check-3"]')).toHaveClass(/test-success/, {
      timeout: 10_000,
    });

    // All should show success
    for (let i = 0; i < 4; i++) {
      await expect(page.locator(`[data-testid="test-check-${i}"]`)).toHaveClass(/test-success/);
    }
  });

  // ── AC-11: Full wizard flow - OIDC happy path ─────────────────────
  test('AC-11: Complete wizard flow creates OIDC provider', async ({ page }) => {
    let createCalled = false;
    // Intercept provider creation
    await page.route('**/api/v1/admin/tenants/*/providers', (route) => {
      if (route.request().method() === 'POST') {
        createCalled = true;
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'prov-new',
            providerName: 'CORPORATE_OIDC',
            displayName: 'Corporate OIDC',
            protocol: 'OIDC',
            enabled: true,
            status: 'active',
          }),
        });
      }
      return route.continue();
    });

    await openWizard(page);

    // Step 1
    await page.locator('[data-testid="input-display-name"]').fill('Corporate OIDC');
    await page.locator('[data-testid="protocol-card-OIDC"]').click();
    await page.locator('[data-testid="btn-wizard-next"]').click();

    // Step 2
    await page.locator('[data-testid="input-oidc-discovery-url"]').fill('https://kc.example.com/.well-known/openid-configuration');
    await page.locator('[data-testid="input-oidc-client-id"]').fill('my-client-id');
    await page.locator('[data-testid="input-oidc-client-secret"]').fill('secret123');
    await page.locator('[data-testid="btn-wizard-next"]').click();

    // Step 3 - accept defaults
    await page.locator('[data-testid="btn-wizard-next"]').click();

    // Step 4 - accept defaults
    await page.locator('[data-testid="btn-wizard-next"]').click();

    // Step 5 - submit
    await page.locator('[data-testid="btn-wizard-submit"]').click();

    // Wizard should close
    await expect(page.locator('[data-testid="auth-source-wizard-modal"]')).not.toBeVisible({
      timeout: 5_000,
    });
  });

  // ── AC-12: Back navigation works ──────────────────────────────────
  test('AC-12: Back button navigates to previous step', async ({ page }) => {
    await openWizard(page);

    // Go to Step 2
    await page.locator('[data-testid="input-display-name"]').fill('Test');
    await page.locator('[data-testid="protocol-card-OIDC"]').click();
    await page.locator('[data-testid="btn-wizard-next"]').click();
    await expect(page.locator('[data-testid="step-connection"]')).toBeVisible();

    // Go back
    await page.locator('[data-testid="btn-wizard-back"]').click();
    await expect(page.locator('[data-testid="step-protocol"]')).toBeVisible();

    // Verify state preserved
    const nameInput = page.locator('[data-testid="input-display-name"]');
    await expect(nameInput).toHaveValue('Test');
    await expect(page.locator('[data-testid="protocol-card-OIDC"]')).toHaveClass(/selected/);
  });

  // ── AC-13: Cancel confirmation with dirty state ────────────────────
  test('AC-13: Cancel shows confirmation when form has data', async ({ page }) => {
    await openWizard(page);

    // Fill in some data
    await page.locator('[data-testid="input-display-name"]').fill('Test');
    await page.locator('[data-testid="protocol-card-LDAP"]').click();

    // Click cancel
    await page.locator('[data-testid="btn-wizard-cancel"]').click();

    // Confirm dialog should appear
    await expect(page.locator('[data-testid="cancel-confirm-dialog"]')).toBeVisible();
    await expect(page.locator('[data-testid="cancel-confirm-dialog"]')).toContainText(
      'Discard changes',
    );

    // Click "Continue Editing" to dismiss
    await page.locator('[data-testid="btn-cancel-dismiss"]').click();
    await expect(page.locator('[data-testid="cancel-confirm-dialog"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="auth-source-wizard-modal"]')).toBeVisible();
  });

  // ── AC-14: Cancel confirmation - discard closes wizard ─────────────
  test('AC-14: Discard & Close closes the wizard', async ({ page }) => {
    await openWizard(page);
    await page.locator('[data-testid="input-display-name"]').fill('Test');
    await page.locator('[data-testid="protocol-card-LDAP"]').click();

    await page.locator('[data-testid="btn-wizard-cancel"]').click();
    await page.locator('[data-testid="btn-cancel-confirm"]').click();

    await expect(page.locator('[data-testid="auth-source-wizard-modal"]')).not.toBeVisible({
      timeout: 3_000,
    });
  });

  // ── AC-15: Cancel without dirty state closes immediately ───────────
  test('AC-15: Cancel without changes closes immediately (no confirmation)', async ({ page }) => {
    await openWizard(page);

    // Don't fill anything - just cancel
    await page.locator('[data-testid="btn-wizard-cancel"]').click();

    // Should close immediately without confirm dialog
    await expect(page.locator('[data-testid="auth-source-wizard-modal"]')).not.toBeVisible({
      timeout: 3_000,
    });
  });

  // ── AC-16: Close button (X) triggers cancel flow ───────────────────
  test('AC-16: Close button (X) triggers cancel flow', async ({ page }) => {
    await openWizard(page);
    await page.locator('[data-testid="input-display-name"]').fill('Test');

    await page.locator('[data-testid="wizard-close-btn"]').click();
    await expect(page.locator('[data-testid="cancel-confirm-dialog"]')).toBeVisible();
  });

  // ── AC-17: Step indicator allows clicking completed steps ──────────
  test('AC-17: Clicking a completed step navigates back to it', async ({ page }) => {
    await openWizard(page);

    // Complete Step 1
    await page.locator('[data-testid="input-display-name"]').fill('Test');
    await page.locator('[data-testid="protocol-card-OIDC"]').click();
    await page.locator('[data-testid="btn-wizard-next"]').click();

    // Click Step 1 in stepper
    await page.locator('[data-testid="wizard-step-protocol"]').click();
    await expect(page.locator('[data-testid="step-protocol"]')).toBeVisible();
  });

  // ── AC-18: OAuth 2.0 connection fields ─────────────────────────────
  test('AC-18: OAuth 2.0 connection shows authorization and token URLs', async ({ page }) => {
    await openWizard(page);
    await page.locator('[data-testid="input-display-name"]').fill('Custom OAuth');
    await page.locator('[data-testid="protocol-card-OAUTH2"]').click();
    await page.locator('[data-testid="btn-wizard-next"]').click();

    await expect(page.locator('[data-testid="oauth-connection-form"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-oauth-auth-url"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-oauth-token-url"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-oauth-client-id"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-oauth-client-secret"]')).toBeVisible();
    await expect(page.locator('[data-testid="check-oauth-pkce"]')).toBeVisible();
  });
});
