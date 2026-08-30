# Epics 1, 4 and 5 — frontend completion notes

This package safely combines the current Epic 1 implementation with the
reviewed Epic 4 and Epic 5 work. Login and registration files were not changed.

## Quick test routes

Run `npm.cmd run dev` on Windows, then open these URLs directly:

| Area | URL | Suggested prototype check |
| --- | --- | --- |
| Epic 1 — users | `http://localhost:3000/admin/users` | Search users and edit a stored role/status |
| Epic 1 — access requests | `http://localhost:3000/admin/role-requests` | Open and review a coordinator request |
| Epic 4 — location | `http://localhost:3000/report-a-reef/location` | Select/create a Dive Session and complete privacy review |
| Epic 4 — draft review | `http://localhost:3000/report-a-reef/review` | Confirm the saved location appears across routes |
| Epic 5 — queue | `http://localhost:3000/coordinator/report-queue` | Filter reports and open each ownership state |
| Epic 5 — unclaimed | `http://localhost:3000/coordinator/reports/RC-0243` | Claim, assess and process the report |
| Epic 5 — my case | `http://localhost:3000/coordinator/reports/RC-0241` | Open the full review workflow immediately |
| Epic 1 — restricted | `http://localhost:3000/coordinator/reports/RC-0242` | Confirm another coordinator's case stays restricted |
| Not found | `http://localhost:3000/coordinator/reports/RC-9999` | Confirm no fake report is created |

## Shared prototype state

`features/shared/mock-app-state.tsx` is the temporary frontend source of truth
for cases and the location draft. It uses browser `localStorage`, allowing
claims and decisions to remain visible after route changes or refreshes.

Do not create separate copies of the case array inside Epic 1 or Epic 5. Doing
so would make the queue, My Cases and case review disagree. To reset the demo,
clear the site's local storage in browser developer tools and refresh.

## Safe merge rules retained

- One active Case Coordinator per report.
- Exact location shown only inside the current owner's protected workflow.
- Other coordinators receive a restricted-access screen.
- Claiming is recorded separately from evidence assessment.
- Evidence Accepted is explicitly a desk-review decision, not on-site confirmation.
- The five checks cover evidence usability, credibility, related reports,
  response type and closure reason.
- Closure choices are limited to reasons compatible with the recorded decision.
- Intervention Recommended remains open by default and does not promise action.
- Sharing records consideration only; it does not imply external acceptance.
- No responsible partner is retained as a distinct closure outcome.
- Backend-compatible role, status, confidence and closure codes are used in mock data.
- Dates are displayed and entered as `dd/mm/yyyy` throughout these epics.
- Standard pages and full-page workflows include consistent back navigation.
- The Dive Session form is a centred single-card layout without the former
  “Stored with the session” sidebar.

## Still intentionally pending

- Real login, registration and session handling (authentication teammate).
- FastAPI calls, database persistence and server-enforced permissions.
- Backend persistence and server-side validation for the selected map latitude/longitude.
- Observer-facing cross-role notifications and timelines (Epic 6).
- Automated component/end-to-end tests beyond the completed lint and build checks.

The browser checks are a frontend demonstration only. During backend
integration, authorisation and exact-location filtering must be enforced by the
API even when frontend buttons or routes are hidden.
