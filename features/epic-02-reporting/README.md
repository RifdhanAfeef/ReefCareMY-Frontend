# Epic 2 — Responsible observation and reporting

This folder contains the completed frontend prototype for public reporting
guidance, observation capture, local draft saving, review and submission.

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
location and confidence data. A successful prototype submission creates an
`RC-####` reference, records status **Received**, shows confirmation and inserts
the new case into the Epic 5 Case Coordinator queue.

## Backend integration notes

No endpoint is called during the frontend phase. During integration:

- Load category choices from `GET /api/v1/reference/threat-categories`.
- Convert the displayed `dd/mm/yyyy` date and time to the backend's ISO
  `observed_at` value at the API boundary.
- Send `POST /api/v1/reports` as `multipart/form-data`, using `payload` for the
  report fields and `photos` for the image files.
- Map the selected category to `threatCategoryId` and depth to
  `estimatedDepthMetres` when supplied.
- Include the selected `diveSessionId`, `namedDiveSiteId`, location source,
  confidence and optional map pin from Epic 4.
- Use the API's `report_reference`, `submitted_at`, general location and
  **Received** status in the confirmation instead of generating them locally.
- Enforce login at submission and all validation, authorisation, media limits
  and protected-location rules again on the backend.

The report submission contract is camelCase. The latest backend document's
threat-category example still shows snake_case even though its target Pydantic
schema says frontend JSON should be camelCase. Confirm the generated OpenAPI
response before connecting that reference endpoint rather than maintaining two
permanent frontend shapes.

AI diagnosis and automated classification are outside Iteration 1.
