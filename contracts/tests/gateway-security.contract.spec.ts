import { expect, test } from '@playwright/test';

test.describe('Gateway Security Contract', () => {
  test('returns 401 for unauthenticated user API calls', async ({ request }) => {
    const response = await request.get('/api/v1/users');
    expect(response.status()).toBe(401);
  });

  test('returns 401 for unauthenticated tenant creation', async ({ request }) => {
    const response = await request.post('/api/tenants', {
      data: {
        fullName: 'Contract Tenant',
        shortName: 'Contract',
        tenantType: 'REGULAR',
        tier: 'STANDARD',
        adminEmail: 'contract@example.com',
      },
    });
    expect(response.status()).toBe(401);
  });

  test('returns 401 for internal API paths from unauthenticated edge traffic', async ({ request }) => {
    const response = await request.get(
      '/api/v1/internal/seats/validate?tenantId=master&userId=00000000-0000-0000-0000-000000000001',
    );
    expect(response.status()).toBe(401);
  });

  test('returns 401 for malformed bearer token', async ({ request }) => {
    const response = await request.get('/api/v1/admin/licenses/status', {
      headers: {
        Authorization: 'Bearer not-a-jwt',
      },
    });
    expect(response.status()).toBe(401);
  });
});
