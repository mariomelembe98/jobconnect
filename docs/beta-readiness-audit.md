# ProConnect Beta Readiness Audit

Audit date: 21 June 2026  
Application: Laravel 13.15, PHP 8.5, React 19.2, Inertia 3.4, Tailwind CSS 4.3

## Executive summary

**Verdict: not ready for an external Beta.**

The core client transaction is mostly implemented: a client can register, publish a request, receive and accept proposals, manage a contract, use chat, complete the contract, and leave a review. However, the hand-off from proposal acceptance to contract/chat is weak and several client management screens remain absent.

The professional journey is blocked immediately after registration because there is no professional profile creation screen. The backend requires a profile before a professional may submit a proposal, while the dashboard's “Criar perfil profissional” action is only a placeholder.

The admin journey is also blocked after the dashboard. User management, taxonomies, reports, disputes, and professional verification have backend APIs but no frontend screens. This leaves the marketplace without an operable moderation and verification workflow.

Static coverage found:

- 108 API route patterns.
- 48 API route patterns with direct frontend usage.
- 60 API route patterns with no frontend usage.
- 19 web route patterns.
- 18 React page components.
- Strong backend feature-test coverage, but no frontend unit, component, browser, or end-to-end journey tests.

This audit is based on routes, controllers, resources, requests, React pages/components, configuration, and automated build/test execution. It does not include manual testing on real devices or a deployed production-like environment.

## Completed

### Client journey

| Step | Status | Evidence and limitations |
|---|---|---|
| Register | Implemented | Real registration, token storage, user persistence, and role redirect. No phone/email verification or password recovery. |
| Create request | Implemented | Categories, province/city lookup, validation, request creation, and attachment upload are integrated. Partial attachment failure is surfaced. |
| Receive proposals | Implemented | Request detail loads proposals with pagination and supports empty/loading/error states. There is no full “Meus pedidos” page. |
| Accept/reject proposal | Implemented | Acceptance creates the contract/conversation in the backend; rejection is integrated. The success message incorrectly says contract details are not available. |
| Contract | Implemented | Shared list/detail pages, status history, complete/cancel actions, and responsive states exist. |
| Chat | Partially implemented | Conversation list/detail, send, attachments, read, archive, and manual refresh exist. Contracts do not deep-link to their conversation. |
| Complete contract | Implemented | Client-only completion is integrated and refreshes the contract. |
| Leave review | Implemented | Completed contracts open a real 1–5 star review modal with optional comment. `/reviews/me` separates given and received reviews. |

### Professional journey

| Step | Status | Evidence and limitations |
|---|---|---|
| Register | Implemented | Professional role registration and redirect exist. |
| Create profile | **Blocked** | Backend exists, but the missing-profile CTA only displays “em breve”. |
| Browse jobs | Implemented | Search, filters, sort, pagination, job details, loading/empty/error states exist. |
| Submit proposal | Implemented after profile | Form and redirect exist, but backend correctly refuses professionals without a profile. |
| Manage proposals | Implemented | List, status tabs, detail enrichment, withdraw flow, and feedback exist. |
| Contract | Implemented | Shared contract list/detail pages support professional participation and cancellation. |
| Chat | Implemented with manual refresh | No realtime Reverb integration; conversation must be found in the general conversation list. |
| Receive review | Implemented | Received reviews appear in `/reviews/me`; public professional profiles expose professional reviews. |

### Admin journey

| Area | Status | Evidence and limitations |
|---|---|---|
| Dashboard | Implemented | Real KPI API, loading/empty/error states, and responsive cards. |
| Users | Backend only | Dashboard action and sidebar item are placeholders. |
| Reports | Backend only | Dashboard action and sidebar item are placeholders. |
| Disputes | Backend only | Dashboard action and sidebar item are placeholders. |
| Verifications | Backend only | Sidebar is a placeholder; no document review UI. |
| Categories/skills | Backend only | Both sidebar items are placeholders. |

### Implemented frontend screens

Authentication and public marketplace:

- `/login`
- `/register`
- `/professionals`
- `/professionals/{professionalProfile}`

Client:

- `/client`
- `/client/service-requests/create`
- `/client/service-requests/{serviceRequest}`

Professional:

- `/professional`
- `/professional/jobs`
- `/professional/jobs/{serviceRequest}`
- `/professional/proposals`

Shared authenticated:

- `/contracts`
- `/contracts/{contract}`
- `/conversations`
- `/conversations/{conversation}`
- `/notifications`
- `/reviews/me`

Admin:

- `/admin`

### Backend coverage with frontend usage

