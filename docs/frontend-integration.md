# Tempo Connect Frontend Integration Blueprint

This blueprint maps the Tempo Connect mobile and web experiences to the current `/api/v1` API. The canonical wire contract remains [`openapi.yaml`](./openapi.yaml); the Postman files under `docs/postman` provide executable examples.

## 1. Integration conventions

- Base URL: configure per environment and append `/api/v1`, for example `http://localhost/api/v1`.
- Media type: send `Accept: application/json`. Send `Content-Type: application/json` for JSON bodies; allow the browser or mobile HTTP library to set the multipart boundary for uploads.
- Authentication: protected endpoints use `Authorization: Bearer <token>`.
- Language: display API messages as returned because user-facing messages are in Portuguese.
- Dates: API timestamps are ISO 8601 strings. Parse them into a date abstraction at the UI boundary and render in `Africa/Maputo` unless the product introduces a user timezone preference.
- Money: contract and proposal amounts can arrive as decimal strings. Keep them as strings or use a decimal library; do not use binary floating-point arithmetic for totals.
- IDs: treat IDs as numbers in application state and strings only while interpolating URLs.
- Source of truth: resource state comes from the API. Optimistic updates should be limited to reversible interactions such as marking notifications as read.

## 2. Recommended application layers

```text
src/
  app/
    navigation/             # route definitions and role guards
    providers/              # auth, query/cache, error and locale providers
  api/
    client.ts               # transport, base URL, headers and envelope parsing
    errors.ts               # ApiError normalization
    pagination.ts           # pagination helpers
    uploads.ts              # FormData builders and upload progress
    generated/              # optional code generated from OpenAPI
  modules/
    auth/
    users/
    lookups/
    professionals/
    serviceRequests/
    proposals/
    contracts/
    chat/
    notifications/
    reviews/
    reports/
    disputes/
    admin/
  shared/
    components/
    hooks/
    types/
    validation/
```

Each module should own its API functions, query keys, mutations, screen components, presentation components, and module-specific types. Shared transport code must not contain business rules.

Suggested module contract:

```text
modules/serviceRequests/
  api.ts                    # list, show, create, update, cancel, attachments
  keys.ts                   # stable cache/query keys
  types.ts
  validation.ts
  hooks/
    useServiceRequests.ts
    useCreateServiceRequest.ts
  screens/
  components/
```

If the project adopts TanStack Query or an equivalent server-state library, use it for caching, request deduplication, invalidation, retries, and paginated queries. Keep authentication/session state in a small dedicated store rather than the server-state cache.

## 3. API client structure

```ts
type RequestOptions = {
  signal?: AbortSignal;
  query?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
};

interface TokenStore {
  get(): Promise<string | null>;
  set(token: string): Promise<void>;
  clear(): Promise<void>;
}

interface ApiClient {
  get<T>(path: string, options?: RequestOptions): Promise<T>;
  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
  patch<T>(path: string, body: unknown, options?: RequestOptions): Promise<T>;
  delete<T>(path: string, options?: RequestOptions): Promise<T>;
  upload<T>(path: string, form: FormData, options?: RequestOptions): Promise<T>;
}
```

The transport should perform these steps centrally:

1. Join the configured base URL and endpoint path safely.
2. Add `Accept: application/json` and the bearer token when available.
3. Serialize query parameters without emitting empty or `undefined` values.
4. Serialize JSON bodies, but leave `FormData` untouched.
5. Parse the `ApiResponse` envelope.
6. Return `data` for successful calls.
7. Convert non-success responses into a typed `ApiError`.
8. On `401`, clear the local session once and redirect to sign-in without creating redirect loops.
9. Respect `AbortSignal` so navigation and search requests can be cancelled.

Do not let individual screens concatenate authorization headers, decode error envelopes, or construct multipart boundaries.

## 4. Authentication flow

### Registration

