# Epic 1 — Accounts, roles and access

This folder contains login, registration, role management and coordinator case
access. The related pages are under the admin and coordinator route groups in
`app/`.

## What works now

- Users can register and log in through the backend. The browser can clear a
  local session, but server-side logout is still marked as planned.
- Routes are shown only to the appropriate account role.
- Administrators can preview user, account-creation and coordinator-access
  interfaces. Each screen clearly states that no administrator API exists yet.
- Coordinators can load the backend queue, claim a report and open its protected
  case details through backend ownership checks.
- “My Cases” remembers successfully claimed report references per coordinator
  on the current device. It reloads each report through the backend’s individual
  owned-case endpoint, so protected details are still controlled by the backend.

Administrator records remain prototype data in `mock-data.ts`. Coordinator case
decisions no longer use the shared prototype store.

The frontend uses these backend role codes: `observer`, `case_coordinator` and
`system_administrator`. `role-catalog.ts` turns them into readable labels.

## Backend work still needed

The backend must enforce roles and ownership even when the frontend hides a
page or button. It also needs to:

- create administrator-provisioned accounts and hash temporary passwords;
- save administrator role and account-status changes;
- return a server-filtered list of cases owned by the signed-in coordinator so
  older and cross-device claims can also be discovered;
- return exact coordinates only to an authorised case owner; and
- record who performed important actions and when they happened.

Typed coordinator requests are in `lib/api/coordinatorApi.ts` and are used by
the queue and case workflow. Registration
uses `POST /api/v1/auth/register`, while login sends form fields named
`username` and `password`. Observer registration follows the latest backend
rule: 12–128 characters with at least four different characters. It never
includes a role selector.

See `docs/BACKEND_INTEGRATION_READINESS.md` for the full integration list.
