import { defineConfig } from '@playwright/test';

const isProd = process.env.TEST_ENV === 'production';

export default defineConfig({
  testDir: './e2e',
  workers: 1,
  use: {
    baseURL: isProd
      ? (process.env.PRODUCTION_URL ?? 'http://localhost:3000')
      : 'http://localhost:3000',
    headless: true,
  },
  reporter: [['html', { open: 'never' }], ['list']],
  timeout: 30_000,
});
