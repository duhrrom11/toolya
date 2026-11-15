const { defineConfig } = require('playwright/test');

module.exports = defineConfig({
  testDir: './tests/browser',
  timeout: 30_000,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    browserName: 'chromium',
    launchOptions: process.env.TOOLYA_CHROMIUM_PATH
      ? { executablePath: process.env.TOOLYA_CHROMIUM_PATH }
      : {},
    headless: true
  },
  webServer: {
    command: 'node scripts/home-preview.cjs --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173/',
    reuseExistingServer: false,
    timeout: 15_000
  }
});
