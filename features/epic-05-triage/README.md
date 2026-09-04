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

The report queue is designed as an all-reports view with status, owner, search,
site and pagination controls. It can render both claimed and unclaimed reports,
but the latest backend document still defines the endpoint as unclaimed-only.
The backend must return every submitted report, including `statusCode`, `owner`
and `claimedAt`, before claimed cases can remain visible in this queue.

Claiming a report loads its protected case detail from the backend and shows the
claim confirmation. Information requests, response decisions and valid closure
outcomes are also saved through the documented coordinator API.

The backend contract still has several coordinator gaps: an all-reports queue,
a complete list of cases owned by the signed-in coordinator, a transition from `claimed`
to `under_review`, a separate evidence-assessment decision and case history.
The interface does not invent those requests. It disables decision controls
while a case is only `claimed`, and it does not pretend a Not Substantiated
closure was saved without the required assessment operation. As a temporary
bridge, a successful claim is saved for the current coordinator on that device;
“My Cases” then verifies each reference with the real owned-case detail endpoint.
