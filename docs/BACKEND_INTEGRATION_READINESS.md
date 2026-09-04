# Backend integration readiness — Iteration 1

Last updated: 4 September 2026

Reviewed against:

- `Backend documentation(5).docx` (latest supplied version)
- `ReefCare_My - User Stories and Acceptance Criteria(4).docx`

This file is the handoff record for the frontend. “Frontend ready” means the
required screen, validation and typed API boundary exist. It does not mean a
story is secure or complete until the backend endpoint, database rule and
authorisation tests also pass.

## Current verdict

The documented observer flows are connected to the backend. The frontend queue
is ready to show all reports, including claimed reports, but the supplied
backend contract still returns only unclaimed reports. The project is not ready
for final acceptance testing until that queue contract and the remaining
coordinator and administrator gaps are resolved.

| Area | Current state | Next integration action |
| --- | --- | --- |
| Public guidance | Ready | No backend dependency is required for the current static content. |
| Authentication and observer registration | Partially integrated | Confirm the final login response, complete logout and test real role-bearing accounts. |
| Observer reporting and Dive Sessions | Integration-ready | Connect to the deployed API and run the complete observer submission path. |
| Observer My Reports and timeline | Integrated and paginated | Verify observer-safe response shapes and cross-account access controls against the deployed API. |
| Coordinator workspace | Partially integrated | Current-device claims can be reopened through the existing owned-case detail endpoint. Expand the queue to include claimed reports, define the claim-to-review transition, and add complete My Cases, evidence-assessment and history contracts. |
| Administrator workspace | UI ready, backend-blocked | Define account creation, directory, role/status update and access-request APIs. |

The frontend verification baseline is currently 19 passing test files
containing 73 tests, a clean TypeScript check, clean ESLint and a successful
production build that includes `/admin/users/new`.

## Readiness summary

| Story | Frontend evidence | Integration state |
| --- | --- | --- |
| US1.1 Role separation | Public, observer, coordinator and administrator route groups; `RequireRole` gates all protected groups; `/admin/users/new` allows an administrator to prepare an Observer, Case Coordinator or System Administrator account | Frontend ready. Account creation is a local preview until the administrator API exists; the backend must enforce every role dependency. |
| US1.2 Single owner | Backend queue, claim operation, owned-case detail and owner display | Integrated. Atomicity remains a backend/database responsibility and must be concurrency-tested. |
| US1.3 Sensitive information | Observer-owned detail view, coordinator-only precise-location panel, no admin case-detail route | Frontend ready. Exact-location and evidence reads must be filtered by the backend. |
| US1.4 Traceability | Decision and closure responses contain server timestamps and actor IDs | Partially integrated. A coordinator case-history projection is still needed to display complete activity. |
| US1.5 Authentication | Real login, bearer-token client, protected observer routes | Integrated for login. Logout endpoint is documented as planned and still needs backend completion. |
| US1.6 Registration | Real public observer-only registration; no role selector; 12–128 characters and at least four distinct characters; separate protected administrator account-creation form for privileged roles | Frontend registration now matches the latest backend document. Administrator provisioning is blocked by the missing administrator API. |
| US2.1 Guidance | Public `/learn` page with four threats, evidence, images and safety reminders | Complete as static frontend content; the optional guidance endpoint is not required. |
| US2.2 Capture report | Photo validation, backend threat categories, all required fields, optional depth, Unsure category, local draft persistence | Integrated through the reference and multipart submission APIs. Backend reference data must include all five form choices. |
| US2.3 Review/submit | Review summary, protected-location summary, real multipart submit and API confirmation | Integrated. The backend owns persistence, reference generation, submission time and initial Received status. |
| US4.1 Safe location | Backend Dive Session selection/creation, named site, optional interactive pin, confidence and privacy review | Integrated. Current backend contract requires `diveDate`; the UI labels and validates it as required. |
| US5.1 Queue/claim | Paginated all-reports UI with status and owner filters; atomic claim followed by owned-case loading and a visible claim confirmation | Frontend ready, backend-blocked. The documented queue is unclaimed-only and must return claimed records, `statusCode`, `owner` and `claimedAt`. |
| US5.2 Review details | Backend evidence metadata, description, optional observation time, depth and protected exact location | Integrated to the documented case response. Private evidence delivery and missing `observedAt` remain backend contract gaps. |
| US5.3 Evidence usability | Real information request with selected missing items and a combined 500-character reason | Information-request path integrated. A separate evidence-accepted transition is still missing. |
| US5.4 Response type | Monitoring, referral/share and intervention options saved through the decision endpoint | Connected for cases already in an allowed review status. A documented transition from `claimed` to `under_review` is missing. |
| US5.5 Closure | Exactly one compatible fixed reason and required public note saved through the close endpoint | Connected after a saved response decision. Not Substantiated closure is intentionally blocked until an evidence-assessment operation exists. |
| US6.1 Confirmation | Real report-reference/status/location/submission response shape and confirmation view | API tracking and confirmation boundary ready. |
| US6.2 Status tracking | Real paginated My Reports, observer-safe detail and timeline API calls | Integrated. Previous/Next controls expose reports after the first 20; labels render exactly as returned by the backend. |
| US6.3 Information request | Observer detail displays “More information needed” and the safe reason | Integrated when the backend returns `informationRequestReason`. |