1. User chooses `client` or `professional`.
2. Submit `POST /auth/register` with name, phone, optional email, password, password confirmation, and user type.
3. Persist `data.token` using the platform token store.
4. Store `data.user` as the initial session user.
5. Route clients to the client home screen.
6. Route professionals without a profile to professional onboarding (`POST /professional/profile`).

### Sign-in

1. Submit `POST /auth/login` with email or phone in `identifier` and the password.
2. Persist `data.token`.
3. Load or confirm the session with `GET /auth/me`.
4. Build navigation from `user_type` and assigned role information returned by the API.
5. Preserve an internal intended route and return to it only after verifying the user has access.

### Session restoration

1. Read the token from the platform token store during application bootstrap.
2. If absent, show the public navigation immediately.
3. If present, call `GET /auth/me` before rendering protected navigation.
4. On success, hydrate the session and role navigation.
5. On `401`, clear the token, cached private data, and any realtime connection, then show sign-in.
6. On a transient network failure, retain the token and show an offline/retry state rather than signing the user out.

### Sign-out

1. Call `POST /auth/logout` when online.
2. Clear the token and all user-scoped caches whether the request succeeds or fails.
3. Disconnect chat/realtime clients.
4. Reset navigation to public routes.

The current API has no refresh-token endpoint. A `401` therefore ends the local session and requires a new login.

## 5. Token storage strategy

### Native mobile

- Store the Sanctum token in iOS Keychain or Android Keystore through the framework's secure-storage adapter.
- Never place the token in AsyncStorage, SQLite, logs, crash metadata, analytics events, URLs, or notification payloads.
- Keep a memory copy only while the authenticated application is running.
- Clear secure storage on logout, account block, or unrecoverable `401`.
- Protect screen snapshots where sensitive dispute or identity documents are displayed if supported by the platform.

### Web SPA

- Prefer an in-memory token for the active tab.
- If reload persistence is essential with the current bearer API, use `sessionStorage`, accept that XSS can still read it, and enforce a strict Content Security Policy. Do not use `localStorage` for long-lived tokens.
- Never interpolate the token into HTML, query strings, error reports, or browser logs.
- A future web-specific backend-for-frontend using Secure, HttpOnly, SameSite cookies would provide stronger protection, but it requires a deliberate server-side authentication change and is not assumed here.

### Inertia web application

If the web client uses Laravel session authentication through Inertia, keep that session transport separate from this bearer API client. Do not mix a session cookie and a bearer token implicitly. Choose one transport per frontend surface and test authorization boundaries independently.

## 6. Screen-to-endpoint map

Legend: **Public** requires no token; **Auth** requires a valid token; **Admin** additionally requires `admin` or `super_admin`.

### Public and authentication screens

| Screen | Access | Initial data | Mutations and follow-up |
|---|---|---|---|
| Launch/session gate | Public/Auth | `GET /auth/me` when a token exists | Clear invalid session on `401` |
| Sign in | Public | None | `POST /auth/login`; save token; `GET /auth/me` |
| Register | Public | None | `POST /auth/register`; save token |
| Public home/search | Public | `GET /categories`, `GET /skills`, `GET /professionals` | Apply search/filter query parameters |
| Location selector | Public | `GET /locations/provinces`; `GET /locations/cities?province=...` | Store selected values in the active form |
| Professional directory | Public | `GET /professionals` | Paginate and filter by query, category, skill, province, and city |
| Professional detail | Public | `GET /professionals/{professionalProfile}`; `GET /professionals/{professionalProfile}/reviews` | Authenticated users may add/remove favorite |
| Public service-request detail | Public | `GET /service-requests/{serviceRequest}` | Sign-in gate before proposal or invitation actions |

### Shared authenticated screens

