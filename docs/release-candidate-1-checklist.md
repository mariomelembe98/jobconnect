# ProConnect Release Candidate 1 Checklist

## 1. Current readiness

### Backend

- Auth hardening is complete for suspended and blocked users.
- Active-user middleware protects authenticated API groups.
- Rate limiting is applied to high-risk write paths.
- Activity logs are stored for critical writes and moderation actions.
- Verification documents are stored privately and downloaded through a secure route.

### Frontend

- Public landing page is available.
- Public Help, Terms, and Privacy pages are available.
- Account settings page is available.
- Client, professional, contract, chat, notifications, reviews, reports, and disputes screens are available.
- Route-level code splitting is in place.

### Admin

- Dashboard, users, verifications, reports, disputes, and activity logs screens are available.
- Admin observability is now available through activity logs.

### Security

- Suspended and blocked users cannot log in.
- Protected API routes reject suspended or blocked sessions.
- Verification documents are not publicly exposed.
- High-risk endpoints are rate limited.
- Sensitive writes are audited.

### Tests

- Current test count: 282.
- Current assertion count: 1344.
- Backend feature coverage is broad across auth, journeys, moderation, audit logging, and rate limiting.

### Performance

- Bundle splitting has been resolved.
- Initial application bundle remains below the 300 KB target.
- Shared route bundles are loaded lazily on demand.

## Verdict

RC1 is ready for tagging after the remaining operational tasks below are completed.

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
- Public landing page
- Account settings page
- Help page
- Terms page
- Privacy page
- Activity Logs admin UI

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
- Landing page refinement and conversion copy.
- Payment placeholders or M-Pesa/eMola roadmap.
- Monitoring and alerts.
- Legal pages final review.

## 5. Manual QA checklist

### Client journey

- Register and log in.
- Open the landing page and Help pages.
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
