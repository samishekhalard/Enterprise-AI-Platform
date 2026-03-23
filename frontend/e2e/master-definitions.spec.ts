import { expect, test } from '@playwright/test';

/**
 * Master Definitions Section E2E Tests
 *
 * These tests verify the Object Types administration UI at
 * /administration?section=master-definitions.
 *
 * All API calls are intercepted via page.route() so no backend is required.
 *
 * Architecture under test:
 *   MasterDefinitionsSectionComponent
 *     -> ApiGatewayService.listObjectTypes()   -> GET  /api/v1/definitions/object-types
 *     -> ApiGatewayService.createObjectType()  -> POST /api/v1/definitions/object-types
 *     -> ApiGatewayService.deleteObjectType()  -> DELETE /api/v1/definitions/object-types/:id
 *
 * Key files:
 *   - frontend/src/app/features/administration/sections/master-definitions/
 *     master-definitions-section.component.ts (lines 41-223)
 *   - frontend/src/app/core/api/api-gateway.service.ts (lines 340-382)
 *   - frontend/src/app/features/administration/models/administration.models.ts (lines 113-167)
 */

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const MOCK_OBJECT_TYPES = [
  {
    id: 'ot-1',
    tenantId: 'master',
    name: 'Asset',
    typeKey: 'asset',
    code: 'OBJ_001',
    iconName: 'box',
    iconColor: '#428177',
    status: 'active',
    state: 'user_defined',
    description: 'Physical or digital asset',
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-01-20T14:30:00Z',
    attributes: [
      {
        attributeTypeId: 'at-1',
        name: 'Serial Number',
        attributeKey: 'serial_number',
        dataType: 'string',
        isRequired: true,
        displayOrder: 0,
      },
    ],
    connections: [
      {
        targetTypeId: 'ot-2',
        targetTypeName: 'Location',
        relationshipKey: 'located_at',
        activeName: 'located at',
        passiveName: 'hosts',
        cardinality: 'many-to-one',
        isDirected: true,
      },
    ],
  },
  {
    id: 'ot-2',
    tenantId: 'master',
    name: 'Location',
    typeKey: 'location',
    code: 'OBJ_002',
    iconName: 'map-pin',
    iconColor: '#b9a779',
    status: 'planned',
    state: 'default',
    description: 'Physical location',
    createdAt: '2026-01-16T09:00:00Z',
    updatedAt: '2026-01-21T11:00:00Z',
    attributes: [],
    connections: [],
  },
  {
    id: 'ot-3',
    tenantId: 'master',
    name: 'Server',
    typeKey: 'server',
    code: 'OBJ_003',
    iconName: 'server',
    iconColor: '#5b8def',
    status: 'active',
    state: 'user_defined',
    description: 'Physical or virtual server',
    attributes: [],
    connections: [],
  },
];

const MOCK_PAGED_RESPONSE = {
  content: MOCK_OBJECT_TYPES,
  page: 0,
  size: 25,
  totalElements: 3,
  totalPages: 1,
};

const MOCK_EMPTY_RESPONSE = {
  content: [],
  page: 0,
  size: 25,
  totalElements: 0,
  totalPages: 0,
};

/** Minimal valid-looking JWT for auth interception. */
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

/**
 * Intercept all API calls with a generic 200 response as a catch-all.
 * Specific routes registered AFTER this will take priority (Playwright LIFO ordering).
 */
async function interceptAllApi(page: import('@playwright/test').Page): Promise<void> {
  await page.route('**/api/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({}),
    }),
  );
}

/**
 * Seed an authenticated session by injecting tokens into sessionStorage.
 */
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

/**
 * Set up standard API mocks and navigate to master-definitions section.
 */
