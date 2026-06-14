# Tempo Connect Agent Instructions

Tempo Connect is a Laravel 13 modular monolith marketplace for services in Mozambique. Build it as a domain-oriented application with Portuguese user-facing messages and English code identifiers.

<laravel-boost-guidelines>
=== foundation rules ===

# Laravel Boost Guidelines

Follow these guidelines for all work in this Laravel application.

## Foundational Context

- Application: Tempo Connect
- Product: services marketplace for Mozambique
- Architecture: modular monolith organized by business domains
- Target stack: Laravel 13, PHP 8.4+, MariaDB, Laravel Sanctum, React, Inertia, TailwindCSS, Redis, Laravel Queue, Laravel Reverb, Meilisearch, MinIO or local storage
- Current local tooling may run a newer PHP patch/minor version; do not downgrade dependencies unless explicitly requested.
- Do not implement payments yet. Only prepare placeholders for future M-Pesa and e-Mola integration.

## Skills Activation

This project has domain-specific skills available in `**/skills/**`. You MUST activate the relevant skill whenever you work in that domain.

## Laravel Boost Tools

- Use Laravel Boost tools before manual alternatives when they apply.
- Use `application-info` to confirm installed package versions before implementation.
- Use `search-docs` before making code changes. Scope by package when possible and use broad topic-based queries.
- Use `database-schema` before writing migrations, models, relationships, or database-dependent code.
- Use `database-query` for read-only database inspection instead of tinker or ad hoc scripts.
- Use `get-absolute-url` before sharing application URLs.
- Use `browser-logs` for frontend/browser errors and `last-error` or log tools for backend exceptions.

## General Conventions

- Follow existing code conventions. Check sibling files before creating or editing files.
- Use descriptive English names for classes, methods, variables, routes, tests, and database objects.
- Use Portuguese for user-facing labels, validation messages, API messages, notifications, emails, and UI copy.
- Prefer Laravel conventions and first-party features over custom infrastructure.
- Do not create new base directories or change dependencies without approval.
- Do not create documentation files unless explicitly requested.

=== architecture rules ===

# Modular Monolith Architecture

Organize code by business domains while keeping one deployable Laravel application. Domain code should be cohesive and should not leak business rules into HTTP, UI, or persistence glue.

## Core Domains

- Auth
- Users
- Categories
- Skills
- Professionals
- ServiceRequests
- Proposals
- Contracts
- Chat
- Notifications
- Reviews
- Reports
- Disputes
- Admin
- Analytics
- Settings

## Domain Organization

- Prefer domain namespaces such as `App\Domains\Users`, `App\Domains\ServiceRequests`, and `App\Domains\Contracts` when adding substantial domain logic.
- Keep controllers thin. Controllers should handle HTTP concerns only: authorization calls, Form Request injection, calling Actions or Services, and returning responses.
- Put business workflows in Actions and reusable business operations in Services.
- Keep cross-domain communication explicit through Actions, Services, events, jobs, notifications, or well-defined model relationships.
- Avoid putting business logic in controllers, routes, migrations, Blade/React views, API Resources, or Eloquent accessors.
- Use events and queued listeners/jobs for side effects such as notifications, indexing, analytics updates, and chat delivery.

## Suggested Domain Structure

Use existing project conventions first. When no convention exists, prefer this shape for substantial domains:

```text
app/Domains/{Domain}/
  Actions/
  Data/
  Enums/
  Events/
  Exceptions/
  Http/Controllers/
  Http/Requests/
  Http/Resources/
  Jobs/
  Models/
  Notifications/
  Policies/
  Services/
```

Only create folders that are needed for the feature being built.

=== implementation rules ===

# Laravel Implementation Rules

## HTTP, Validation, and Responses

- Use Form Requests for validation.
- Use Policies for authorization.
- Use API Resources for JSON responses.
- Use named routes and `route()` for generated URLs.
- Use implicit route model binding where appropriate.
- Use `Route::resource()` or `Route::apiResource()` when it matches the endpoint shape.
- Use Laravel Sanctum for API authentication.

All API responses must follow this envelope.

Success:

```json
{
  "success": true,
  "message": "Operação concluída com sucesso.",
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "message": "Mensagem de erro.",
  "errors": {}
}
```

## Data and Eloquent