| Screen | Access | Initial data | Mutations and follow-up |
|---|---|---|---|
| Account/profile | Auth | `GET /users/me` | `PATCH /users/me`; invalidate `/auth/me` and `/users/me` |
| Edit location | Auth | `GET /users/me`; public location lookups | `PATCH /users/me/location` |
| Change password | Auth | None | `PATCH /users/me/password`; clear form on success |
| Notification centre | Auth | `GET /notifications` | `POST /notifications/{notification}/read`, `POST /notifications/read-all`, `DELETE /notifications/{notification}` |
| Notification detail | Auth | `GET /notifications/{notification}` | Mark as read before routing to the linked resource |
| Conversation list | Auth | `GET /conversations` | Refresh or merge realtime conversation updates |
| Conversation detail | Auth | `GET /conversations/{conversation}`; `GET /conversations/{conversation}/messages` | `POST .../messages`, `POST .../read`, `POST .../archive` |
| Message attachment composer | Auth | Existing message ID | `POST /messages/{message}/attachments` |
| Contract list | Auth | `GET /contracts` | Filter by status and paginate |
| Contract detail | Auth | `GET /contracts/{contract}`; `GET /contracts/{contract}/logs` | Role/state-dependent complete, cancel, review, or dispute actions |
| Reviews involving me | Auth | `GET /reviews/me` | Open `GET /reviews/{review}` |
| Submit review | Auth | Contract detail | `POST /reviews`; invalidate contract, reviews, and professional detail |
| My reports | Auth | `GET /reports/me` | Open `GET /reports/{report}` |
| Create report | Auth | Target resource context | `POST /reports` with exactly one target matching `report_type` |
| Dispute list | Auth | `GET /disputes` | Paginate; invalidate when dispute messages change |
| Dispute detail | Auth | `GET /disputes/{dispute}`, `GET .../evidence`, `GET .../messages` | Upload evidence and send messages |
| Open dispute | Auth | Eligible contract detail | `POST /disputes`; invalidate contract and dispute lists |

### Client screens

| Screen | Required endpoints | Notes |
|---|---|---|
| Client home | `GET /client/service-requests`, `GET /contracts`, `GET /notifications` | Fetch independent widgets concurrently; do not block the page on an optional widget failure. |
| My service requests | `GET /client/service-requests` | Filter by status; use server pagination. |
| Marketplace requests | `GET /service-requests` | Authenticated listing used when appropriate for the product experience. |
| Create service request | `GET /categories`, location lookups, `POST /service-requests` | After creation, route to the returned request detail. |
| Edit service request | `GET /service-requests/{id}`, `PATCH /service-requests/{id}` | Disable mutation controls when state no longer permits edits. |
| Request attachments | `POST /service-requests/{id}/attachments`, `DELETE /service-requests/{id}/attachments/{attachment}` | Queue uploads individually or as the API's `files[]` array. |
| Cancel request | `POST /service-requests/{id}/cancel` | Require confirmation and show a `409` state conflict inline. |
| Invite professional | `GET /professionals`, `POST /service-requests/{id}/invite` | Disable duplicate invitation actions after success. |
| Compare proposals | `GET /service-requests/{id}/proposals`, `GET /proposals/{proposal}` | Preserve request context when opening proposal detail. |
| Proposal decision | `POST /proposals/{proposal}/accept`, `POST /proposals/{proposal}/reject` | Acceptance creates/returns contract state; invalidate requests, proposals, contracts, and conversations. |
| Favorite professionals | `GET /favorites` | Add with `POST /favorites`; remove with `DELETE /favorites/{professionalProfile}`. |
| Complete/cancel contract | `POST /contracts/{contract}/complete`, `POST /contracts/{contract}/cancel` | Render controls from role and contract status, but rely on server authorization. |

### Professional screens