async function navigateToDefinitions(
  page: import('@playwright/test').Page,
  pagedResponse = MOCK_PAGED_RESPONSE,
): Promise<void> {
  // Catch-all API interceptor (registered first, lowest priority)
  await interceptAllApi(page);

  // Tenant resolve mock
  await page.route('**/api/tenants/resolve**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'master', name: 'Master', status: 'active' }),
    }),
  );

  // Object types list mock
  await page.route('**/api/v1/definitions/object-types**', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(pagedResponse),
      });
    }
    return route.continue();
  });

  // Seed auth session and navigate
  await seedAuthenticatedSession(page);
  await page.goto('/administration?section=master-definitions');
  await page.waitForLoadState('domcontentloaded');
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Master Definitions — Object Types', () => {
  test('should display object type list on page load', async ({ page }) => {
    await navigateToDefinitions(page);

    // Wait for list items to render
    const items = page.locator('[data-testid="definitions-type-item"]');
    await expect(items.first()).toBeVisible({ timeout: 10_000 });
    await expect(items).toHaveCount(3);

    // Verify names are displayed (exact: true avoids matching lowercase typeKey spans)
    await expect(page.getByText('Asset', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Location', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Server', { exact: true }).first()).toBeVisible();

    // Verify heading
    await expect(page.getByRole('heading', { name: 'Object Types' })).toBeVisible();
  });

  test('should toggle between list and card views', async ({ page }) => {
    await navigateToDefinitions(page);

    // Wait for list items first
    const listItems = page.locator('[data-testid="definitions-type-item"]');
    await expect(listItems.first()).toBeVisible({ timeout: 10_000 });

    // Initially in list mode — verify list items are present
    await expect(listItems).toHaveCount(3);

    // Click card view toggle
    const cardToggle = page.locator('[data-testid="definitions-view-card-btn"]');
    await cardToggle.click();

    // Verify card grid appears
    const cardGrid = page.locator('[data-testid="definitions-card-grid"]');
    await expect(cardGrid).toBeVisible({ timeout: 5_000 });

    // Verify card items
    const cards = page.locator('[data-testid="definitions-type-card"]');
    await expect(cards).toHaveCount(3);

    // Click list view toggle to go back
    const listToggle = page.locator('[data-testid="definitions-view-list-btn"]');
    await listToggle.click();

    // Verify list view returns
    await expect(listItems.first()).toBeVisible({ timeout: 5_000 });
    await expect(listItems).toHaveCount(3);
  });

  test('should filter by status using the dropdown', async ({ page }) => {
    await navigateToDefinitions(page);

    // Wait for items to render
    const items = page.locator('[data-testid="definitions-type-item"]');
    await expect(items.first()).toBeVisible({ timeout: 10_000 });
    await expect(items).toHaveCount(3);

    // Click the status filter dropdown
    const statusFilter = page.locator('[data-testid="definitions-status-filter"]');
    await statusFilter.click();

    // Select "Planned" option using PrimeNG class (avoids ambiguity with list item role="option" elements)
    await page.locator('.p-select-option', { hasText: 'Planned' }).click();

    // After filtering by "planned", only Location should show
    await expect(items).toHaveCount(1, { timeout: 10_000 });
    await expect(page.getByText('Location', { exact: true }).first()).toBeVisible();
  });

  test('should filter by search text', async ({ page }) => {
    await navigateToDefinitions(page);

    // Wait for items to render
    const items = page.locator('[data-testid="definitions-type-item"]');
    await expect(items.first()).toBeVisible({ timeout: 10_000 });
    await expect(items).toHaveCount(3);

    // Type a search term
    const searchInput = page.locator('[data-testid="definitions-search-input"]');
    await searchInput.fill('server');

    // Only "Server" should remain
    await expect(items).toHaveCount(1);
    await expect(page.getByText('Server', { exact: true }).first()).toBeVisible();
  });

  test('should open the create wizard and create a new object type', async ({ page }) => {
    await navigateToDefinitions(page);

    // Wait for items to render
    const items = page.locator('[data-testid="definitions-type-item"]');
    await expect(items.first()).toBeVisible({ timeout: 10_000 });

    // Mock the POST endpoint for creating
    const createdType = {
      id: 'ot-new',
      tenantId: 'master',
      name: 'Application',
      typeKey: 'application',
      code: 'OBJ_004',
      iconName: 'desktop',
      iconColor: '#428177',
      status: 'active',
      state: 'user_defined',
      description: 'A software application',
    };

    await page.route('**/api/v1/definitions/object-types', (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(createdType),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_PAGED_RESPONSE),
      });
    });

    // Click New Type button
    await page.locator('[data-testid="definitions-new-type-btn"]').click();

    // Verify wizard opened (check name input inside the dialog, not the p-dialog host)
    const nameInput = page.locator('[data-testid="wizard-name-input"]');
    await expect(nameInput).toBeVisible({ timeout: 5_000 });

    // Step 0 — Basic Info: fill in name
    await nameInput.fill('Application');

    // Click Next to step 1 (Connections)
    const nextBtn = page.locator('[data-testid="wizard-next-btn"]');
    await nextBtn.click();

    // Step 1: Connections
    await expect(page.locator('[data-testid="wizard-step-connections"]')).toBeVisible();
    await nextBtn.click();

    // Step 2: Attributes
    await expect(page.locator('[data-testid="wizard-step-attributes"]')).toBeVisible({ timeout: 5_000 });
    await nextBtn.click();

    // Step 3: Status/Review — verify name in review summary
    await expect(page.locator('[data-testid="wizard-step-status"]')).toBeVisible();

    // Click Create
    await page.locator('[data-testid="wizard-create-btn"]').click();

    // Wizard should close (name input no longer in DOM) and new item appears in list
    await expect(nameInput).not.toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('Application', { exact: true })).toBeVisible();
  });

  test('should delete an object type after confirmation dialog', async ({ page }) => {
    await navigateToDefinitions(page);

    // Wait for items to render
    const items = page.locator('[data-testid="definitions-type-item"]');
    await expect(items.first()).toBeVisible({ timeout: 10_000 });
    await expect(items).toHaveCount(3);

    // Mock DELETE endpoint
    await page.route('**/api/v1/definitions/object-types/**', (route) => {
      if (route.request().method() === 'DELETE') {
        return route.fulfill({ status: 204, body: '' });
      }
      return route.continue();
    });

    // Click delete button on first item (ot-1: user_defined, not default) — opens confirm dialog
    const deleteBtn = page.locator('[data-testid="definitions-delete-btn"]').first();
    await deleteBtn.click();

    // Confirmation dialog opened — check for confirm button inside dialog (not p-dialog host)
    const confirmBtn = page.locator('[data-testid="definitions-delete-confirm-btn"]');
    await expect(confirmBtn).toBeVisible({ timeout: 5_000 });

    // Confirm deletion
    await confirmBtn.click();

    // Should now have one fewer item
    await expect(items).toHaveCount(2);
  });

  test('should display empty state when no object types exist', async ({ page }) => {
    await navigateToDefinitions(page, MOCK_EMPTY_RESPONSE);

    // Wait for the empty state to appear
    const emptyState = page.locator('[data-testid="definitions-empty-state"]');
    await expect(emptyState).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('No object types match your criteria.')).toBeVisible();
  });

  test('should display error banner on API failure and retry', async ({ page }) => {
    // Set up API interceptors for failure scenario
    await interceptAllApi(page);
    await page.route('**/api/tenants/resolve**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'master', name: 'Master', status: 'active' }),
      }),
    );

    let callCount = 0;
    await page.route('**/api/v1/definitions/object-types**', (route) => {
      callCount++;
      if (callCount <= 1) {
        // First call: return 500 error
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' }),
        });
      }
      // Subsequent calls (retry): return success
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_PAGED_RESPONSE),
      });
    });

    await seedAuthenticatedSession(page);
    await page.goto('/administration?section=master-definitions');
    await page.waitForLoadState('domcontentloaded');

    // Verify error banner appears
    const errorBanner = page.locator('.error-banner');
    await expect(errorBanner).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Failed to load object types')).toBeVisible();

    // Click retry button
    const retryBtn = page.locator('[data-testid="definitions-retry-btn"]');
    await retryBtn.click();

    // After retry, items should appear
    const items = page.locator('[data-testid="definitions-type-item"]');
    await expect(items.first()).toBeVisible({ timeout: 10_000 });
    await expect(items).toHaveCount(3);
  });

  test('should display detail panel when selecting an object type', async ({ page }) => {
    await navigateToDefinitions(page);

    // Wait for items to render
    const items = page.locator('[data-testid="definitions-type-item"]');
    await expect(items.first()).toBeVisible({ timeout: 10_000 });

    // Verify empty detail panel initially
    const emptyDetail = page.locator('[data-testid="definitions-empty-detail"]');
    await expect(emptyDetail).toBeVisible();
    await expect(page.getByText('Select an Object Type')).toBeVisible();

    // Click on the first item (Asset)
    await items.first().click();

    // Verify detail panel appears with object type info
    const detailPanel = page.locator('[data-testid="definitions-detail-panel"]');
    await expect(detailPanel).toBeVisible({ timeout: 5_000 });

    // Verify detail fields
    await expect(detailPanel.getByRole('heading', { name: 'Asset' })).toBeVisible();
    await expect(detailPanel.locator('code.type-key-code').first()).toBeVisible(); // typeKey
    await expect(detailPanel.getByText('OBJ_001', { exact: true })).toBeVisible(); // code
    await expect(detailPanel.getByText('Physical or digital asset', { exact: true })).toBeVisible(); // description

    // Verify attribute is shown
    await expect(detailPanel.getByText('Serial Number')).toBeVisible();
    await expect(detailPanel.getByText('string')).toBeVisible();

    // Verify connection is shown
    await expect(detailPanel.getByText('located at')).toBeVisible();
    await expect(detailPanel.getByText('Location')).toBeVisible();
  });

  // ── New tests (RTM-MD implementation) ─────────────────────────────────────

  test('should show OBJ_XXX code placeholder in wizard step 1', async ({ page }) => {
    await navigateToDefinitions(page);
    await expect(page.locator('[data-testid="definitions-type-item"]').first()).toBeVisible({ timeout: 10_000 });

    await page.locator('[data-testid="definitions-new-type-btn"]').click();
    // Dialog open — check name input is visible (p-dialog host is never "visible" in DOM sense)
    await expect(page.locator('[data-testid="wizard-name-input"]')).toBeVisible({ timeout: 5_000 });

    // Code field should show auto-assign placeholder
    const codeInput = page.locator('[aria-label="Object type code (auto-assigned)"]');
    await expect(codeInput).toBeVisible();
    await expect(codeInput).toHaveValue('OBJ_XXX');
  });

  test('should disable Next button when wizard name is empty', async ({ page }) => {
    await navigateToDefinitions(page);
    await expect(page.locator('[data-testid="definitions-type-item"]').first()).toBeVisible({ timeout: 10_000 });

    await page.locator('[data-testid="definitions-new-type-btn"]').click();
    await expect(page.locator('[data-testid="wizard-name-input"]')).toBeVisible({ timeout: 5_000 });

    // Name is empty — Next button should be disabled
    const nextBtn = page.locator('[data-testid="wizard-next-btn"]');
    await expect(nextBtn).toBeDisabled();

    // Fill name — Next button should become enabled
    await page.locator('[data-testid="wizard-name-input"]').fill('My Type');
    await expect(nextBtn).toBeEnabled();
  });

  test('should cancel wizard without making POST request', async ({ page }) => {
    await navigateToDefinitions(page);
    await expect(page.locator('[data-testid="definitions-type-item"]').first()).toBeVisible({ timeout: 10_000 });

    let postCalled = false;
    await page.route('**/api/v1/definitions/object-types', (route) => {
      if (route.request().method() === 'POST') postCalled = true;
      return route.continue();
    });

    await page.locator('[data-testid="definitions-new-type-btn"]').click();
    const nameInput = page.locator('[data-testid="wizard-name-input"]');
    await expect(nameInput).toBeVisible({ timeout: 5_000 });

    await nameInput.fill('Cancelled Type');
    await page.locator('[data-testid="wizard-cancel-btn"]').click();

    await expect(nameInput).not.toBeVisible({ timeout: 5_000 });
    expect(postCalled).toBe(false);
  });

  test('should display attribute types in wizard step 3 (Attributes)', async ({ page }) => {
    const mockAttributeTypes = [
      { id: 'at-1', tenantId: 'master', name: 'Serial Number', attributeKey: 'serial_number', dataType: 'string' },
      { id: 'at-2', tenantId: 'master', name: 'Purchase Date', attributeKey: 'purchase_date', dataType: 'date' },
    ];

    await navigateToDefinitions(page);
    await page.route('**/api/v1/definitions/attribute-types**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockAttributeTypes) }),
    );
    await expect(page.locator('[data-testid="definitions-type-item"]').first()).toBeVisible({ timeout: 10_000 });

    await page.locator('[data-testid="definitions-new-type-btn"]').click();
    await expect(page.locator('[data-testid="wizard-name-input"]')).toBeVisible({ timeout: 5_000 });

    // Fill name, advance to step 1 (Connections)
    await page.locator('[data-testid="wizard-name-input"]').fill('Test Type');
    await page.locator('[data-testid="wizard-next-btn"]').click();

    // Step 1: Connections — advance to step 2 (Attributes)
    await expect(page.locator('[data-testid="wizard-step-connections"]')).toBeVisible();
    await page.locator('[data-testid="wizard-next-btn"]').click();

    // Step 2: Attributes — verify attribute types listed
    await expect(page.locator('[data-testid="wizard-step-attributes"]')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('Serial Number')).toBeVisible();
    await expect(page.getByText('Purchase Date')).toBeVisible();
  });

  test('should handle attribute-types 400 gracefully in wizard step 3', async ({ page }) => {
    await navigateToDefinitions(page);
    await page.route('**/api/v1/definitions/attribute-types**', (route) =>
      route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: 'Bad Request' }) }),
    );
    await expect(page.locator('[data-testid="definitions-type-item"]').first()).toBeVisible({ timeout: 10_000 });

    await page.locator('[data-testid="definitions-new-type-btn"]').click();
    await expect(page.locator('[data-testid="wizard-name-input"]')).toBeVisible({ timeout: 5_000 });

    await page.locator('[data-testid="wizard-name-input"]').fill('Test Type');
    await page.locator('[data-testid="wizard-next-btn"]').click();
    await page.locator('[data-testid="wizard-next-btn"]').click();

    // Step 2: Attributes — empty state message, wizard still functional
    await expect(page.locator('[data-testid="wizard-step-attributes"]')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('No attribute types available')).toBeVisible();

    // Can still advance to step 3
    await page.locator('[data-testid="wizard-next-btn"]').click();
    await expect(page.locator('[data-testid="wizard-step-status"]')).toBeVisible();
  });

  test('should complete full 4-step wizard and create object type', async ({ page }) => {
    const newType = {
      id: 'ot-new', tenantId: 'master', name: 'Database', typeKey: 'database',
      code: 'OBJ_004', iconName: 'database', iconColor: '#428177',
      status: 'active', state: 'user_defined',
    };

    await navigateToDefinitions(page);
    await page.route('**/api/v1/definitions/object-types', (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(newType) });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_PAGED_RESPONSE) });
    });
    await expect(page.locator('[data-testid="definitions-type-item"]').first()).toBeVisible({ timeout: 10_000 });

    await page.locator('[data-testid="definitions-new-type-btn"]').click();
    await expect(page.locator('[data-testid="wizard-name-input"]')).toBeVisible({ timeout: 5_000 });

    // Step 0: Basic Info
    await page.locator('[data-testid="wizard-name-input"]').fill('Database');
    await page.locator('[data-testid="wizard-next-btn"]').click();

    // Step 1: Connections — skip
    await expect(page.locator('[data-testid="wizard-step-connections"]')).toBeVisible();
    await page.locator('[data-testid="wizard-next-btn"]').click();

    // Step 2: Attributes — skip
    await expect(page.locator('[data-testid="wizard-step-attributes"]')).toBeVisible({ timeout: 5_000 });
    await page.locator('[data-testid="wizard-next-btn"]').click();

    // Step 3: Status/Review — create
    await expect(page.locator('[data-testid="wizard-step-status"]')).toBeVisible();
    await expect(page.getByText('Database').first()).toBeVisible(); // name in review
    await page.locator('[data-testid="wizard-create-btn"]').click();

    // Wizard closes and new type appears in list
    await expect(page.locator('[data-testid="wizard-name-input"]')).not.toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('Database', { exact: true })).toBeVisible();
  });

  test('should show confirmation dialog before deleting', async ({ page }) => {
    await navigateToDefinitions(page);
    await expect(page.locator('[data-testid="definitions-type-item"]').first()).toBeVisible({ timeout: 10_000 });

    // Click delete on first item
    await page.locator('[data-testid="definitions-delete-btn"]').first().click();

    // Confirm dialog opened — check inner button (not p-dialog host)
    const confirmBtn = page.locator('[data-testid="definitions-delete-confirm-btn"]');
    await expect(confirmBtn).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('This action cannot be undone.')).toBeVisible();

    // Cancel — item count unchanged
    await page.locator('[data-testid="definitions-delete-cancel-btn"]').click();
    await expect(confirmBtn).not.toBeVisible({ timeout: 5_000 });
    await expect(page.locator('[data-testid="definitions-type-item"]')).toHaveCount(3);
  });

  test('should disable delete action for default state object types', async ({ page }) => {
    await navigateToDefinitions(page);
    const items = page.locator('[data-testid="definitions-type-item"]');
    await expect(items.first()).toBeVisible({ timeout: 10_000 });

    // ot-2 is "Location" with state "default" — its delete button should be disabled
    // Items render in MOCK order: Asset(ot-1), Location(ot-2), Server(ot-3)
    const locationItem = items.nth(1);
    await expect(locationItem.locator('strong').filter({ hasText: 'Location' })).toBeVisible();
    const deleteBtn = locationItem.locator('[data-testid="definitions-delete-btn"]');
    await expect(deleteBtn).toBeDisabled();
  });

  test('should open detail panel and switch to edit mode', async ({ page }) => {
    await navigateToDefinitions(page);
    const items = page.locator('[data-testid="definitions-type-item"]');
    await expect(items.first()).toBeVisible({ timeout: 10_000 });

    // Click first item
    await items.first().click();
    const detailPanel = page.locator('[data-testid="definitions-detail-panel"]');
    await expect(detailPanel).toBeVisible({ timeout: 5_000 });

    // Click Edit button
    await detailPanel.locator('[data-testid="definitions-edit-btn"]').click();

    // Edit form should appear
    const editForm = page.locator('[data-testid="definitions-edit-form"]');
    await expect(editForm).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('[data-testid="edit-name-input"]')).toBeVisible();

    // Cancel returns to view mode
    await page.locator('[data-testid="edit-cancel-btn"]').click();
    await expect(editForm).not.toBeVisible({ timeout: 5_000 });
  });

  test('should update object type name via PUT endpoint', async ({ page }) => {
    const updatedType = { ...MOCK_OBJECT_TYPES[0], name: 'Updated Asset', state: 'customized' };
    let putCalled = false;

    await navigateToDefinitions(page);
    await page.route('**/api/v1/definitions/object-types/**', (route) => {
      if (route.request().method() === 'PUT') {
        putCalled = true;
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(updatedType) });
      }
      return route.continue();
    });

    const items = page.locator('[data-testid="definitions-type-item"]');
    await expect(items.first()).toBeVisible({ timeout: 10_000 });

    await items.first().click();
    const detailPanel = page.locator('[data-testid="definitions-detail-panel"]');
    await detailPanel.locator('[data-testid="definitions-edit-btn"]').click();

    await page.locator('[data-testid="edit-name-input"]').fill('Updated Asset');
    await page.locator('[data-testid="edit-save-btn"]').click();

    await expect(page.locator('[data-testid="definitions-edit-form"]')).not.toBeVisible({ timeout: 5_000 });
    expect(putCalled).toBe(true);
    await expect(page.getByText('Updated Asset', { exact: true }).first()).toBeVisible();
  });

  test('should display state badge on each list item', async ({ page }) => {
    await navigateToDefinitions(page);
    const items = page.locator('[data-testid="definitions-type-item"]');
    await expect(items.first()).toBeVisible({ timeout: 10_000 });

    // Every list item should have a state badge
    const stateBadges = page.locator('[data-testid="definitions-state-badge"]');
    await expect(stateBadges).toHaveCount(3);
  });

  test('should duplicate an object type and add it to the list', async ({ page }) => {
    const duplicatedType = {
      id: 'ot-copy', tenantId: 'master', name: 'Asset (Copy)', typeKey: 'asset_copy',
      code: 'OBJ_004', iconName: 'box', iconColor: '#428177',
      status: 'active', state: 'user_defined',
    };
    let duplicateCalled = false;

    await navigateToDefinitions(page);
    await page.route('**/api/v1/definitions/object-types/**/duplicate', (route) => {
      duplicateCalled = true;
      return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(duplicatedType) });
    });

    const items = page.locator('[data-testid="definitions-type-item"]');
    await expect(items.first()).toBeVisible({ timeout: 10_000 });

    // Click duplicate on first item
    await items.first().locator('[data-testid="definitions-duplicate-btn"]').click();

    await expect(items).toHaveCount(4, { timeout: 5_000 });
    expect(duplicateCalled).toBe(true);
    await expect(page.getByText('Asset (Copy)')).toBeVisible();
  });

  test('should show restore button only for customized items', async ({ page }) => {
    const customizedType = {
      id: 'ot-4', tenantId: 'master', name: 'Custom Type', typeKey: 'custom_type',
      code: 'OBJ_004', iconName: 'cog', iconColor: '#428177',
      status: 'active', state: 'customized', attributes: [], connections: [],
    };
    const pagedWithCustomized = {
      content: [...MOCK_OBJECT_TYPES, customizedType],
      page: 0, size: 25, totalElements: 4, totalPages: 1,
    };

    await navigateToDefinitions(page, pagedWithCustomized);
    const items = page.locator('[data-testid="definitions-type-item"]');
    await expect(items.first()).toBeVisible({ timeout: 10_000 });
    await expect(items).toHaveCount(4);

    // Only the customized item (ot-4) should have a restore button
    const restoreBtns = page.locator('[data-testid="definitions-restore-btn"]');
    await expect(restoreBtns).toHaveCount(1);

    // Non-customized items (user_defined/default) should NOT have restore
    const firstItem = items.first(); // Asset: user_defined
    await expect(firstItem.locator('[data-testid="definitions-restore-btn"]')).toHaveCount(0);
  });

  test('should display all status filter options', async ({ page }) => {
    await navigateToDefinitions(page);
    await expect(page.locator('[data-testid="definitions-type-item"]').first()).toBeVisible({ timeout: 10_000 });

    // Open the status filter dropdown
    const statusFilter = page.locator('[data-testid="definitions-status-filter"]');
    await statusFilter.click();

    // Verify all 5 options are visible using PrimeNG class (avoids conflict with list item role="option" elements)
    await expect(page.locator('.p-select-option', { hasText: 'All' })).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('.p-select-option', { hasText: 'Active' })).toBeVisible();
    await expect(page.locator('.p-select-option', { hasText: 'Planned' })).toBeVisible();
    await expect(page.locator('.p-select-option', { hasText: 'On Hold' })).toBeVisible();
    await expect(page.locator('.p-select-option', { hasText: 'Retired' })).toBeVisible();
  });
});
