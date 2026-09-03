# Epic 2 — Reef observation and reporting

This folder contains the public reporting guide and the observer report form,
review and submission flow.

Observers can choose a supported threat, add a description, date, time, depth
and one or more photographs. PNG, JPG and WebP files are accepted up to 10 MB
each. Validation explains what needs to be corrected before the observer can
continue.

Text and selections are kept in the shared draft store. Photograph files use
IndexedDB so they can survive navigation and refreshes. These drafts remain on
the current browser and are not synchronised between devices.

## Backend connection

- Threat categories load from `GET /api/v1/reference/threat-categories`.
- `report-payload.ts` converts the displayed date and time to ISO 8601.
- `reportsApi.submitReport` sends `multipart/form-data` containing `payload`
  and the selected `photos`.
- The backend creates IDs, stores private evidence and returns the report reference.

The frontend sends camelCase fields. `referenceApi.ts` temporarily accepts both
camelCase and snake_case category responses until the final OpenAPI contract is
confirmed.
