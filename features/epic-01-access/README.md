# Epic 1 — Accounts, roles and access

This folder contains login, registration, role management and coordinator case
access. The related pages are under the admin and coordinator route groups in
`app/`.

## What works now

- Users can register, log in and log out through the backend.
- Routes are shown only to the appropriate account role.
- Administrators can preview user, account-creation and coordinator-access
  interfaces. Each screen clearly states that no administrator API exists yet.
- Coordinators can load the backend queue, claim a report and open its protected
  case details through backend ownership checks.
- The fake “My Cases” list has been removed so prototype records are not shown as
  live data while the owned-case list endpoint is missing.

Administrator records remain prototype data in `mock-data.ts`. Coordinator case
decisions no longer use the shared prototype store.

The frontend uses these backend role codes: `observer`, `case_coordinator` and
`system_administrator`. `role-catalog.ts` turns them into readable labels.

## Backend work still needed

The backend must enforce roles and ownership even when the frontend hides a
page or button. It also needs to:

- create administrator-provisioned accounts and hash temporary passwords;
- save administrator role and account-status changes;
- return a server-filtered list of cases owned by the signed-in coordinator;
- return exact coordinates only to an authorised case owner; and
- record who performed important actions and when they happened.

Typed coordinator requests are in `lib/api/coordinatorApi.ts` and are used by
the queue and case workflow. Registration
uses `POST /api/v1/auth/register`, while login sends form fields named
`username` and `password`. Observer registration requires a password of at
least six characters and never includes a role selector.

See `docs/BACKEND_INTEGRATION_READINESS.md` for the full integration list.