The following groups have meaningful frontend integration:

- Auth: register, login, logout, current user.
- Lookups: categories, skills, provinces, cities.
- Professional directory: list, detail, public reviews.
- Client requests: create, attachment upload, list recent requests, detail, cancel, view proposals.
- Professional jobs/proposals: browse jobs, submit/view/withdraw proposals.
- Proposal decisions: accept and reject.
- Contracts: list, detail, logs, complete, cancel.
- Conversations: list, detail, messages, attachments, read, archive.
- Notifications: list, mark one/all read, delete.
- Reviews: create and list own reviews.
- Favorites: add and remove.
- Professional dashboard: profile read, summary, invitations read.
- Admin dashboard: KPI summary.

### Production-readiness strengths

- API responses consistently use the `ApiResponse` envelope in audited routes.
- Most write endpoints use Form Requests and Portuguese top-level messages.
- Backend authorization checks exist for contract, proposal, conversation, review, report, dispute, and admin workflows.
- Most frontend pages implement initial loading, empty, API error, retry, and mutation feedback states.
- Tailwind layouts are mobile-first, use responsive grids, horizontal tab overflow, and a mobile navigation drawer.
- Service request and chat uploads validate supported extensions and 20 MB limits client-side and server-side.
- Notification generation is covered for proposals, contracts, chat, reviews, disputes, and verification actions.
- `/up` health route exists.

## Missing

### Missing frontend screens and workflows

Client:

- Full “Meus pedidos” list; the sidebar entry is inactive and only four recent requests appear on the dashboard.
- Edit request form despite an implemented PATCH API.
- Attachment deletion and replacement UI.
- Invite-professional flow from a request or professional profile.
- Favorites list and correct initial favorite state.
- User profile, location, and password settings.
- Report creation/history/detail UI.
- Dispute creation/list/detail, evidence, and dispute messaging UI.

Professional:

- Profile creation onboarding. This blocks the first proposal for every newly registered professional.
- Profile editing, category and skill assignment.
- Availability editing.
- Portfolio list/create/delete management.
- Verification status and BI/NUIT document upload.
- Invitation list actions; dashboard cards are display-only and decline is not wired.
- User profile, location, and password settings.
- Report and dispute workflows.

Admin:

- User list/detail, filters, edit, suspend, reactivate, and block screens.
- Category and skill management screens.
- Reports list/detail/review/resolve/dismiss screens.
- Disputes list/detail/assign/resolve screens.
- Professional verification queue/detail/approve/reject screens.

Shared/authentication:

- Forgot/reset password flow; the current login button has no action.
- Phone/email ownership verification.
- Dedicated 403, 404, 500, and maintenance pages.
- Notification detail/action routing based on notification data.
- Direct contract-to-conversation navigation.
- Frontend tests for components, API interactions, permissions, and complete journeys.

### Implemented backend endpoints with no frontend usage

User settings:

- `GET /api/v1/users/me`
- `PATCH /api/v1/users/me`
- `PATCH /api/v1/users/me/location`
- `PATCH /api/v1/users/me/password`

Service requests:

- `PATCH /api/v1/service-requests/{serviceRequest}`
- `DELETE /api/v1/service-requests/{serviceRequest}/attachments/{attachment}`
- `POST /api/v1/service-requests/{serviceRequest}/invite`

Professional profile and operations:

- `POST /api/v1/professional/profile`
- `PATCH /api/v1/professional/profile`
- `POST /api/v1/professional/categories`
- `POST /api/v1/professional/skills`
- `PATCH /api/v1/professional/availability`
- `POST /api/v1/professional/invitations/{invitation}/decline`
- `GET /api/v1/professional/portfolio`
- `POST /api/v1/professional/portfolio`
- `DELETE /api/v1/professional/portfolio/{portfolioItem}`
- `GET /api/v1/professional/verification`
- `GET /api/v1/professional/documents`
- `POST /api/v1/professional/documents`
- `GET /api/v1/professional/documents/{document}`

Favorites and individual resources:

- `GET /api/v1/favorites`
- `GET /api/v1/notifications/{notification}`
- `GET /api/v1/reviews/{review}`

Reports:

- `POST /api/v1/reports`
- `GET /api/v1/reports/me`
- `GET /api/v1/reports/{report}`

Disputes:

- `POST /api/v1/disputes`
- `GET /api/v1/disputes`
- `GET /api/v1/disputes/{dispute}`
- `POST /api/v1/disputes/{dispute}/evidence`
- `GET /api/v1/disputes/{dispute}/evidence`
- `GET /api/v1/disputes/{dispute}/messages`
- `POST /api/v1/disputes/{dispute}/messages`

