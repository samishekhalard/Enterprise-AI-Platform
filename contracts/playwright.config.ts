import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  reporter: 'list',
  use: {
    baseURL: process.env.CONTRACT_BASE_URL ?? 'http://localhost:28080',
    extraHTTPHeaders: {
      'X-Tenant-ID':
        process.env.CONTRACT_TENANT_ID ?? '00000000-0000-0000-0000-000000000001',
    },
  },
});
