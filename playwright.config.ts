import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

const dbPath = path.resolve('storage/framework/playwright.sqlite');
const startServer = process.env.PLAYWRIGHT_START_SERVER !== 'false';

export default defineConfig({
    testDir: './tests/playwright',
    fullyParallel: false,
    workers: 1,
    retries: process.env.CI ? 1 : 0,
    reporter: [
        ['list'],
        ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ],
    use: {
        baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:8000',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    webServer: startServer
        ? {
            command: `APP_ENV=testing DB_CONNECTION=sqlite DB_DATABASE=${dbPath} CACHE_STORE=array SESSION_DRIVER=array QUEUE_CONNECTION=sync php artisan serve --host=127.0.0.1 --port=8000`,
            url: 'http://127.0.0.1:8000',
            reuseExistingServer: !process.env.CI,
            timeout: 120000,
        }
        : undefined,
    globalSetup: './tests/playwright/global-setup.ts',
});
