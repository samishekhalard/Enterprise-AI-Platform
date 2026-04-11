import { expect, test, type Page } from '@playwright/test';

const MOCK_ACCESS_TOKEN =
  'eyJhbGciOiJub25lIn0.' +
  'eyJzdWIiOiJ1c2VyLTEiLCJyb2xlcyI6WyJTVVBFUl9BRE1JTiJdLCJleHAiOjQxMDI0NDQ4MDB9.';

const DESKTOP_VIEWPORT = { width: 1280, height: 900 };
const MOBILE_VIEWPORT = { width: 390, height: 844 };

const TENANT_LIST_RESPONSE = {
  tenants: [
    {
      id: 'master',
      uuid: 'master-uuid',
      shortName: 'MASTER',
      fullName: 'Master Tenant',
      status: 'ACTIVE',
      tenantType: 'MASTER',
      tier: 'ENTERPRISE',
      isProtected: true,
      usersCount: 12,
      domainsCount: 2,
      primaryDomain: 'master.local',
      createdAt: '2025-01-01T00:00:00Z',
    },
    {
      id: 'tenant-a',
      uuid: 'uuid-a',
      shortName: 'TENA',
      fullName: 'Tenant Alpha',
      status: 'ACTIVE',
      tenantType: 'REGULAR',
      tier: 'STANDARD',
      isProtected: false,
      usersCount: 5,
      domainsCount: 1,
      primaryDomain: 'alpha.local',
      createdAt: '2025-06-15T00:00:00Z',
    },
    {
      id: 'tenant-b',
      uuid: 'uuid-b',
      shortName: 'TENB',
      fullName: 'Tenant Beta',
      status: 'PENDING',
      tenantType: 'REGULAR',
      tier: 'FREE',
      isProtected: false,
      usersCount: 0,
      domainsCount: 1,
      primaryDomain: 'beta.local',
      createdAt: '2026-02-01T00:00:00Z',
    },
  ],
  total: 3,
  page: 1,
  limit: 20,
};

const BRANDING_RESPONSE = {
  primaryColor: '#428177',
  primaryColorDark: '#054239',
  secondaryColor: '#988561',
  surfaceColor: '#F2EFE9',
  textColor: '#3d3a3b',
  shadowDarkColor: '#988561',
  shadowLightColor: '#F5E6D0',
  logoUrl: '',
  logoUrlDark: '',
  faviconUrl: '',
  loginBackgroundUrl: '',
  customCss: '',
  cornerRadius: 16,
  buttonDepth: 12,
  shadowIntensity: 50,
  softShadows: true,
  compactNav: false,
  hoverButton: 'lift',
  hoverCard: 'lift',
  hoverInput: 'press',
  hoverNav: 'slide',
  hoverTableRow: 'highlight',
  componentTokens: {},
  updatedAt: '2026-03-04T00:00:00Z',
};

const PROVIDERS_RESPONSE = {
  providers: [
    {
      id: 'provider-oidc',
      providerName: 'CORP_OIDC',
      providerType: 'OIDC',
      displayName: 'Corporate SSO',
      protocol: 'OIDC',
      enabled: true,
      status: 'active',
      clientId: 'corp-portal',
      discoveryUrl: 'https://login.example.com/.well-known/openid-configuration',
      issuerUrl: 'https://login.example.com',
      scopes: ['openid', 'profile', 'email'],
      priority: 10,
      lastTestedAt: '2026-03-20T10:00:00Z',
      testResult: 'success',
    },
  ],
};

const USER_LIST_RESPONSE = {
  content: [
    {
      id: 'user-001',
      email: 'alice@example.com',
      firstName: 'Alice',
      lastName: 'Smith',
      displayName: 'Alice Smith',
      active: true,
      emailVerified: true,
      roles: ['ROLE_ADMIN'],
      groups: [],
      identityProvider: 'keycloak',
      lastLoginAt: '2026-03-01T10:00:00Z',
      createdAt: '2026-01-15T08:00:00Z',
    },
  ],
  page: 0,
  size: 20,
  totalElements: 1,
  totalPages: 1,
};

