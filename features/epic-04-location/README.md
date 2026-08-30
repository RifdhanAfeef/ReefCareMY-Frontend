# Epic 4 — Safe location capture and privacy

This folder contains the completed frontend prototype for Dive Sessions,
location capture and privacy review.

Primary route file:

- `app/(observer)/report-a-reef/location/page.tsx`

The flow supports an existing or new Dive Session, requires selection of a
backend-compatible named-site reference, keeps date/label/times optional,
accepts an optional pin on an OpenStreetMap view of Malaysia and records a
compatible confidence code.
Dive-site-only reports use `dive_site_only`; exact, 100 m, 1 km and unsure
confidence choices require a pin, matching the latest backend validator. Its state is shared through
`features/shared/mock-app-state.tsx` and appears on the review page.

OpenStreetMap supplies the current map imagery, while Dive Sessions and named
sites still use frontend prototype data. During integration, load the approved
named-site records from the backend and submit the selected source, confidence,
`namedDiveSiteId`, general site and optional latitude/longitude. If dive date
remains blank in the UI, use the observation date as the required `diveDate`
value when creating the backend Dive Session.

Dates use the shared control: observers may type `dd/mm/yyyy` or choose from the
native calendar. Convert that display value to the backend's ISO date at the API
boundary.

Precise coordinates must be returned only to the submitting observer and the
Case Coordinator who claims the case. System Administrators and other
coordinators receive the general site only.