| Screen | Required endpoints | Notes |
|---|---|---|
| Professional onboarding | `POST /professional/profile`, `POST /professional/categories`, `POST /professional/skills` | Save profile first, then taxonomy selections. Resume safely after partial completion. |
| Professional profile | `GET /professional/profile` | Public preview uses `GET /professionals/{professionalProfile}`. |
| Edit professional profile | `PATCH /professional/profile` | Refresh public profile cache after success. |
| Categories and skills | `GET /categories`, `GET /skills?category_id=...`, assignment endpoints | Category selection is limited to five by the API. |
| Availability | `PATCH /professional/availability` | Values: available, busy, away, vacation, unavailable. |
| Portfolio | `GET /professional/portfolio` | Create with multipart `POST /professional/portfolio`; delete with `DELETE /professional/portfolio/{portfolioItem}`. |
| Verification centre | `GET /professional/verification`, `GET /professional/documents` | Upload with `POST /professional/documents`; inspect with `GET /professional/documents/{document}`. |
| Service marketplace | `GET /service-requests`, `GET /service-requests/{id}` | Only show proposal action when the professional has an active profile. |
| Submit proposal | `POST /proposals` | Use amount as a decimal input and delivery days as an integer. |
| My proposals | `GET /professional/proposals` | Open `GET /proposals/{proposal}`; withdraw via `POST /proposals/{proposal}/withdraw`. |
| Invitations | `GET /professional/invitations` | Decline with `POST /professional/invitations/{invitation}/decline`; navigate to the linked request to propose. |
| Professional contracts | `GET /contracts`, `GET /contracts/{contract}` | Shared contract, chat, review, report, and dispute screens apply. |

### Administrator screens

All administrator screens must be hidden from other roles and guarded at the route level. The server remains the authorization authority.

| Screen | Required endpoints | Mutations |
|---|---|---|
| Admin dashboard | `GET /admin/dashboard` | Refresh counts after management mutations. |
| User management | `GET /admin/users` | Filters: `user_type`, `status`, `q`, and `page`. |
| User detail/edit | `GET /admin/users/{user}` | `PATCH /admin/users/{user}` |
| User state actions | User detail | `POST .../suspend`, `POST .../reactivate`, `POST .../block` |
| Category management | `GET /admin/categories` | `POST /admin/categories`, `PATCH /admin/categories/{category}`, `DELETE .../{category}` |
| Skill management | `GET /admin/skills` | `POST /admin/skills`, `PATCH /admin/skills/{skill}`, `DELETE .../{skill}` |
| Verification queue | `GET /admin/verifications` | Filter by verification status. |
| Verification detail | `GET /admin/verifications/{professionalProfile}` | `POST .../approve`, `POST .../reject` |
| Report queue | `GET /admin/reports` | Filter by status and report type. |
| Report detail | `GET /admin/reports/{report}` | `POST .../review`, `POST .../resolve`, `POST .../dismiss` |
| Dispute queue | `GET /admin/disputes` | Filter by status. |
| Dispute detail | `GET /admin/disputes/{dispute}` | `POST .../assign`, `POST .../resolve` |

## 7. Role-based navigation

### Client

Primary navigation:

- Início
- Pedidos
- Profissionais
- Contratos
- Mensagens
- Notificações
- Perfil

Contextual actions include creating service requests, inviting professionals, accepting/rejecting proposals, completing contracts, reviewing professionals, reporting content, and opening disputes.

### Professional

Primary navigation:

- Início
- Oportunidades
- Propostas
- Contratos
- Mensagens
- Notificações
- Perfil profissional

Profile navigation includes availability, categories, skills, portfolio, documents, and verification. Incomplete professional onboarding should redirect protected professional actions to the next required onboarding step.

### Admin and super admin

Primary navigation:

- Painel
- Utilizadores
- Categorias
- Competências
- Verificações
- Denúncias
- Disputas

Do not infer authorization from `user_type` alone if role data is available. Admin navigation requires the `admin` or `super_admin` role. A direct URL visit must still pass a frontend guard and will be independently enforced by the API.

## 8. Error handling strategy

Normalize all API failures into this frontend shape:

```ts
interface ApiError {
  status: number;
  message: string;
  errors: Record<string, string[]>;
  isNetworkError: boolean;
  requestId?: string;
}
```

Handling rules:

