// Browser tests. Runs the real app in headless Chromium against a tiny static
// server (tests/serve.js). Supabase is replaced by an in-memory fake, so these
// never touch your real project or the internet.
//
//   npm run test:e2e                              all browser tests
//   npx playwright test --grep @smoke             just the quick smoke checks
//   npx playwright test --ui                      watch/debug interactively
//   SERVE_DIR=_site npx playwright test --grep @smoke    test the built site
const { defineConfig, devices } = require('@playwright/test');

const PORT = process.env.PORT || 4173;

module.exports = defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    viewport: { width: 420, height: 900 },
    trace: 'retain-on-failure',
    serviceWorkers: 'block'            // tests control caching themselves
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 420, height: 900 } } }],
  webServer: {
    command: 'node tests/serve.js',
    url: `http://127.0.0.1:${PORT}/index.html`,
    reuseExistingServer: !process.env.CI,
    timeout: 20_000
  }
});