Admin, excluding the integrated dashboard:

- All admin users endpoints.
- All admin categories endpoints.
- All admin skills endpoints.
- All admin reports endpoints.
- All admin disputes endpoints.
- All admin verification endpoints.

### Backend/frontend mismatches

1. **Professional registration dead end.** Registration allows a professional account, but no UI calls `POST /professional/profile`; proposal authorization requires that profile.
2. **Contract hand-off is stale.** Proposal acceptance returns a contract and conversation, but the client UI says contract details are “coming soon” even though `/contracts/{id}` exists.
3. **Chat hand-off is missing.** Contract resources do not expose a conversation ID, list cards conditionally check a field the backend never returns, and contract detail always displays a chat placeholder.
4. **List resources cause browser N+1 calls.** Proposal lists omit the message, contract lists omit participant names, and conversation lists omit last message/unread count. The frontend performs one detail/messages request per row.
5. **Conversation history is not paginated server-side.** The backend returns the entire message history; the frontend only slices it after download.
6. **Status filters are page-local.** Professional proposals, contracts, and own reviews filter only the currently loaded server page, so totals and empty results can be misleading.
7. **Grouped notification pagination is synthetic.** Proposal/contract/verification tabs merge independently paginated API calls; page boundaries and per-page counts are not globally correct.
8. **Cancellation reasons are discarded.** Client request and contract modals collect/send a reason, but their backend Form Requests have no reason rule and controllers do not persist it.
9. **Favorite state is not loaded.** The button starts as not-favorite because `GET /favorites` is unused; an already-favorited profile requires a conflict response before the UI corrects itself.
10. **Admin quick actions are not links.** They only display “available when implemented” notices.
11. **Invitation cards are display-only.** The backend decline endpoint exists but is not connected, and no explicit accept workflow exists.
12. **Unread header indicator is static.** The global bell always shows a dot instead of reflecting actual unread state.

## Recommended before Beta

### P0 — required to open the Beta

1. Build professional profile onboarding and connect categories/skills. A new professional must be able to reach the first submitted proposal without manual API work.
2. Build the minimum admin operations: users, verification, reports, and disputes. A marketplace Beta requires moderation, identity review, and incident handling.
3. Enforce user status during login and on protected API requests. Blocked users currently lose existing tokens but can authenticate again; suspended users are not globally prevented from operating.
4. Move professional identity documents away from the public disk. Serve them through authenticated, authorized downloads or short-lived signed URLs.
5. Build user-facing reports and disputes. The backend safety system is otherwise inaccessible to clients and professionals.
6. Add a client requests index so clients can recover and manage requests beyond the four dashboard items.
7. Fix proposal acceptance to navigate directly to the new contract, and expose/link the associated conversation from the contract.
8. Add browser-level tests for the complete client journey, professional onboarding/proposal journey, and admin moderation journey.

### P1 — strongly recommended for Beta quality

1. Add request editing and attachment removal.
2. Add professional verification upload/status and admin verification review screens.
3. Add professional profile editing, portfolio, availability, and invitation actions.
4. Move status/type filters to backend queries and return correct pagination metadata.
5. Add last-message and unread aggregates to conversation list resources, participant names to contract lists, and message excerpts to proposal lists.
6. Paginate conversation messages on the backend with cursor pagination or stable chronological pagination.
7. Load favorite state and add a favorites screen.
8. Replace inert navigation items and placeholder actions with real links or hide them.
9. Add password recovery and either phone OTP or email verification before treating new accounts as trusted/active.
10. Standardize Portuguese validation messages; `.env.example` currently defaults `APP_LOCALE=en`.

## Recommended before Production

### Security and authentication

- Prefer Sanctum's first-party SPA cookie flow for the browser, or document and mitigate the XSS risk of bearer tokens stored in `localStorage`.
- Make frontend authorization depend on a validated `/auth/me` response. `useProtectedSession` trusts stored user data and does not recover a user when a valid token exists without cached user data.
- On every 401, clear both token and cached user and redirect centrally to login.
- Add rate limits for login, registration, uploads, messages, proposals, reports, and disputes. No explicit throttling is configured on audited API routes.
- Add audit logs for admin changes, verification decisions, suspensions/blocks, report decisions, and dispute resolutions.
- Review authorization through policies or a consistent centralized authorization layer; current checks are distributed across Form Requests and controllers.

### File storage and uploads