- `401`: clear authenticated state and redirect to sign-in. Do this once globally.
- `403`: keep the session, show the Portuguese server message, and route away only if the screen itself is forbidden.
- `404`: show a resource-not-found state with a safe route back to the relevant list.
- `409`: refresh the affected resource because its workflow state changed; display the conflict message beside the action.
- `422`: map `errors[field]` to controls. Preserve non-field errors in a form-level alert.
- `429`: retain form data, show a retry delay when available, and prevent rapid resubmission.
- `5xx`: show a retryable service error, preserve unsent form/upload state, and report sanitized diagnostics.
- Network/offline: distinguish from server errors; allow retry and show cached read-only data where safe.

Never show a successful optimistic state until a state-changing marketplace workflow has been accepted by the server. Log status, endpoint, and a correlation ID if available, but redact tokens, passwords, message bodies, identity documents, and dispute evidence.

## 9. Pagination handling

Paginated responses expose:

```ts
interface Pagination {
  current_page: number;
  per_page: number;
  last_page: number;
  total: number;
}
```

- Web tables: reflect `page` and filters in the URL so navigation and sharing preserve state.
- Mobile lists: use `current_page < last_page` to decide whether to fetch the next page.
- Replace results when filters or search terms change; append only for the same normalized filter set.
- Deduplicate appended records by ID.
- Cancel stale searches and debounce text queries.
- Reset to page 1 after create/delete/state transitions that can change list membership.
- Invalidate both detail and list caches after mutations.
- Do not derive `last_page` from `total`; use server pagination metadata.

## 10. Upload handling

Supported evidence and attachment formats are JPG, JPEG, PNG, WebP, and PDF, with a maximum size of 20 MB per file. Service-request attachments accept up to ten files.

```ts
function buildSingleFileForm(file: File, description?: string): FormData {
  const form = new FormData();
  form.append('file', file);
  if (description) form.append('description', description);
  return form;
}

function buildAttachmentForm(files: File[]): FormData {
  const form = new FormData();
  files.forEach((file) => form.append('files[]', file));
  return form;
}
```

- Validate extension, MIME type, count, and size before sending, but treat server validation as authoritative.
- Do not manually set multipart `Content-Type`; the transport must include the generated boundary.
- Show per-file progress, cancellation, failure, and retry state where the HTTP adapter supports progress events.
- Preserve selected files after recoverable failures.
- Strip local file paths from telemetry.
- For document/evidence downloads, use authenticated requests if the returned URL is not public.
- Mobile clients should copy temporary camera/gallery assets into an application-controlled cache until upload finishes.

## 11. TypeScript contracts

These interfaces model the main wire resources. Generated OpenAPI types may replace them, but avoid maintaining generated and handwritten definitions for the same resource.

