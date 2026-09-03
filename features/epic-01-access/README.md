# Epic 1 — Accounts, roles and access

This folder contains login, registration, role management and coordinator case
access. The related pages are under the admin and coordinator route groups in
`app/`.

## What works now

- Users can register, log in and log out through the backend.
- Routes are shown only to the appropriate account role.
- Administrators can search users, preview account creation and review
  coordinator access requests.
- Coordinators can claim a report and view cases assigned to them.
- Protected case content is hidden when another coordinator owns the case.

The administrator and coordinator records are still prototype data. They are
kept in `mock-data.ts` and the shared prototype store so the UI can later switch
to backend responses without being redesigned.

The frontend uses these backend role codes: `observer`, `case_coordinator` and
`system_administrator`. `role-catalog.ts` turns them into readable labels.

## Backend work still needed

The backend must enforce roles and ownership even when the frontend hides a
page or button. It also needs to:

- create administrator-provisioned accounts and hash temporary passwords;
- save administrator role and account-status changes;
- claim cases atomically so two coordinators cannot claim the same report;
- return exact coordinates only to an authorised case owner; and
- record who performed important actions and when they happened.

Typed coordinator requests are in `lib/api/coordinatorApi.ts`. Registration
uses `POST /api/v1/auth/register`, while login sends form fields named
`username` and `password`. Observer registration requires a password of at
least six characters and never includes a role selector.

See `docs/BACKEND_INTEGRATION_READINESS.md` for the full integration list.