const USER_SESSIONS_RESPONSE = [
  {
    id: 'sess-001',
    deviceName: 'Chrome on macOS',
    ipAddress: '192.168.1.10',
    location: null,
    createdAt: '2026-03-04T08:00:00Z',
    lastActivity: '2026-03-04T09:30:00Z',
    expiresAt: '2026-03-04T20:00:00Z',
    isRemembered: false,
    mfaVerified: true,
    status: 'ACTIVE',
    isCurrent: true,
  },
];

const LICENSE_STATUS_RESPONSE = {
  state: 'ACTIVE',
  licenseId: 'LIC-2026-001',
  product: 'Emsist Platform',
  versionRange: '2026.x',
  expiresAt: '2026-12-31T23:59:00Z',
  gracePeriodDays: 15,
  features: ['Users', 'Branding', 'SSO', 'Audit'],
  degradedFeatures: [],
  maxTenants: 50,
  activeTenantCount: 3,
  issuer: 'ThinkPLUS',
  customerName: 'Emsist Demo',
  importedAt: '2026-03-01T09:00:00Z',
};

const CURRENT_LICENSE_RESPONSE = {
  licenseFileId: 'lic-file-1',
  licenseId: 'LIC-2026-001',
  product: 'Emsist Platform',
  versionRange: '2026.x',
  maxTenants: 50,
  expiresAt: '2026-12-31T23:59:00Z',
  features: ['Users', 'Branding', 'SSO', 'Audit'],
  gracePeriodDays: 15,
  tenantCount: 3,
  importedAt: '2026-03-01T09:00:00Z',
};

const OBJECT_TYPES_RESPONSE = {
  content: [
    {
      id: 'ot-1',
      tenantId: 'tenant-a',
      name: 'Server',
      typeKey: 'server',
      code: 'OBJ_001',
      description: 'A physical server',
      iconName: 'phosphorDesktopThin',
      iconColor: '#428177',
      status: 'active',
      state: 'user_defined',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-02T00:00:00Z',
      attributes: [],
      connections: [],
      instanceCount: 3,
    },
    {
      id: 'ot-2',
      tenantId: 'tenant-a',
      name: 'Application',
      typeKey: 'application',
      code: 'OBJ_002',
      description: 'A software application',
      iconName: 'phosphorCubeThin',
      iconColor: '#988561',
      status: 'planned',
      state: 'default',
      createdAt: '2026-01-03T00:00:00Z',
      updatedAt: '2026-01-04T00:00:00Z',
      attributes: [],
      connections: [],
      instanceCount: 0,
    },
  ],
  totalElements: 2,
  page: 0,
  size: 25,
  totalPages: 1,
};

const OBJECT_TYPE_DETAIL_RESPONSE = {
  ...OBJECT_TYPES_RESPONSE.content[0],
  attributes: [
    {
      relId: 1,
      attributeTypeId: 'attr-hostname',
      name: 'Hostname',
      attributeKey: 'hostname',
      dataType: 'string',
      isRequired: true,
      displayOrder: 1,
    },
  ],
  connections: [
    {
      relId: 1,
      targetObjectTypeId: 'ot-2',
      targetObjectTypeName: 'Application',
      relationshipKey: 'hosts',
      activeName: 'Hosts',
      passiveName: 'Hosted on',
      cardinality: 'one-to-many',
      isDirected: true,
    },
  ],
};

const ATTRIBUTE_TYPES_RESPONSE = [
  {
    id: 'attr-hostname',
    tenantId: 'tenant-a',
    name: 'Hostname',
    attributeKey: 'hostname',
    dataType: 'string',
    attributeGroup: 'identity',
    description: 'Primary host name',
  },
  {
    id: 'attr-owner',
    tenantId: 'tenant-a',
    name: 'Owner',
    attributeKey: 'owner',
    dataType: 'string',
    attributeGroup: 'responsibility',
    description: 'Business owner',
  },
];

