# Epics 1, 2, 4 and 5 — frontend completion notes

This package combines the current Epic 1 implementation with completed Epic 2,
Epic 4 and Epic 5 frontend flows. Login and registration files were not changed.

## Quick test routes

Run `npm.cmd run dev` on Windows, then open these URLs directly:

| Area | URL | Suggested prototype check |
| --- | --- | --- |
| Landing page | `http://localhost:3000` | Check public purpose, threat, process, privacy and account entry sections |
| Epic 2 — guidance | `http://localhost:3000/learn` | Open each supported threat and review evidence/safety guidance |
| Epic 2 — observation | `http://localhost:3000/report-a-reef` | Test required fields, photo validation and local draft saving |
| Epic 4 — location | `http://localhost:3000/report-a-reef/location` | Select/create a Dive Session and complete privacy review |
| Epic 2 — review | `http://localhost:3000/report-a-reef/review` | Confirm observation, evidence and location appear together |
| Epic 2 — confirmation | `http://localhost:3000/report-a-reef/confirmation` | Submit through the review page first, then check the reference and status |
| Epic 5 — queue | `http://localhost:3000/coordinator/report-queue` | Confirm the newly submitted report appears as Received |
| Epic 1 — users | `http://localhost:3000/admin/users` | Search users and edit a stored role/status |
| Epic 1 — access requests | `http://localhost:3000/admin/role-requests` | Open and review a coordinator request |
| Epic 5 — unclaimed | `http://localhost:3000/coordinator/reports/RC-0243` | Claim, assess and process the report |
| Epic 5 — my case | `http://localhost:3000/coordinator/reports/RC-0241` | Open the full review workflow immediately |
| Epic 1 — restricted | `http://localhost:3000/coordinator/reports/RC-0242` | Confirm another coordinator's case stays restricted |
| Not found | `http://localhost:3000/coordinator/reports/RC-9999` | Confirm no fake report is created |

## Shared prototype state

`features/shared/mock-app-state.tsx` is the temporary frontend source of truth
for reports, cases and the location draft. It uses browser `localStorage`,
allowing draft details, submissions, claims and decisions to remain visible
after route changes or refreshes. Epic 2 photograph `File` objects are stored in
IndexedDB by `features/epic-02-reporting/draft-storage.ts`.

Do not create separate copies of report or case data inside another epic. Doing
so would make report review, confirmation, queue, My Cases and case review
disagree. To reset the demonstration, clear this site's storage in browser
developer tools and refresh.

## Requirements retained

- Public threat guidance is available without an account; “public” is not a stored role.
- The four supported guidance categories are ghost fishing gear, coral bleaching,
  marine debris and physical reef damage.
- Observation capture includes photos, category, date/time, optional depth and description.
- Required fields and photo type/size constraints are checked before progression.
- Empty photos and future observation dates are rejected before progression.
- Local draft saving works without calling the backend.
- Review shows both observation evidence and Epic 4 location/confidence details.
- Submission generates a prototype reference, records status Received and adds
  the case to the coordinator intake queue.
- One active Case Coordinator can own a report.
- Exact location is shown only inside the current owner's protected workflow.
- Other coordinators receive a restricted-access screen.
- Claiming is recorded separately from evidence assessment.
- Evidence Accepted is a desk-review decision, not on-site confirmation.
- Closure choices remain compatible with the recorded assessment and response.
- Sharing records consideration only; it does not imply external acceptance.
- Backend-compatible role, status, confidence and closure codes are used in mock data.
- Dates are displayed and entered as `dd/mm/yyyy`.
- Named Dive Sites carry backend-compatible IDs, and confidence choices are
  constrained by whether the observer supplied a map pin.
- Standard pages and full-page workflows include consistent back navigation.

## Still intentionally pending

- Real login, registration and session handling (authentication teammate).
- FastAPI calls, database persistence and server-enforced permissions.
- Backend persistence and server-side validation for the selected map latitude/longitude.
- Observer-facing My Reports, timelines and later outcome feedback (Epic 6).
- Automated component/end-to-end tests beyond the completed lint and build checks.

During integration, submit reports as documented `multipart/form-data`, replace
prototype references/timestamps with the API response, and enforce role and
protected-location rules on the backend even when frontend controls are hidden.

The backend document still contains two contracts that should be confirmed
against generated OpenAPI before integration: login is currently form-encoded
although an older JSON contract existed, and the threat-category response
example is snake_case although its target schema specifies camelCase aliases.