- Use PHP Enums for statuses.
- Store statuses as string columns in the database. Do not use database `ENUM` columns.
- Cast status fields to PHP Enums in Eloquent models.
- Use soft deletes where the record may be hidden, restored, audited, or referenced historically.
- Add indexes for columns used in filtering, searching, ordering, foreign keys, and status transitions.
- Define `$fillable` or `$guarded` on every model.
- Use factories for test data and seeders where useful.
- Prevent N+1 queries with eager loading, counts, and explicit query design.

## Services, Actions, Jobs, and Events

- Use single-purpose Actions for state-changing use cases, for example `CreateServiceRequestAction` or `AcceptProposalAction`.
- Use Services for reusable domain operations or integrations.
- Queue slow work with Laravel Queue.
- Use Redis for queues, cache, locks, broadcasts, and rate-limited workflows when configured.
- Use Laravel Reverb for realtime marketplace features such as chat, proposal updates, and notifications.
- Use Meilisearch for searchable marketplace data such as professionals, categories, skills, and service requests.
- Use MinIO or local storage through Laravel filesystem disks; do not hardcode storage paths.

## Frontend

- Use React with Inertia for app screens.
- Use TailwindCSS for styling.
- Reuse existing components before creating new ones.
- Keep user-facing UI copy in Portuguese.
- If frontend changes do not appear, the user may need `npm run build`, `npm run dev`, or `composer run dev`.

## Payments

- Do not implement payment processing in the current phase.
- You may add clearly isolated placeholders, interfaces, config stubs, or TODO markers for future M-Pesa and e-Mola integrations only when a feature needs a payment boundary.
- Do not store payment credentials, call payment APIs, or create real payment flows.

=== php rules ===

# PHP

- Use strict, typed PHP.
- Always use curly braces for control structures, even for single-line bodies.
- Use constructor property promotion where it improves clarity.
- Use explicit return type declarations and type hints for all method parameters.
- Use TitleCase for Enum cases, for example `Pending`, `Accepted`, `Completed`.
- Prefer PHPDoc blocks over inline comments.
- Use array shape type definitions in PHPDoc where helpful.
- Run `vendor/bin/pint --dirty --format agent` after modifying PHP files.

=== testing rules ===

# Testing

- Write tests for every major feature.
- Use Pest for tests.
- Create tests with `php artisan make:test --pest {Name}`.
- Use feature tests for HTTP workflows and unit tests for isolated Actions, Services, Enums, or value objects.
- Use factories and factory states instead of manually constructing large model graphs.
- Fake queues, events, notifications, mail, storage, broadcasts, and HTTP clients where appropriate.
- Run focused tests with `php artisan test --compact --filter={Name}` while developing.
- Run broader relevant tests before finalizing changes when feasible.
- Do not delete tests without approval.

=== implementation order ===

# Implementation Order

Build Tempo Connect in this order unless the user explicitly changes priority:

1. Base Laravel setup
2. Auth
3. Users
4. Categories and Skills
5. Professional Profiles
6. Service Requests
7. Proposals
8. Contracts
9. Chat
10. Notifications
11. Reviews
12. Reports and Disputes
13. Admin
14. Analytics

=== artisan rules ===

# Artisan

- Use `php artisan make:` commands for Laravel-generated files.
- Pass `--no-interaction` to Artisan commands.
- Use `php artisan list` and `php artisan {command} --help` to confirm available commands and options.
- Inspect routes with `php artisan route:list`, filtered with options such as `--method`, `--name`, `--path`, `--except-vendor`, and `--only-vendor`.
- Read config with `php artisan config:show key.name` or config files.

=== tinker rules ===

# Tinker

- Prefer tests, Artisan commands, and Boost database tools over tinker.
- Do not create or mutate production-like data in tinker without approval.
- When tinker is necessary, use single quotes to avoid shell expansion:

```shell
php artisan tinker --execute 'User::where("active", true)->count();'
```

=== deployment rules ===

# Deployment

- Use environment variables only through config files.
- Keep `.env` secrets out of version control.
- Laravel Cloud is an acceptable deployment target if the user chooses it.
- Production services should be configured for MariaDB, Redis, queue workers, Reverb, Meilisearch, and MinIO or the selected storage disk.

</laravel-boost-guidelines>