- Use private object storage for identity documents and potentially contract/chat attachments.
- Add authorized download endpoints or signed URLs, malware scanning, content-type inspection, quotas, retention rules, and orphan cleanup.
- Configure MinIO/S3, lifecycle policies, backups, and restore testing. Current code explicitly stores uploads on the local `public` disk.

### Reliability and operations

- Provide production environment templates/runbooks: `APP_ENV=production`, `APP_DEBUG=false`, Portuguese locale, HTTPS URLs, real mail, Redis cache/queue, private object storage, and non-log broadcasting.
- Configure and supervise queue workers, failed-job monitoring, retries, and after-commit behavior.
- Add error monitoring, structured logs, alerting, uptime checks beyond `/up`, performance monitoring, and backup monitoring.
- Add database backups with tested restore procedures and documented rollback/deployment steps.
- Add custom Inertia error pages for 403/404/500/503.
- Run `php artisan optimize` during deployment and define cache invalidation/restart procedures.

### Performance and scalability

- Remove browser-side N+1 request patterns and unbounded chat downloads.
- Add response/query performance tests for directories, dashboards, conversations, notifications, and admin queues.
- Introduce code splitting; the production build currently warns that a JavaScript chunk exceeds 500 kB.
- Review indexing and search strategy before catalogue growth; current marketplace filtering is database-backed despite Meilisearch being a target service.

### Quality assurance

- Add frontend unit/component tests and browser tests on phone, tablet, and desktop viewports.
- Add accessibility checks for keyboard navigation, focus traps, screen-reader names, contrast, reduced motion, and form errors.
- Test offline/slow-network behavior, expired sessions, malformed/non-JSON 5xx responses, partial uploads, and double submissions.
- Add dependency audits to CI. The local npm and Composer advisory checks could not complete because registry DNS/network access was unavailable during this audit.

### API client and error handling

- Add request timeouts and optional cancellation/retry policy for safe GET requests.
- Handle empty or non-JSON error responses in the API client; it currently assumes every response can be parsed as the standard JSON envelope.
- Introduce a consistent toast/action feedback system and a React error boundary.
- Ensure mutation buttons remain idempotent or protected against repeated requests at the backend.

## Critical Issues

| Severity | Issue | Impact |
|---|---|---|
| Critical | Professional profile creation has no frontend | Newly registered professionals cannot submit proposals, breaking the supply-side activation funnel. |
| Critical | Admin management/moderation screens are absent | Users, reports, disputes, and verifications cannot be operated through the product. |
| Critical | Blocked/suspended status is not enforced at authentication/global middleware | A blocked user can log in again after tokens are deleted; enforcement is inconsistent by endpoint. |
| Critical | Verification documents use public storage URLs | BI/NUIT identity files are accessible through public URLs if discovered or leaked. |
| High | Reports and disputes have no user frontend | Safety and contract-resolution workflows cannot be initiated or followed by marketplace participants. |
| High | Contract-to-chat and post-accept navigation are broken/inaccurate | The main client journey requires manual navigation and displays stale “coming soon” messaging. |
| High | Conversation list/history design is unbounded and N+1 | Bandwidth and latency grow rapidly with real chat history and conversation counts. |
| High | No frontend/E2E journey tests | Backend tests cannot detect broken links, local-storage guard issues, modal failures, or mobile regressions. |
| High | No API throttling | Authentication, messaging, uploads, reports, and other write endpoints are exposed to abuse. |
| Medium | Page-local and synthetic filters produce inaccurate results | Users can see false empty states and inconsistent pagination. |
| Medium | Local-storage session and guard state can become stale | 401 responses clear only the token, while cached user/role state can remain and shared layouts trust it. |

## Nice to Have

- Realtime chat and notification updates through Reverb after the manual-refresh Beta is stable.
- Notification deep links based on `notification.data`.
- Saved searches, recent searches, and professional/job recommendations.
- Better invitation acceptance UX and client-professional contact initiation.
- Review detail pages and richer reputation summaries.
- Draft requests and autosave.
- Image previews, upload progress, compression, and drag-and-drop.
- PWA/offline shell and push notifications.
- Analytics funnels for registration, profile completion, proposal acceptance, completion, and review conversion.
- Dark mode and user accessibility preferences.
- Payment boundary placeholders for future M-Pesa/e-Mola only; real payments remain intentionally out of scope.

## Verification results

- `php artisan test`: passed — 239 tests, 1,063 assertions.
- `npm run build`: passed — 641 modules transformed; Vite reported a non-fatal warning for a 514.18 kB JavaScript chunk exceeding 500 kB.
- `npm audit`: unavailable; registry request failed because network/DNS access was unavailable.
- `composer audit`: unavailable; Packagist DNS resolution failed.
