# Epic 4 — Location and privacy

This folder contains the Dive Session, map location and privacy-review steps of
the reporting form. The page is `/report-a-reef/location`.

An observer can select an existing Dive Session or create one with a named dive
site and date. A map pin is optional. When a pin is used, the observer also
chooses how accurately it represents the observation.

Named sites and Dive Sessions come from the backend. New sessions are created
through `diveSessionsApi.ts`. The selected session, location source, confidence
and optional coordinates are included when the report is submitted.

The map uses OpenStreetMap. Dates are displayed as `dd/mm/yyyy` and converted
to the backend format when a request is sent.

Exact coordinates are restricted. They should be visible only to the observer
who submitted the report and the Case Coordinator who claims it. Everyone else
receives only the general dive-site location.
