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

The report queue now loads the backend's paginated unclaimed-report endpoint,
with loading, error, retry and page controls. The remaining case review actions
still update the shared prototype store. Replace those actions with the claim,
information-request, decision and closure API calls while keeping the existing
ownership checks and observer-friendly status wording.
