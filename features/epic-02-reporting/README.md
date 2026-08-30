# Epic 2 — Responsible observation and reporting

This folder contains public reporting guidance, observation capture, local
draft saving, review and the connected multipart submission flow.

Primary route files:

- `app/(public)/learn/page.tsx`
- `app/(observer)/report-a-reef/page.tsx`
- `app/(observer)/report-a-reef/review/page.tsx`
- `app/(observer)/report-a-reef/confirmation/page.tsx`

The guidance page introduces ghost fishing gear, coral bleaching, marine debris
and physical reef damage without requiring login. The observation form accepts
one or more PNG, JPG or WebP photographs up to 10 MB each, an approved threat
category (including Unsure), observation date/time, optional depth and a plain
language description. Required-field and file validation block progression and
identify the item that needs attention.

Draft text and selection data use the shared prototype store in
`features/shared/mock-app-state.tsx`. Actual browser `File` objects are kept in
IndexedDB by `draft-storage.ts`, allowing photographs to survive route changes
and refreshes without putting them in `localStorage`. This is a frontend-only
draft and is not synchronised across browsers or devices.

The review page combines Epic 2 observation evidence with Epic 4 Dive Session,
location and confidence data. It calls `POST /api/v1/reports`; the backend
creates the public reference, records **Received**, timestamps the submission
and places the report in the coordinator queue.

## Backend integration boundary

- Category choices come from `GET /api/v1/reference/threat-categories`.
- `report-payload.ts` converts `dd/mm/yyyy` and time to timezone-aware ISO 8601.
- `reportsApi.submitReport` sends `multipart/form-data` with `payload` and one
  or more `photos` fields.
- Backend IDs come from reference/Dive Session responses and are not generated
  by the frontend.
- The backend remains authoritative for authentication, validation, private
  evidence storage, submission atomicity and protected locations.

The report submission contract is camelCase. The latest backend document's
threat-category example still shows snake_case even though its target Pydantic
schema says frontend JSON should be camelCase. Confirm the generated OpenAPI
response. `referenceApi.ts` accepts both temporarily and exposes one camelCase
shape to the rest of the frontend.

AI diagnosis and automated classification are outside Iteration 1.