type RuntimeErrorTracker = {
  readonly consoleErrors: string[];
  readonly pageErrors: string[];
};

async function seedAuth(page: Page): Promise<void> {
  await page.addInitScript((accessToken) => {
    window.localStorage.setItem('tp_access_token', accessToken);
    window.localStorage.setItem('tp_refresh_token', accessToken);
  }, MOCK_ACCESS_TOKEN);
}

function createRuntimeErrorTracker(page: Page): RuntimeErrorTracker {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });

  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });

  return { consoleErrors, pageErrors };
}

async function expectNoHorizontalOverflow(page: Page, context: string): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    scrollWidth: Math.max(
      document.body.scrollWidth,
      document.documentElement.scrollWidth,
      document.scrollingElement?.scrollWidth ?? 0,
    ),
    clientWidth: document.documentElement.clientWidth,
  }));

  expect(
    dimensions.scrollWidth,
    `${context} has horizontal overflow (${dimensions.scrollWidth}px > ${dimensions.clientWidth}px)`,
  ).toBeLessThanOrEqual(dimensions.clientWidth + 1);
}

function expectNoRuntimeErrors(tracker: RuntimeErrorTracker, context: string): void {
  expect(
    {
      consoleErrors: tracker.consoleErrors,
      pageErrors: tracker.pageErrors,
    },
    `${context} emitted runtime errors`,
  ).toEqual({
    consoleErrors: [],
    pageErrors: [],
  });
}

async function mockRuntimeAuditApis(page: Page): Promise<void> {
  await page.route('**/api/**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
  });

  await page.route('**/api/v1/auth/messages**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });

  await page.route('**/api/tenants/resolve**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        resolved: true,
        tenant: {
          id: 'master',
          uuid: 'master-uuid',
          shortName: 'MASTER',
          fullName: 'Master Tenant',
        },
      }),
    });
  });

  await page.route(/\/api\/tenants\/stats(?:\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        totalTenants: 3,
        activeTenants: 2,
        pendingTenants: 1,
        suspendedTenants: 0,
        totalUsers: 17,
        avgUtilizationPercent: 65,
      }),
    });
  });

  await page.route(/\/api\/tenants(?:\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(TENANT_LIST_RESPONSE),
    });
  });

  await page.route(/\/api\/tenants\/[^/]+\/branding(?:\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(BRANDING_RESPONSE),
    });
  });

  await page.route(/\/api\/v1\/admin\/licenses\/status(?:\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(LICENSE_STATUS_RESPONSE),
    });
  });

  await page.route(/\/api\/v1\/admin\/licenses\/current(?:\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(CURRENT_LICENSE_RESPONSE),
    });
  });

  await page.route(/\/api\/v1\/admin\/tenants\/[^/]+\/users(?:\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(USER_LIST_RESPONSE),
    });
  });

  await page.route(/\/api\/v1\/users\/[^/]+\/sessions(?:\?.*)?$/, async (route) => {
    if (route.request().method() === 'DELETE') {
      await route.fulfill({ status: 204, body: '' });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(USER_SESSIONS_RESPONSE),
    });
  });

  await page.route(/\/api\/v1\/admin\/tenants\/[^/]+\/providers(?:\?.*)?$/, async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(PROVIDERS_RESPONSE.providers[0]),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(PROVIDERS_RESPONSE),
    });
  });

  await page.route(
    /\/api\/v1\/admin\/tenants\/[^/]+\/providers\/[^/]+(?:\/test)?(?:\?.*)?$/,
    async (route) => {
      if (route.request().url().includes('/test')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, message: 'Connection healthy.' }),
        });
        return;
      }

      if (route.request().method() === 'DELETE') {
        await route.fulfill({ status: 204, body: '' });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(PROVIDERS_RESPONSE.providers[0]),
      });
    },
  );

  await page.route(/\/api\/v1\/definitions\/object-types(?:\?.*)?$/, async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(OBJECT_TYPES_RESPONSE.content[0]),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(OBJECT_TYPES_RESPONSE),
    });
  });

  await page.route(
    /\/api\/v1\/definitions\/object-types\/[^/]+(?:\/duplicate|\/restore|\/attributes(?:\/[^/]+)?|\/connections(?:\/[^/]+)?)?(?:\?.*)?$/,
    async (route) => {
      const method = route.request().method();
      if (method === 'DELETE') {
        await route.fulfill({ status: 204, body: '' });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(OBJECT_TYPE_DETAIL_RESPONSE),
      });
    },
  );

  await page.route(/\/api\/v1\/definitions\/attribute-types(?:\?.*)?$/, async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(ATTRIBUTE_TYPES_RESPONSE[0]),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(ATTRIBUTE_TYPES_RESPONSE),
    });
  });

  await page.route(/\/api\/v1\/tenants\/[^/]+\/seats\/availability(?:\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        TENANT_ADMIN: { maxSeats: 5, assigned: 1, available: 4, unlimited: false },
        POWER_USER: { maxSeats: 10, assigned: 3, available: 7, unlimited: false },
        CONTRIBUTOR: { maxSeats: 25, assigned: 8, available: 17, unlimited: false },
        VIEWER: { maxSeats: 50, assigned: 12, available: 38, unlimited: false },
      }),
    });
  });

  await page.route(/\/api\/v1\/tenants\/[^/]+\/seats(?:\/[^/]+)?(?:\?.*)?$/, async (route) => {
    if (route.request().method() === 'DELETE') {
      await route.fulfill({ status: 204, body: '' });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          assignmentId: 'assign-1',
          userId: 'user-001',
          tenantId: 'master-uuid',
          tier: 'TENANT_ADMIN',
          assignedAt: '2026-03-04T10:00:00Z',
          assignedBy: 'system',
        },
      ]),
    });
  });
}

