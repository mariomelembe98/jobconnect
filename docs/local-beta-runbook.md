# ProConnect Local Beta Runbook

This runbook is for running ProConnect locally for demo, QA, and internal beta verification.

## 1. Requirements

- PHP 8.4 or newer
- Composer 2.x
- Node.js 20+ and npm
- MariaDB 10.6+ or SQLite for lightweight local runs
- Playwright browser binaries, especially Chromium
- A mail testing option such as Mailpit, Mailhog, or log-based mail
- A queue worker available for async jobs

Recommended local services:

- MariaDB if you want to match production more closely
- SQLite if you want the fastest setup for smoke testing
- Redis if you want to exercise queue and cache behavior closer to production

## 2. First-time setup

From the project root:

```bash
cp .env.example .env
composer install
npm install
php artisan key:generate
```

Then configure your database in `.env`.

### MariaDB setup

Create an empty database and set these values:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=tempoconect
DB_USERNAME=root
DB_PASSWORD=
```

### SQLite setup

Use a local SQLite file:

```bash
touch database/database.sqlite
```

Then set:

```env
DB_CONNECTION=sqlite
DB_DATABASE=/absolute/path/to/database/database.sqlite
```

Run the initial database setup:

```bash
php artisan migrate:fresh --seed
```

If the project uses storage symlinks:

```bash
php artisan storage:link
```

## 3. Local run commands

Start the Laravel app:

```bash
php artisan serve
```

Start the frontend asset watcher:

```bash
npm run dev
```

Run the queue worker when background jobs matter:

```bash
php artisan queue:work
```

If scheduled tasks need to run locally:

```bash
php artisan schedule:work
```

## 4. Test commands

Run the backend test suite:

```bash
php artisan test
```

Run TypeScript checks:

```bash
npm run typecheck
```

Build the frontend bundle:

```bash
npm run build
```

Install Chromium for Playwright:

```bash
npx playwright install chromium
```

Run browser tests:

```bash
npx playwright test
```

## 5. Demo accounts

Use seeded accounts for local demos. Seed them through the normal database seeder flow so credentials remain consistent across environments.

Suggested account roles:

- Admin
- Client
- Professional

Recommended process:

1. Seed demo users through database seeders.
2. Ensure passwords are documented only in local developer notes or seed output.
3. Do not hardcode production-like credentials in source control.

If the project already provides demo seeders, run the full seed command:

```bash
php artisan migrate:fresh --seed
```

To add the richer local demo dataset:

```bash
php artisan db:seed --class=DemoSeeder
```

Suggested demo login credentials:

- Admin: `admin@tempoconnect.local` / `password`
- Client examples: `client1@demo.tempoconect.local` … `client5@demo.tempoconect.local` / `password`
- Professional examples: `professional1@demo.tempoconect.local` … `professional10@demo.tempoconect.local` / `password`

If you need to reset demo data safely, re-run the same command instead of editing records manually.

## 6. Local demo script

Use this flow to verify the marketplace end-to-end:

1. Client registers or logs in.
2. Client creates a service request.
3. Professional logs in and submits a proposal.
4. Client accepts the proposal.
5. The resulting contract is opened.
6. Users open chat from the contract.
7. The service is completed.
8. The client submits a review.
9. Admin checks activity logs for the audit trail.

Suggested verification points:

- Service request appears in the client dashboard
- Proposal appears in the professional proposal list
- Contract shows the chat handoff when available
- Review is visible in review history
- Activity logs contain the expected critical actions

## 7. Troubleshooting

### Storage link

If uploads fail or files are missing, verify:

```bash
php artisan storage:link
```

Also confirm the filesystem disk in `.env` is correct.

### Permissions

If Laravel cannot write cache, logs, or uploads:

- Check ownership of `storage/` and `bootstrap/cache/`
- Ensure the web server user can write to those paths

### SQLite / MariaDB

If migrations fail:

- Confirm the database exists
- Confirm the `.env` connection settings
- For SQLite, confirm the file path is absolute and writable

### Vite issues

If assets are stale or missing:

```bash
npm run dev
```

For a production-style build:

```bash
npm run build
```

If route or component changes do not appear, clear browser cache and rebuild assets.

### Playwright browser install

If browser tests fail because Chromium is missing:

```bash
npx playwright install chromium
```

If CI is used, make sure the browser installation step runs before tests.

### File uploads

If uploads fail:

- Confirm `FILESYSTEM_DISK` is configured correctly
- Confirm the target directory is writable
- Confirm the queue worker is running if uploads trigger jobs

### Queue not running

If background actions do not complete:

```bash
php artisan queue:work
```

If the app relies on scheduled tasks:

```bash
php artisan schedule:work
```

## 8. Suggested local beta checklist

- Authenticate with each seeded role
- Create and process a service request
- Submit and accept a proposal
- Open a contract and chat
- Complete a contract
- Submit a review
- Confirm admin audit visibility
- Confirm uploads and downloads work
- Confirm build and automated tests pass
