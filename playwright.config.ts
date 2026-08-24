import { defineConfig, devices } from '@playwright/test';

/**
 * Chromium pour tout le visuel (le helper CDP y émet des couples (code, key)
 * réalistes). Firefox et WebKit ne portent QUE le chemin de repli « Appuie sur
 * la touche A », là où `navigator.keyboard.getLayoutMap()` n'existe pas.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:3000', trace: 'on-first-retry' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'firefox-repli',
      use: { ...devices['Desktop Firefox'] },
      testMatch: /detection\.spec\.ts/,
    },
    {
      name: 'webkit-repli',
      use: { ...devices['Desktop Safari'] },
      testMatch: /detection\.spec\.ts/,
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
