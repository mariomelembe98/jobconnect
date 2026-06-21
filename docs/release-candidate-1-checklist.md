# ProConnect — Release Candidate 1 Checklist

## 1. Current readiness

### Backend

- Auth endpoints hardened for suspended and blocked users.
- Active-user middleware is applied to protected API groups.
- Rate limiting is in place for high-risk endpoints.
- Activity logging exists for critical writes and moderation actions.
- Private verification document storage and secure download are implemented.
- Core marketplace APIs are available for clients, professionals, and admins.

### Frontend

- Core marketplace dashboards are implemented.
- Client request management flows are implemented.
- Professional onboarding, profile management, jobs, and proposals are implemented.
- Contracts, chat, notifications, reports, disputes, and reviews screens exist.
- Admin moderation screens exist for users, verifications, reports, disputes, and activity logs.
- Route-level code splitting is in place.

### Admin

- Admin dashboard exists.
- User moderation is available.
- Verification moderation is available.
- Report moderation is available.
- Dispute moderation is available.
- Activity log auditing UI is available.

### Security

- Suspended and blocked users cannot log in.
- Existing sessions for suspended or blocked users are rejected on protected APIs.
- Verification documents are stored privately.
- Secure document download is enforced by ownership and admin access.
- High-risk endpoints are rate limited.
- Admin-only routes are protected.

### Tests

- Backend feature coverage is broad across auth, journeys, moderation, audit logging, and rate limiting.
- Frontend build and type-checking are currently part of the verification flow.
- Playwright E2E harness exists for critical marketplace journeys.

### Performance

- Route-level code splitting reduces initial bundle size.
- Shared vendor code is split into smaller chunks.
- The initial app bundle is below the 300 KB target.

## 2. RC1 completed items

- Auth hardening
- Active-user middleware
- Rate limiting
- Activity logs
- Private verification documents
- Admin moderation screens
- Client request management
- Reports/disputes frontend
- Contract-to-chat handoff
- Bundle optimization
- Playwright E2E harness

## 3. Remaining before RC1 tag

- Run Playwright in an environment with Chromium installed.
- Re-run `npm audit` and `composer audit` with internet access.
- Configure production environment variables.
- Configure queues.
- Configure scheduler.
- Configure storage permissions.
- Configure mail provider.
- Configure backups.
- Confirm SSL/domain.
- Create first admin credentials securely.

## 4. Remaining before public launch

- HttpOnly cookie auth migration.
- Realtime chat and notifications.
- Landing page.
- Payment placeholders or M-Pesa/eMola roadmap.
- Monitoring and alerts.
- Legal pages.

## 5. Manual QA checklist

### Client journey

- Register and log in.
- Create a service request.
- View request details.
- Receive proposals.
- Accept a proposal.
- Open the resulting contract.
- Open chat from contract.
- Send and receive messages.
- Complete the contract.
- Leave a review.

### Professional journey

- Register and log in.
- Create or update professional profile.
- Browse jobs.
- Submit a proposal.
- View contracts.
- Open chat from contract.
- Receive a review.

### Admin journey

- Open admin dashboard.
- Review users.
- Suspend, reactivate, and block users.
- Review verifications.
- Approve and reject verification documents.
- Review reports.
- Resolve and dismiss reports.
- Review disputes.
- Assign and resolve disputes.
- Inspect activity logs.

### Security checks

- Suspended user cannot log in.
- Blocked user cannot log in.
- Protected APIs reject suspended or blocked sessions.
- Admin-only routes reject non-admins.
- Verification documents cannot be accessed publicly.

### Upload/download checks

- Service request attachments upload correctly.
- Professional portfolio uploads correctly.
- Verification documents upload privately.
- Secure document download works for owner and admin.

### Notifications

- Notification list loads.
- Mark as read works.
- Mark all as read works.
- Delete notification works.

### Activity logs

- Audit entries appear for login and logout.
- Audit entries appear for service requests, proposals, contracts, reports, disputes, and moderation actions.
- Activity log filters and detail view work.

## 6. Go/No-Go criteria

Go for RC1 if all of the following are true:

- Core backend and frontend flows work for client, professional, and admin.
- Authentication and authorization controls are enforced.
- Critical uploads and downloads are secure.
- High-risk endpoints are rate limited.
- The test suite and build pass.
- Playwright can run successfully in CI or a similar environment.
- No open critical blockers remain in the audit.

No-Go if any of the following are true:

- Blocked or suspended users can still access protected flows.
- Verification documents are publicly accessible.
- Contract, proposal, or dispute handoffs fail.
- Admin moderation actions fail or bypass authorization.
- The build or automated test suite is failing.
- Playwright cannot execute in the target CI environment.