## Implemented API boundary

All backend calls live in `lib/api/` and use public report references rather
than database IDs.

| Module | Endpoints |
| --- | --- |
| `authApi.ts` | login, register, logout, current user |
| `referenceApi.ts` | threat categories, named dive sites |
| `diveSessionsApi.ts` | list/create observer Dive Sessions |
| `reportsApi.ts` | multipart submit, My Reports, observer detail, timeline |
| `coordinatorApi.ts` | queue, claim, owned case, information request, decision, close |
| Administrator API | Not implemented because the supplied backend contract defines no administrator endpoints |

The threat-category adapter temporarily accepts both camelCase and the
snake_case example shown in backend section 8.12. Remove that compatibility
only after OpenAPI and the written contract agree.

## Backend contract blockers

These are not safe for the frontend to invent:

1. **The queue contract excludes claimed reports.** The product requirement is
   an all-reports coordinator queue, while `GET /coordinator/queue` is documented
   as unclaimed-only. It must return all submitted reports with `statusCode`,
   nullable `owner`, and nullable `claimedAt`. The exact response is recorded in
   `docs/REQUIRED_COORDINATOR_QUEUE_CONTRACT.md`.
2. **No claim-to-review transition is exposed.** Claiming returns status
   `claimed`, but the decision endpoint rejects `claimed` and accepts only
   `under_review`, `evidence_accepted`, `monitoring` or `referred`. Claiming must
   move directly to `under_review`, or the backend must expose a start-review
   operation.

3. **Administrator endpoints are absent.** US1.1 requires account creation,
   directory access, role/status changes and coordinator-access approval, but
   the API summary contains no administrator create-user, user-list,
   role-request, approve/reject, suspend or reactivate contracts. The current
   administrator screens therefore use browser-local preview records. Passwords
   are not retained in browser storage.
4. **A complete coordinator “My Cases” list is absent.** The frontend remembers
   successful claims made through the current browser and rechecks each one with
   `GET /coordinator/reports/{reportReference}`. This is backend-authorised and
   supports reopening those cases, but it cannot discover older claims or claims
   made on another device. A server-filtered owned-cases list is still required.
5. **Evidence assessment transition is absent.** There is an information-request
   endpoint and a response-type decision endpoint, but no documented operation
   that records evidence usability/credibility and moves a case to
   `evidence_accepted` or `closed_not_substantiated` before the response decision.
6. **Private evidence response is unspecified.** The evidence endpoint is marked
   “planned — must”, but its success body (for example a short-lived URL versus a
   streamed file) is not defined.
7. **Coordinator case detail omits `observedAt`.** US5.2 requires observation
   date/time, but the example response in section 8.11 does not contain it.
