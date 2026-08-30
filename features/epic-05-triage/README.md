# Epic 5 — Conservation review, triage and routing

This folder contains the completed frontend coordinator queue and review
workflow, merged with Epic 1 ownership checks.

Primary route files:

- `app/(coordinator)/coordinator/report-queue/page.tsx`
- `app/(coordinator)/coordinator/my-cases/page.tsx`
- `app/(coordinator)/coordinator/reports/[reportId]/page.tsx`

The detailed route branches safely: unclaimed reports show claim confirmation,
the current coordinator's reports show the review workflow, reports owned by
another coordinator show the Epic 1 restriction notice, and unknown references
show a not-found message.

The workflow records the five questions across evidence usability, credibility,
related-report checking, response type and closure reason. It blocks closure
reasons that contradict the recorded assessment/response, requires an outcome
note and uses backend-compatible status and closure codes. Information requests,
claims and outcomes update the shared prototype store and My Cases view.

No backend endpoints are called yet. During integration, replace store mutations
with the documented queue, claim, information-request, decision and close API
requests while retaining the ownership gate and user-facing status language.
