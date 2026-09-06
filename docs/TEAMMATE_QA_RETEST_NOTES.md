# Teammate QA retest notes

These notes compare the reported QA findings with the latest frontend, the
Iteration 1 acceptance criteria and the supplied backend documentation.

| Finding | Latest frontend status | What to retest |
| --- | --- | --- |
| Observation date missing in coordinator view | The view displays `observedAt` when it is returned. It now shows a specific data-loading warning when the coordinator API omits the field, instead of implying that the observer did not provide it. A backend contract fix is still required. | Open an owned report whose observer detail/API has a known `observedAt`. Confirm the coordinator case response contains it and the UI displays the formatted observation date/time. |
| “Request more information” available at Claimed | Fixed. The action is disabled while the case is Claimed and becomes part of the workflow after review has started. | Claim a report. Confirm the action is disabled, select **Start evidence assessment**, and then test the information-request path from Under Review. |
| Saved response decision lost after refresh | Improved. A decision is restored after a same-tab refresh from session storage, and the frontend also supports a future `latestDecision` field from the case API. Durable cross-device restoration still needs the backend change below. | Record Monitoring or Intervention, refresh before closing, and confirm the saved decision plus **Record a closure outcome** are still shown. |
| Closure list only shows two reasons | Fixed. All five fixed Iteration 1 reasons are visible. Reasons incompatible with the saved response remain disabled because the backend validates response/closure compatibility. | Record Monitoring, open closure, confirm all five reasons are listed, with only Monitoring and Logged for Reference enabled. Repeat for Referral and Intervention. |
| Referral recipient missing | Fixed. Referral now requires a free-text recipient organisation/contact and sends the trimmed value as `referredTo`. | Select Refer/Share, enter a real recipient such as “Tioman Marine Park Department”, save, and inspect the request payload/result. |
| Eight-digit observation date not formatted | Already implemented in the latest build. | Enter `05092026`; confirm it becomes `05/09/2026`. Also confirm future dates remain invalid. |
| Empty Dive Sessions state is confusing | Already implemented in the latest build. | Use an account with no Dive Sessions; confirm one clear **Create a Dive Session** action is shown rather than a disabled existing-session section. |
| Registration lacks password visibility/checklist | Already implemented in the latest build. The checklist uses a six-character minimum and four distinct characters. | Confirm Show/Hide works and both requirements update live while typing. |
| New report step does not receive keyboard focus | Fixed across route changes; existing same-page location steps retain their own focus handling. | Navigate to each next report step using only the keyboard and confirm focus moves to the new page `<h1>` while the page scrolls to the top. |
| Create account missing from home header | Fixed. The public header now consistently displays **Log in** and **Create account** on Home and Learn. The duplicate registration button was removed from the home hero. | Visit Home while signed out and confirm the header action opens `/register`. |
| Six-to-eleven-character password rejected as “at least 12” | Frontend validation already accepts six characters (with at least four distinct characters). The message is returned by the deployed backend. The UI now explains that server mismatch instead of presenting it as the intended rule. | After the backend change below, register with a valid six-character password such as `reef12`. |

## Backend changes still required

1. Make `observedAt` a required nullable field in the coordinator case response
   schema and populate it from the report observation projection. Do not replace
   it with `submittedAt`; they represent different events.
2. Add the latest saved case decision to the coordinator case response, for
   example:

   ```json
   {
     "latestDecision": {
       "responseType": "monitoring_only",
       "notes": "Retain for monitoring.",
       "referredTo": null,
       "decidedAt": "2026-09-04T01:20:00Z"
     }
   }
   ```

   The backend already persists case decisions; exposing the latest decision is
   needed for reliable refresh, new-tab and cross-device restoration. Browser
   session storage is only a frontend fallback.
3. Change the registration request schema/service password minimum from 12 to 6
   and update backend schema tests and deployed OpenAPI. Keep the agreed maximum
   and distinct-character rule if those remain part of the Iteration 1 contract.
4. Keep the backend response/closure compatibility validation. The frontend
   intentionally shows incompatible fixed reasons as disabled rather than
   submitting combinations that would return HTTP 409.