8. **Coordinator activity/history projection is unspecified.** US1.4 requires
   who/what/when. The database records `case_event`, but no coordinator-safe
   history response is included in section 8.11.
9. **Logout is not complete.** It is listed as “planned — must”. Token clearing
   in the browser cannot revoke a server-side session.

## Administrator account-creation contract required

The frontend route `/admin/users/new` now collects:

- `displayName` — required, maximum 100 characters;
- `email` — required and unique;
- `role` — one of `observer`, `case_coordinator` or `system_administrator`;
- `temporaryPassword` — required, 12–128 characters with at least four distinct
  characters; and
- password confirmation — frontend-only and never submitted as a separate
  stored credential.

The backend team must define the final OpenAPI operation. A suitable contract
would be an administrator-protected create-user operation accepting the first
four fields above and returning the new user identifier, email, display name,
role and account status. The final path and response must be agreed in OpenAPI
before an `adminApi.ts` adapter is added.

The backend implementation must:

1. require a valid `system_administrator` token;
2. reject duplicate email addresses consistently;
3. validate the role against the documented enum;
4. apply the same password rules as normal registration;
5. hash the temporary password and never return or log it;
6. create the account as active unless the contract explicitly states otherwise;
7. record the acting administrator and server timestamp; and
8. decide whether the user must change the temporary password at first login.

If a forced password change is required, its token claim, response field and
frontend route must be added to the contract; none is currently documented.

## Backend handoff sequence

1. Finalise OpenAPI for the blockers above, including the all-reports queue,
   claim-to-review transition and administrator
   account creation, and keep external JSON
   consistently camelCase.
2. Configure `NEXT_PUBLIC_API_BASE_URL` and backend CORS for the exact frontend
   origin.
3. Confirm `/auth/login`, `/auth/me` and `/auth/logout`; then test all three role
   redirects with real tokens.
4. Smoke-test the connected observer path: reference data → Dive Session →
   multipart report submit → confirmation → My Reports/timeline.
5. Expand the coordinator queue and add the start-review, owned-case listing,
   evidence-assessment and history contracts. Then run an end-to-end claim and
   decision test using one real report.
6. Add `adminApi.ts` only after administrator contracts exist, then replace the
   browser-local account directory and creation preview with server responses.
7. Verify that public registration can create only observers while the protected
   administrator operation can create all three account roles.
8. Run `npm run check` and `npm run build`, then execute backend integration tests
   for role isolation, cross-observer access, atomic claim and private location.

## Backend integration acceptance checks

Before the frontend can be marked fully integrated, verify all of the following:

- an observer, coordinator and administrator can log in and reach only their
  own workspace;
- public registration always returns an observer account;
- only an administrator can create coordinator or administrator accounts;
- administrator-created credentials work through the normal login page;
- duplicate-email, invalid-role and weak-password responses display safely;
- direct API calls with the wrong role return `403 Forbidden`;
- an observer cannot read another observer's report;
- exact coordinates are returned only to the submitting observer and the active
  claiming coordinator;
- concurrent claim attempts leave exactly one coordinator as owner;
- account creation, role changes, claims, decisions and closures produce an
  auditable actor and server timestamp; and
- no password, access token or precise location appears in browser logs or
  public responses.

## Contract decisions already applied

- Browser-facing dates are `dd/mm/yyyy`; API dates/timestamps are ISO 8601.
- Dive Session `diveDate` is required because the documented database contract
  requires it, even though US4.1 only names the site as the minimum story field.
- Estimated depth remains optional because the definitive US2.2 field list marks
  it optional, despite an earlier sentence grouping it with required fields.
- Self-registration sends only `email`, `displayName` and `password` and always
  results in the `observer` role.
- Privileged accounts are provisioned only through the protected administrator
  workflow; the public Register page does not expose a role field.
- The frontend and latest backend document both require 12–128 password
  characters and at least four distinct characters.
- Precise coordinates are sent only when an observer supplies a map pin.
- Threat category and named-site database IDs come only from backend reference
  responses; the submission flow does not rely on frontend seed IDs.
