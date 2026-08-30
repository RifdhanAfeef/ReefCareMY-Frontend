# Epic 1 — Stakeholder roles, ownership and access

This folder contains the reusable frontend implementation for Epic 1.

Primary route files:

- `app/(admin)/admin/users/page.tsx`
- `app/(admin)/admin/role-requests/page.tsx`
- `app/(admin)/admin/role-requests/[requestId]/page.tsx`
- `app/(coordinator)/coordinator/report-queue/page.tsx`
- `app/(coordinator)/coordinator/my-cases/page.tsx`
- `app/(coordinator)/coordinator/reports/[reportId]/page.tsx`

## Current frontend behaviour

- Search and filter the user directory.
- Change a user role or account status in temporary component state.
- Review, approve or reject a Case Coordinator access request.
- Display what coordinator access does and does not grant.
- Claim an unclaimed report in shared persistent prototype state.
- Prevent a second coordinator from opening protected case information.
- Show the active case owner and basic who/what/when activity.

The demonstration records are in `mock-data.ts`. They are intentionally kept
outside the page files so they can later be replaced with backend responses.

`PUBLIC_VISITOR` is not an account role. It describes someone browsing the
public site without being authenticated. Therefore, it must not appear in the
administrator user directory, role filter or role-editing controls.

Frontend mock accounts store the same role codes documented by the backend:

- `observer`
- `case_coordinator`
- `system_administrator`

`role-catalog.ts` converts those codes into friendly interface labels. Case mock
records similarly keep `statusCode` separate from `statusLabel` so later API
responses can be adopted without changing the visible wording.

## Current development phase

Epic 1 remains frontend-only. Components use mock records and shared browser
prototype state; no FastAPI endpoint is called yet. During
the later integration phase, replace `mock-data.ts` imports with request
functions based on `lib/api/client.ts` while keeping the existing components and
page routes.

## Backend integration still required

Before production use, the backend must authenticate the user and enforce every
role and ownership rule. In particular, it must:

- verify the `system_administrator` role before changing accounts;
- verify the `case_coordinator` role before returning the report queue;
- perform an atomic claim so two coordinators cannot claim the same case;
- return exact coordinates only after confirming the active owner;
- record the acting user, action and server timestamp for key changes; and
- reject unauthorised requests even if a page or button is hidden in the UI.

The documented integration routes relevant to the existing coordinator screens
include `GET /api/v1/coordinator/queue`,
`POST /api/v1/coordinator/reports/{reportReference}/claim`, and
`GET /api/v1/coordinator/reports/{reportReference}`. These are reference points
only and are not called by the current frontend implementation.

Authentication UI begins in `app/(auth)`. Login and registration are owned by a
separate teammate and were not changed as part of this Epic 1 implementation.

The latest backend contract adds `POST /api/v1/auth/register`. The registration
form should send only `email`, `displayName` and `password`, require at least 12
password characters, and never show or submit a role selector. A successful
registration creates an `observer` but does not return a token, so the user must
then log in. Duplicate email uses HTTP 409 and invalid input uses HTTP 422.

Before integrating login, confirm the final request format with the backend
team: the current route uses `application/x-www-form-urlencoded` fields
`username` (the email) and `password`, while the backend document explicitly
marks its older JSON login contract as unresolved.

The report queue and case-detail routes are shared with Epic 5. Ownership and
exact-location access are checked before the review workflow is displayed.