```ts
export type UserType = 'client' | 'professional' | 'admin';
export type UserStatus = 'pending' | 'active' | 'inactive' | 'suspended' | 'blocked';
export type ContractStatus = 'active' | 'completed' | 'cancelled' | 'disputed';
export type ReportStatus = 'pending' | 'reviewing' | 'resolved' | 'dismissed';
export type DisputeStatus = 'pending' | 'under_review' | 'resolved' | 'dismissed';

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiFailure {
  success: false;
  message: string;
  errors: Record<string, string[]>;
}

export type PaginatedData<K extends string, T> = {
  pagination: Pagination;
} & {
  [P in K]: T[];
};

export interface User {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  user_type: UserType;
  status: UserStatus;
  province?: string | null;
  city?: string | null;
  created_at?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  status: 'active' | 'inactive';
}

export interface Skill {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  description: string | null;
  status: 'active' | 'inactive';
  category?: Category;
}

export interface ProfessionalProfile {
  id: number;
  user_id: number;
  headline: string;
  bio: string;
  experience_years: number;
  base_price: string | null;
  price_type: 'hourly' | 'fixed' | 'negotiable';
  province: string;
  city: string;
  verification_status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'expired';
  availability: 'available' | 'busy' | 'away' | 'vacation' | 'unavailable';
  average_rating: string;
  total_reviews: number;
  user?: User;
  categories?: Category[];
  skills?: Skill[];
}

export interface ServiceRequest {
  id: number;
  client_id: number;
  category_id: number;
  title: string;
  description: string;
  service_type: 'local' | 'remote' | 'hybrid';
  budget_min: string | null;
  budget_max: string | null;
  budget_type: 'fixed' | 'hourly' | 'negotiable';
  province: string | null;
  city: string | null;
  deadline_at: string | null;
  visibility: 'public' | 'private' | 'invited_only';
  status: 'draft' | 'published' | 'receiving_proposals' | 'in_progress' | 'completed' | 'cancelled';
  category?: Category;
  client?: User;
}

export interface Proposal {
  id: number;
  service_request_id: number;
  professional_profile_id: number;
  amount: string;
  delivery_days: number | null;
  message: string | null;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn' | 'expired';
  created_at: string;
}

export interface Contract {
  id: number;
  service_request_id: number;
  proposal_id: number;
  client_id: number;
  professional_profile_id: number;
  amount: string;
  platform_fee: string;
  professional_amount: string;
  status: ContractStatus;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
}

export interface Conversation {
  id: number;
  service_request_id: number;
  client_id: number;
  professional_profile_id: number;
  status: 'active' | 'archived';
  last_message_at: string | null;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  message: string;
  read_at: string | null;
  created_at: string;
}

export interface Notification {
  id: number;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
}

export interface Review {
  id: number;
  contract_id: number;
  reviewer_id: number;
  reviewed_id: number;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface Report {
  id: number;
  reporter_id: number;
  reported_user_id: number | null;
  service_request_id: number | null;
  contract_id: number | null;
  report_type: 'user' | 'service_request' | 'contract' | 'message' | 'review';
  reason: 'fraud' | 'abuse' | 'fake_profile' | 'inappropriate_content' | 'service_not_delivered' | 'spam' | 'other';
  description: string | null;
  status: ReportStatus;
  reviewed_by: number | null;
  reviewed_at: string | null;
  resolution_note: string | null;
}

export interface DisputeEvidence {
  id: number;
  dispute_id: number;
  uploaded_by: number;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  file_url: string;
  description: string | null;
  created_at: string;
}

export interface DisputeMessage {
  id: number;
  dispute_id: number;
  sender_id: number;
  message: string;
  created_at: string;
}

export interface Dispute {
  id: number;
  contract_id: number;
  opened_by: number;
  assigned_to: number | null;
  reason: string;
  description: string | null;
  status: DisputeStatus;
  resolution: 'favor_client' | 'favor_professional' | 'mutual_agreement' | 'dismissed' | null;
  resolution_note: string | null;
  resolved_at: string | null;
  evidence?: DisputeEvidence[];
  messages?: DisputeMessage[];
}
```

## 12. Cache invalidation and realtime readiness

- Scope private cache keys by authenticated user ID and clear them completely on logout.
- After accepting a proposal, invalidate the service request, proposal lists, contract lists, conversation lists, and notifications.
- After contract completion/cancellation/dispute, invalidate contract detail/list, logs, service request detail, reviews, disputes, and dashboard widgets.
- After report/dispute admin actions, invalidate both admin queues and the affected detail.
- Realtime events from Laravel Reverb should update or invalidate the same keys used by HTTP queries rather than maintaining a parallel data model.
- Always reconcile realtime payloads with a subsequent API fetch for authorization-sensitive or workflow-critical state.

## 13. Delivery sequence

1. Implement the typed API client, token stores, error normalization, and session bootstrap.
2. Implement lookups and public professional/service discovery.
3. Implement client service-request and proposal workflows.
4. Implement professional onboarding, marketplace, and proposal workflows.
5. Implement shared contracts, conversations, notifications, reviews, reports, and disputes.
6. Add realtime updates after the HTTP flows are stable.
7. Implement the admin surface as a separately guarded navigation tree.
8. Generate contract tests from `docs/openapi.yaml` and run end-to-end role journeys against a seeded environment.
