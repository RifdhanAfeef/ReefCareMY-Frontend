# Epic 5 — Coordinator review and triage

This folder contains the coordinator report queue, ownership checks and case
review workflow.

A coordinator can claim an available report, review its evidence, request more
information, record a response and close the case with an appropriate reason.
Reports owned by another coordinator show an access notice instead of protected
evidence.

The workflow keeps evidence decisions separate from field verification and
does not promise that an external organisation will act. It also blocks closure
reasons that conflict with the recorded assessment.

The report queue loads the backend's paginated unclaimed-report endpoint with
loading, error, retry and page controls. Claiming a report then loads its
protected case detail from the backend. Information requests, response decisions
and closure outcomes are also saved through the documented coordinator API.

The backend contract still has three coordinator gaps: it does not list cases
owned by the signed-in coordinator, define a separate evidence-assessment
transition, or provide a case activity/history response. The interface does not
invent those requests. Evidence checklist answers are included in the next real
decision, request or closure, and the “My Cases” page explains why a live list is
not available.
