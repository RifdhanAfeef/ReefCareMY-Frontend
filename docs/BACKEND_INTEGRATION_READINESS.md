# Backend integration readiness — Iteration 1

Reviewed against:

- `Backend documentation(4).docx` (28 August 2026)
- `ReefCare_My - User Stories and Acceptance Criteria(4).docx`

This file is the handoff record for the frontend. “Frontend ready” means the
required screen, validation and typed API boundary exist. It does not mean a
story is secure or complete until the backend endpoint, database rule and
authorisation tests also pass.

## Readiness summary

| Story | Frontend evidence | Integration state |
| --- | --- | --- |
| US1.1 Role separation | Public, observer, coordinator and administrator route groups; `RequireRole` gates all protected groups | Frontend ready. Backend must enforce every role dependency. |
| US1.2 Single owner | Queue, claim screen, ownership notice, owner display; typed claim adapter | UI and contract ready. Atomicity remains a backend/database responsibility. |
| US1.3 Sensitive information | Observer-owned detail view, coordinator-only precise-location panel, no admin case-detail route | Frontend ready. Exact-location and evidence reads must be filtered by the backend. |
| US1.4 Traceability | Coordinator activity timeline and who/when UI | UI ready. Backend response needs an activity/history projection to replace mock events. |
| US1.5 Authentication | Real login, bearer-token client, protected observer routes | Integrated for login. Logout endpoint is documented as planned and still needs backend completion. |
| US1.6 Registration | Real observer-only registration; no role selector; 12–128 character password validation | Integrated. Backend remains authoritative for duplicate email and password rules. |
| US2.1 Guidance | Public `/learn` page with four threats, evidence, images and safety reminders | Complete as static frontend content; the optional guidance endpoint is not required. |
| US2.2 Capture report | Photo validation, backend threat categories, all required fields, optional depth, Unsure category, local draft persistence | Integrated through the reference and multipart submission APIs. Backend reference data must include all five form choices. |
| US2.3 Review/submit | Review summary, protected-location summary, real multipart submit and API confirmation | Integrated. The backend owns persistence, reference generation, submission time and initial Received status. |
| US4.1 Safe location | Backend Dive Session selection/creation, named site, optional interactive pin, confidence and privacy review | Integrated. Current backend contract requires `diveDate`; the UI labels and validates it as required. |
| US5.1 Queue/claim | Queue, ownership filters, claim screen, typed queue/claim adapters | UI and contract ready. A real queue response must replace prototype records. |
| US5.2 Review details | Evidence, description, time, depth, confidence and exact-location layout | UI ready, but blocked by incomplete backend case/evidence response contracts listed below. |
| US5.3 Evidence usability | Needs-more-information branch and 500-character reason limit | UI and information-request adapter ready. Evidence-accepted transition contract is missing. |
| US5.4 Response type | Monitoring, referral/share and intervention options; typed decision adapter | UI and contract ready. |
| US5.5 Closure | Exactly one compatible fixed reason, required note, observer wording; typed close adapter | UI and contract ready. |
| US6.1 Confirmation | Real report-reference/status/location/submission response shape and confirmation view | API tracking and confirmation boundary ready. |
| US6.2 Status tracking | Real My Reports, observer-safe detail and timeline API calls | Integrated. Labels render exactly as returned by the backend. |
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

The threat-category adapter temporarily accepts both camelCase and the
snake_case example shown in backend section 8.12. Remove that compatibility
only after OpenAPI and the written contract agree.

## Backend contract blockers

These are not safe for the frontend to invent:

1. **Administrator endpoints are absent.** US1.1 requires account, role and
   coordinator-access approval, but the API summary contains no administrator
   user, role-request, approve/reject, suspend or reactivate contracts.
2. **Coordinator “My cases” is absent.** The UI needs a server-filtered list of
   cases owned by the authenticated coordinator. `GET /coordinator/queue` is
   documented as the unclaimed queue only.
3. **Evidence assessment transition is absent.** There is an information-request
   endpoint and a response-type decision endpoint, but no documented operation
   that records evidence usability/credibility and moves a case to
   `evidence_accepted` or `closed_not_substantiated` before the response decision.
4. **Private evidence response is unspecified.** The evidence endpoint is marked
   “planned — must”, but its success body (for example a short-lived URL versus a
   streamed file) is not defined.
5. **Coordinator case detail omits `observedAt`.** US5.2 requires observation
   date/time, but the example response in section 8.11 does not contain it.
6. **Coordinator activity/history projection is unspecified.** US1.4 requires
   who/what/when. The database records `case_event`, but no coordinator-safe
   history response is included in section 8.11.
7. **Login response shape conflicts.** Section 8.1 nests token data under
   `session`; the existing deployed-schema notes in the frontend use flat token
   fields. `authApi.login` accepts both until OpenAPI is finalised.
8. **Logout is not complete.** It is listed as “planned — must”. Token clearing
   in the browser cannot revoke a server-side session.

## Backend handoff sequence

1. Finalise OpenAPI for the eight blockers above and keep external JSON
   consistently camelCase.
2. Configure `NEXT_PUBLIC_API_BASE_URL` and backend CORS for the exact frontend
   origin.
3. Confirm `/auth/login`, `/auth/me` and `/auth/logout`; then test all three role
   redirects with real tokens.
4. Smoke-test the connected observer path: reference data → Dive Session →
   multipart report submit → confirmation → My Reports/timeline.
5. Replace coordinator prototype state only after queue, owned-case, evidence,
   evidence-assessment, history and My Cases contracts are complete.
6. Replace administrator mock data only after administrator contracts exist.
7. Run `npm run check` and `npm run build`, then execute backend integration tests
   for role isolation, cross-observer access, atomic claim and private location.

## Contract decisions already applied

- Browser-facing dates are `dd/mm/yyyy`; API dates/timestamps are ISO 8601.
- Dive Session `diveDate` is required because the documented database contract
  requires it, even though US4.1 only names the site as the minimum story field.
- Estimated depth remains optional because the definitive US2.2 field list marks
  it optional, despite an earlier sentence grouping it with required fields.
- Self-registration sends only `email`, `displayName` and `password` and always
  results in the `observer` role.
- Password length remains 12–128 characters, with at least four distinct
  characters enforced by the backend.
- Precise coordinates are sent only when an observer supplies a map pin.
- Threat category and named-site database IDs come only from backend reference
  responses; the submission flow does not rely on frontend seed IDs.