async function gotoTenantFactsheet(page: Page): Promise<void> {
  await page.goto('/administration?section=tenant-manager');
  await expect(page.getByTestId('tenant-table')).toBeVisible();
  await page.getByTestId('tenant-link-master').click();
  await expect(page.getByTestId('factsheet-name')).toBeVisible();
}

test.describe('Design System Runtime Audit', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await mockRuntimeAuditApis(page);
  });

  test('public routes render governed shells on desktop and mobile', async ({ page }) => {
    const tracker = createRuntimeErrorTracker(page);
    await page.addInitScript(() => {
      window.localStorage.removeItem('tp_access_token');
      window.localStorage.removeItem('tp_refresh_token');
    });
    const publicRoutes = [
      {
        path: '/auth/login',
        locator: page.locator('.login-content'),
      },
      {
        path: '/auth/password-reset',
        locator: page.getByRole('heading', { name: 'Reset Password' }),
      },
      {
        path: '/auth/password-reset/confirm?token=demo-token',
        locator: page.getByRole('heading', { name: 'Set New Password' }),
      },
      {
        path: '/about',
        locator: page.getByTestId('about-page'),
      },
      {
        path: '/error/access-denied',
        locator: page.getByRole('heading', { name: 'Access Denied' }),
      },
      {
        path: '/error/session-expired',
        locator: page.getByRole('heading', { name: 'Session Expired' }),
      },
      {
        path: '/error/tenant-not-found',
        locator: page.getByRole('heading', { name: 'Organization Not Found' }),
      },
    ];

    for (const viewport of [DESKTOP_VIEWPORT, MOBILE_VIEWPORT]) {
      await page.setViewportSize(viewport);

      for (const route of publicRoutes) {
        await page.goto(route.path);
        await expect(route.locator).toBeVisible();
        await expectNoHorizontalOverflow(page, `${route.path} @ ${viewport.width}px`);
      }
    }

    expectNoRuntimeErrors(tracker, 'public routes');
  });

  test('tenant browser uses table on desktop and cards on mobile', async ({ page }) => {
    const tracker = createRuntimeErrorTracker(page);

    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto('/tenants');

    await expect(page.getByTestId('tenant-table')).toBeVisible();
    await expect(page.getByTestId('tenant-paginator')).toBeVisible();
    await expectNoHorizontalOverflow(page, 'tenants desktop');

    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.reload();

    await expect(page.getByTestId('tenant-card-view')).toBeVisible();
    await expect(page.getByTestId('tenant-table')).toHaveCount(0);
    await expect(page.getByTestId('tenant-paginator')).toBeVisible();
    await expectNoHorizontalOverflow(page, 'tenants mobile');

    expectNoRuntimeErrors(tracker, 'tenant browser');
  });

  test('administration shell, menu, and sections render on desktop and mobile', async ({
    page,
  }) => {
    const tracker = createRuntimeErrorTracker(page);

    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto('/administration?section=tenant-manager');

    await expect(page.getByTestId('tenant-manager')).toBeVisible();
    await expect(page.getByTestId('menu-toggle-btn')).toBeVisible();
    await page.getByTestId('menu-toggle-btn').click();
    await expect(page.getByTestId('floating-menu')).toBeVisible();
    await expect(page.getByTestId('menu-item')).toHaveCount(4);
    await page.getByRole('button', { name: 'Help' }).click();
    await expect(page.getByRole('dialog', { name: 'Keyboard Shortcuts' })).toBeVisible();
    await page.keyboard.press('Escape');

    await page.goto('/administration?section=license-manager');
    await expect(page.getByText('License Management').first()).toBeVisible();
    await page.getByRole('button', { name: 'Table' }).click();
    await expect(page.getByTestId('license-table')).toBeVisible();
    await expectNoHorizontalOverflow(page, 'administration license-manager desktop');

    await page.goto('/administration?section=master-locale');
    await expect(page.getByText('Master Locale').first()).toBeVisible();
    await expect(page.getByText('Default Language')).toBeVisible();
    await expectNoHorizontalOverflow(page, 'administration master-locale desktop');

    await page.goto('/administration?section=master-definitions');
    await expect(page.getByRole('heading', { name: 'Object Types' })).toBeVisible();
    await expect(page.getByTestId('definitions-search-input')).toBeVisible();
    await expectNoHorizontalOverflow(page, 'administration master-definitions desktop');

    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/administration?section=tenant-manager');
    await expect(page.getByTestId('card-view')).toBeVisible();
    await expect(page.getByTestId('view-toggle')).toHaveCount(0);
    await expect(page.getByTestId('menu-toggle-btn')).toBeVisible();
    await expectNoHorizontalOverflow(page, 'administration tenant-manager mobile');

    await page.goto('/administration?section=license-manager');
    await expect(page.getByText('License Management').first()).toBeVisible();
    await expectNoHorizontalOverflow(page, 'administration license-manager mobile');

    await page.goto('/administration?section=master-locale');
    await expect(page.getByText('Default Language')).toBeVisible();
    await expectNoHorizontalOverflow(page, 'administration master-locale mobile');

    await page.goto('/administration?section=master-definitions');
    await expect(page.getByRole('heading', { name: 'Object Types' })).toBeVisible();
    await expectNoHorizontalOverflow(page, 'administration master-definitions mobile');

    expectNoRuntimeErrors(tracker, 'administration shell and sections');
  });

  test('tenant manager factsheet auth provider surfaces render through the visible dialog', async ({
    page,
  }) => {
    const tracker = createRuntimeErrorTracker(page);

    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto('/administration?section=tenant-manager');
    await expect(page.getByTestId('tenant-table')).toBeVisible();

    await page.getByTestId('add-tenant-btn').click();
    await expect(page.getByTestId('wizard-panel')).toBeVisible();
    await page.getByTestId('wizard-fullname').fill('Overlay Verification Tenant');
    await page.getByTestId('wizard-close').click();
    await expect(page.getByTestId('wizard-discard-banner')).toBeVisible();
    await page.getByTestId('wizard-discard-cancel').click();
    await expect(page.getByTestId('wizard-discard-banner')).toHaveCount(0);
    await page.getByTestId('wizard-close').click();
    await page.getByTestId('wizard-discard-confirm').click();
    await expect(page.getByTestId('wizard-panel')).toHaveCount(0);

    await page.getByTestId('delete-btn-tenant-a').click();
    await expect(page.getByTestId('delete-tenant-cancel')).toBeVisible();
    await page.getByTestId('delete-tenant-cancel').click();
    await expect(page.getByTestId('delete-tenant-cancel')).toHaveCount(0);

    await gotoTenantFactsheet(page);

    await page.getByTestId('factsheet-tab-auth').click();
    await expect(page.getByTestId('factsheet-auth')).toBeVisible();
    await expect(page.getByTestId('source-table')).toBeVisible();

    await page.locator('[data-testid="source-row-provider-oidc"]').click();
    await expect(page.getByTestId('detail-source-name')).toBeVisible();
    await page.getByTestId('detail-tab-mapping').click();
    await expect(page.getByTestId('detail-mapping-table')).toBeVisible();
    await page.getByTestId('detail-close-btn').click();

    await page.getByTestId('btn-add-source').click();
    await expect(page.getByTestId('protocol-cards')).toBeVisible();
    await page.getByTestId('input-display-name').fill('Overlay Verification Source');
    await page.getByTestId('wizard-close-btn').click();
    await expect(page.getByTestId('cancel-confirm-banner')).toBeVisible();
    await expect(page.getByTestId('cancel-confirm-dialog')).toHaveCount(0);
    await page.getByTestId('btn-cancel-dismiss').click();
    await expect(page.getByTestId('cancel-confirm-banner')).toHaveCount(0);
    await page.getByTestId('wizard-close-btn').click();
    await page.getByTestId('btn-cancel-confirm').click();
    await expect(page.getByTestId('protocol-cards')).toHaveCount(0);

    await page.locator('[data-testid="source-row-provider-oidc"]').click();
    await expect(page.getByTestId('detail-source-name')).toBeVisible();
    await page.getByTestId('detail-btn-remove').click();
    await expect(page.getByTestId('remove-source-dialog-content')).toBeVisible();
    await page.getByTestId('remove-dialog-close').click();
    await expect(page.getByTestId('remove-source-dialog-content')).toHaveCount(0);
    await page.getByTestId('detail-close-btn').click();

    await page.getByTestId('factsheet-tab-branding').click();
    await expect(page.getByTestId('factsheet-branding')).toBeVisible();
    await expectNoHorizontalOverflow(page, 'tenant factsheet desktop');

    expectNoRuntimeErrors(tracker, 'tenant factsheet auth');
  });

  test('master definitions and license manager dialogs remain usable on mobile', async ({
    page,
  }) => {
    const tracker = createRuntimeErrorTracker(page);

    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/administration?section=master-definitions');

    await page.getByTestId('definitions-view-card-btn').click();
    await expect(page.getByTestId('definitions-card-grid')).toBeVisible();
    await page.getByTestId('definitions-new-type-btn').click();
    await expect(page.getByTestId('wizard-step-basic')).toBeVisible();
    await page.keyboard.press('Escape');
    await expectNoHorizontalOverflow(page, 'master definitions mobile');

    await page.goto('/administration?section=license-manager');
    await page.getByRole('button', { name: 'Import License' }).click();
    await expect(page.getByRole('dialog', { name: 'Import License File' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expectNoHorizontalOverflow(page, 'license manager mobile');

    expectNoRuntimeErrors(tracker, 'master definitions and license manager mobile');
  });
});
