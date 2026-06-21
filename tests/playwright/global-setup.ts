import { mkdirSync, existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import type { FullConfig } from '@playwright/test';

export default async function globalSetup(_: FullConfig): Promise<void> {
    const dbPath = path.resolve('storage/framework/playwright.sqlite');
    mkdirSync(path.dirname(dbPath), { recursive: true });

    if (!existsSync(dbPath)) {
        writeFileSync(dbPath, '');
    }

    execFileSync(
        'php',
        ['artisan', 'migrate:fresh', '--seed', '--no-interaction', '--seeder=Database\\Seeders\\PlaywrightSeeder'],
        {
            stdio: 'inherit',
            env: {
                ...process.env,
                APP_ENV: 'testing',
                DB_CONNECTION: 'sqlite',
                DB_DATABASE: dbPath,
                CACHE_STORE: 'array',
                SESSION_DRIVER: 'array',
                QUEUE_CONNECTION: 'sync',
            },
        },
    );
}
