import { defineConfig } from '@playwright/test';

const webServer = process.env.PLAYWRIGHT_SKIP_WEBSERVER
  ? undefined
  : {
      command: 'npm run dev -- --hostname 0.0.0.0 --port 3002',
      port: 3002,
      reuseExistingServer: true,
      cwd: '.',
    };

export default defineConfig({
  retries: 0,
  use: {
    headless: true,
    baseURL: 'http://127.0.0.1:3002',
    viewport: { width: 1280, height: 720 },
    actionTimeout: 30000,
    navigationTimeout: 30000,
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
  ...(webServer ? { webServer } : {}),
});
