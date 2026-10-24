import { defineConfig, devices } from '@playwright/test';

// Uses the locally installed Google Chrome (no browser download needed).
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 45_000,
  fullyParallel: true,
  workers: 2,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4321',
    channel: 'chrome',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop-1440', use: { ...devices['Desktop Chrome'], channel: 'chrome', viewport: { width: 1440, height: 900 } } },
    { name: 'mobile-375', use: { ...devices['Pixel 7'], channel: 'chrome', viewport: { width: 375, height: 812 } } },
  ],
  webServer: {
    command: 'node scripts/serve.mjs',
    url: 'http://localhost:4321',
    reuseExistingServer: true,
  },
});
