import { defineConfig } from '@playwright/test';

export default defineConfig({
  retries: 0,
  use: {
    headless: true,
    baseURL: 'https://story-verylong.vercel.app',
    viewport: { width: 1280, height: 720 },
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});