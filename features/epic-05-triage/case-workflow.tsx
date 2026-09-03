"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { RestrictedCase } from "@/features/epic-01-access/case-access";
import type { ClosureReasonCode } from "@/features/epic-01-access/types";
import { useMockAppState } from "@/features/shared/mock-app-state";
import { formatDateTime } from "@/lib/format/date";
import { closureReasons, locationConfidenceLabels, statusForClosure, type ReviewOutcome } from "./triage-data";
import styles from "./triage.module.css";

type Stage = "claim" | "detail" | "assess" | "request" | "request-sent" | "response" | "response-saved" | "referral" | "close" | "closed";
type EvidenceAnswer = "yes" | "no" | "";
type DuplicateAnswer = "yes" | "no" | "unsure" | "";
type ResponseType = "monitoring" | "referral" | "intervention" | "";

function Heading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <header className={styles.heading}><p className={styles.eyebrow}>{eyebrow}</p><h1>{title}</h1><p>{description}</p></header>;
}

function nowLabel() {
  return formatDateTime();
}

export function CoordinatorCaseRoute({ reportReference }: { reportReference: string }) {
  const { findCase, currentCoordinator } = useMockAppState();
  const record = findCase(reportReference);
  if (!record) return <section className={styles.page}><Heading eyebrow="Coordinator workspace" title="Report not found" description="The report reference does not match a report in the current prototype data." /><section className={styles.card}><p>Check the report reference or return to the report queue.</p><Link className={styles.primaryButton} href="/coordinator/report-queue">Return to report queue</Link></section></section>;
  if (record.owner && record.owner !== currentCoordinator) return <section className={styles.page}><Heading eyebrow={`Report intake / ${record.reportReference}`} title="This case is assigned to another coordinator" description={`${record.owner} is currently responsible for this report. Protected details and decision controls remain restricted.`} /><RestrictedCase record={record} /></section>;
  return <CaseWorkflow reportReference={record.reportReference} initialStage={record.owner === currentCoordinator ? "detail" : "claim"} />;
}

function CaseWorkflow({ reportReference, initialStage }: { reportReference: string; initialStage: "claim" | "detail" }) {
  const { findCase, currentCoordinator, claimCase, updateCase } = useMockAppState();
  const report = findCase(reportReference)!;
  const [stage, setStage] = useState<Stage>(initialStage);
  const [usable, setUsable] = useState<EvidenceAnswer>("");
  const [credible, setCredible] = useState<EvidenceAnswer>("");
  const [duplicate, setDuplicate] = useState<DuplicateAnswer>("");
  const [decisionNote, setDecisionNote] = useState("Photograph plausibly shows the reported reef threat.");
  const [assessmentError, setAssessmentError] = useState("");
  const [requestItems, setRequestItems] = useState(["clearer-photo", "details"]);
  const [requestMessage, setRequestMessage] = useState("Could you add a wider photograph and clarify how the issue was positioned on the reef?");
  const [requestError, setRequestError] = useState("");
  const [responseType, setResponseType] = useState<ResponseType>("");
  const [responseNote, setResponseNote] = useState("The accepted evidence should be retained for an appropriate follow-up response.");
  const [responseError, setResponseError] = useState("");
  const [reviewOutcome, setReviewOutcome] = useState<ReviewOutcome>(null);
  const [savedResponse, setSavedResponse] = useState("");
  const [responder, setResponder] = useState("");
  const [referralNote, setReferralNote] = useState("Shared for consideration; no action commitment has been recorded.");
  const [referralError, setReferralError] = useState("");
  const [closureReason, setClosureReason] = useState<ClosureReasonCode | "">("");
  const [closureNote, setClosureNote] = useState("");
  const [closureError, setClosureError] = useState("");
  const closure = closureReasons.find((item) => item.value === closureReason);
  const allowedClosures = useMemo(() => closureReasons.filter((item) => item.allowedOutcomes.includes(reviewOutcome)), [reviewOutcome]);

  const toggleRequestItem = (value: string) => setRequestItems((items) => items.includes(value) ? items.filter((item) => item !== value) : [...items, value]);
  const beginInfoRequest = () => { setUsable("no"); setCredible(""); setStage("request"); };
  const confirmClaim = () => { if (claimCase(reportReference)) setStage("detail"); };

  const saveAssessment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!usable || (usable === "yes" && (!credible || !duplicate))) { setAssessmentError("Answer all required evidence questions before saving the decision."); return; }
    setAssessmentError("");
    if (usable === "no") { setReviewOutcome(null); setStage("request"); return; }
    if (credible === "no") {
      setReviewOutcome("not_substantiated"); setClosureReason("not_substantiated"); setClosureNote("The available evidence did not support the reported threat on desk review."); setStage("close"); return;
    }
    const timestamp = nowLabel();
    updateCase(reportReference, { statusCode: "evidence_accepted", statusLabel: "Evidence Accepted" }, { action: `Evidence accepted on desk review; duplicate check: ${duplicate}`, actor: currentCoordinator, timestamp });
    setStage("response");
  };

  const sendRequest = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (requestItems.length === 0 || !requestMessage.trim()) { setRequestError("Select at least one missing item and enter a message to the observer."); return; }
    if (requestMessage.trim().length > 500) { setRequestError("Keep the information request to 500 characters or fewer."); return; }
    const timestamp = nowLabel();
    setRequestError("");
    updateCase(reportReference, { statusCode: "needs_more_info", statusLabel: "Needs More Information", observerOutcome: requestMessage.trim() }, { action: "More information requested from observer", actor: currentCoordinator, timestamp });
    setStage("request-sent");
  };

  const saveResponse = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!responseType) { setResponseError("Choose the most appropriate response before continuing."); return; }
    setResponseError("");
    if (responseType === "referral") { setReviewOutcome("referral"); setStage("referral"); return; }
    const isMonitoring = responseType === "monitoring";
    const value = isMonitoring ? "Monitoring Recommended" : "Intervention Recommended";
    const timestamp = nowLabel();
    setReviewOutcome(responseType);
    setSavedResponse(value);
    setClosureReason("");
    setClosureNote("");
    updateCase(reportReference, { statusCode: isMonitoring ? "monitoring" : "under_review", statusLabel: value }, { action: value, actor: currentCoordinator, timestamp });
    setStage("response-saved");
  };

  const confirmReferral = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!responder || !referralNote.trim()) { setReferralError("Select a conservation contact and enter a sharing note."); return; }
    setReferralError(""); setReviewOutcome("referral"); setClosureReason("referred_other_org"); setClosureNote(referralNote.trim()); setStage("close");
  };
  const closeWithoutPartner = () => { setReviewOutcome(responseType === "intervention" ? "intervention" : "referral"); setClosureReason("no_responsible_partner"); setClosureNote("No participating response partner is currently available for this report."); setStage("close"); };

  const closeCase = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!closureReason || !allowedClosures.some((item) => item.value === closureReason)) { setClosureError("Select one valid closure reason for the recorded assessment and response."); return; }
    if (!closureNote.trim()) { setClosureError("Enter a closure note explaining the recorded outcome."); return; }
    const timestamp = nowLabel();
    const status = statusForClosure(closureReason);
    setClosureError("");
    updateCase(reportReference, { ...status, closureReasonCode: closureReason, observerOutcome: closure?.observer }, { action: `Case outcome recorded: ${closure?.label}`, actor: currentCoordinator, timestamp });
    setStage("closed");
  };

  if (stage === "claim") return <section className={styles.page}><Heading eyebrow={`Report intake / ${report.reportReference}`} title="Claim this report" description="Become the active Case Coordinator before opening protected evidence and decision controls." /><section className={styles.card}><h2>Incoming report</h2><p className={styles.muted}>{report.threat} — {report.generalLocation} — Status: {report.statusLabel}</p><div className={styles.summaryGrid}><div><span>Report reference</span><strong>{report.reportReference}</strong></div><div><span>Threat type</span><strong>{report.threat}</strong></div><div><span>General site</span><strong>{report.generalLocation}</strong></div><div><span>Submitted</span><strong>{report.submittedAt}</strong></div></div><aside className={styles.warningBox}><strong>Claiming records ownership — not a verdict</strong><p>The prototype records your identity and claim time. Evidence status remains unchanged until the human review is completed.</p></aside><div className={styles.splitActions}><Link className={styles.secondaryButton} href="/coordinator/report-queue">Cancel</Link><button className={styles.primaryButton} type="button" onClick={confirmClaim}>Claim and open report</button></div></section></section>;

  if (stage === "detail") return <section className={styles.page}><Heading eyebrow={`My Cases / ${report.reportReference}`} title="Review reef observation" description="Review the submitted evidence, observation details and protected location before making a decision." /><span className={styles.ownerChip}>Owned by you</span><div className={styles.reviewGrid}><section className={styles.card}><h2>Submitted evidence</h2><p className={styles.muted}>Observer-provided information</p><div className={styles.evidenceGrid}><div className={styles.photoPlaceholder} role="img" aria-label="Uploaded reef observation photograph placeholder">Uploaded photograph</div><dl className={styles.detailList}><div><dt>Threat type</dt><dd>{report.threat}</dd></div><div><dt>Observed</dt><dd>{report.observedAt}</dd></div><div><dt>Estimated depth</dt><dd>{report.estimatedDepth}</dd></div><div><dt>Description</dt><dd>{report.description}</dd></div><div><dt>Location confidence</dt><dd>{locationConfidenceLabels[report.locationConfidenceCode]}</dd></div></dl></div><div className={styles.protectedBox}><strong>Authorised exact location</strong><p>{report.exactLocation ?? "No exact coordinates were submitted"}</p><small>Visible because you are the claiming Case Coordinator.</small></div><h3>Recorded activity</h3><dl className={styles.detailList}>{report.activity.map((entry) => <div key={entry.id}><dt>{entry.timestamp} · {entry.actor}</dt><dd>{entry.action}</dd></div>)}</dl></section><aside className={styles.sidePanel}><h2>Case control</h2><dl className={styles.detailList}><div><dt>Active owner</dt><dd>{report.owner}</dd></div><div><dt>Claimed</dt><dd>{report.claimedAt}</dd></div></dl><div className={styles.infoBox}><strong>Review type</strong><p>Your assessment is recorded as a desk review, not an on-site confirmation.</p></div><button className={styles.primaryButton} type="button" onClick={() => setStage("assess")}>Start evidence assessment</button><button className={styles.secondaryButton} type="button" onClick={beginInfoRequest}>Request more information</button></aside></div></section>;

  if (stage === "assess") return <section className={styles.page}><Heading eyebrow="My Cases / Evidence review" title="Assess the submitted evidence" description="Complete the evidence and related-report checks before choosing a response." /><form className={styles.reviewGrid} onSubmit={saveAssessment}><section className={styles.card}><h2>Report {report.reportReference}</h2><p className={styles.muted}>Questions 1–3 form the assessment. Response and closure are recorded as questions 4–5.</p><fieldset className={styles.radioGroup}><legend>1. Is the evidence usable?</legend><label><input type="radio" name="usable" checked={usable === "yes"} onChange={() => setUsable("yes")} />Yes — the photograph and details can be assessed</label><label><input type="radio" name="usable" checked={usable === "no"} onChange={() => { setUsable("no"); setCredible(""); setDuplicate(""); }} />No — more information is required</label></fieldset><fieldset className={styles.radioGroup} disabled={usable !== "yes"}><legend>2. Does the evidence plausibly support the reported threat?</legend><label><input type="radio" name="credible" checked={credible === "yes"} onChange={() => setCredible("yes")} />Yes — record Evidence Accepted</label><label><input type="radio" name="credible" checked={credible === "no"} onChange={() => setCredible("no")} />No — close as Not Substantiated</label></fieldset><fieldset className={styles.radioGroup} disabled={usable !== "yes"}><legend>3. Does this appear related to an existing report?</legend><label><input type="radio" name="duplicate" checked={duplicate === "no"} onChange={() => setDuplicate("no")} />No matching report found</label><label><input type="radio" name="duplicate" checked={duplicate === "yes"} onChange={() => setDuplicate("yes")} />Yes — record the relationship in the decision note</label><label><input type="radio" name="duplicate" checked={duplicate === "unsure"} onChange={() => setDuplicate("unsure")} />Unsure — continue review and note the uncertainty</label></fieldset><label className={styles.field}>Decision note <span>Optional</span><textarea value={decisionNote} onChange={(event) => setDecisionNote(event.target.value)} /></label>{assessmentError && <p className={styles.errorText} role="alert">{assessmentError}</p>}<div className={styles.actions}><button className={styles.secondaryButton} type="button" onClick={() => setStage("detail")}>Back</button><button className={styles.primaryButton} type="submit">Save assessment</button></div></section><aside className={styles.sidePanel}><h2>Decision guidance</h2><div className={styles.successBox}><strong>Evidence Accepted</strong><p>Credible on desk review. It is not field verification.</p></div><div className={styles.warningBox}><strong>Needs More Information</strong><p>The report stays open and assigned to you.</p></div><div className={styles.errorBox}><strong>Not Substantiated</strong><p>Keep this distinct from no action being required.</p></div></aside></form></section>;

  if (stage === "request") return <section className={styles.page}><Heading eyebrow="My Cases / Information request" title="Request more information" description="Tell the observer what is missing so the report can continue through review." /><form className={styles.reviewGrid} onSubmit={sendRequest}><section className={styles.card}><h2>What information is missing?</h2><p className={styles.muted}>This records Question 1 as “No — more information is required”.</p><div className={styles.checkboxGroup}>{[["clearer-photo", "A clearer photograph showing the issue"], ["wider-photo", "A wider photograph of the surrounding reef"], ["location", "A more accurate location"], ["details", "Additional observation details"]].map(([value, label]) => <label key={value}><input type="checkbox" checked={requestItems.includes(value)} onChange={() => toggleRequestItem(value)} />{label}</label>)}</div><label className={styles.field}>Message to the observer *<textarea maxLength={500} value={requestMessage} onChange={(event) => setRequestMessage(event.target.value)} aria-invalid={Boolean(requestError)} /></label>{requestError && <p className={styles.errorText} role="alert">{requestError}</p>}<div className={styles.actions}><button className={styles.secondaryButton} type="button" onClick={() => setStage("detail")}>Cancel</button><button className={styles.primaryButton} type="submit">Send request</button></div></section><aside className={styles.sidePanel}><h2>Case effect</h2><p className={styles.pendingChip}>Needs More Information</p><h3>Observer sees</h3><strong>More information needed</strong><div className={styles.purpleBox}><strong>Ownership retained</strong><p>{currentCoordinator} remains the active Case Coordinator.</p></div></aside></form></section>;

  if (stage === "request-sent") return <section className={styles.page}><Heading eyebrow={`My Cases / ${report.reportReference}`} title="Information request sent" description="The report remains open and assigned to you while the observer response is outstanding." /><section className={`${styles.card} ${styles.resultCard}`}><span className={styles.successIcon} aria-hidden="true">✓</span><h2>More information needed</h2><p>The request and case status are saved in the shared frontend prototype state.</p><div className={styles.infoBox}><strong>Message to observer</strong><p>{requestMessage}</p></div><div className={styles.actions}><Link className={styles.secondaryButton} href="/coordinator/my-cases">Return to My Cases</Link><button className={styles.primaryButton} type="button" onClick={() => setStage("detail")}>View assigned case</button></div></section></section>;

  if (stage === "response") return <section className={styles.page}><Heading eyebrow="My Cases / Case decision" title="4. Choose the next response" description="Select the most appropriate next step for this evidence-accepted report." /><form className={styles.reviewGrid} onSubmit={saveResponse}><section className={styles.card}><h2>Report {report.reportReference}</h2><p className={styles.muted}>Evidence Accepted — {report.threat} — {report.generalLocation}</p><fieldset className={styles.optionCards}><legend className="sr-only">Response type</legend><label><input type="radio" name="response" checked={responseType === "monitoring"} onChange={() => setResponseType("monitoring")} /><span><strong>Monitoring Only</strong><small>Record Monitoring Recommended. No intervention is promised.</small></span></label><label><input type="radio" name="response" checked={responseType === "referral"} onChange={() => setResponseType("referral")} /><span><strong>Refer / Share for Possible Response</strong><small>Sharing does not mean the contact has accepted responsibility.</small></span></label><label><input type="radio" name="response" checked={responseType === "intervention"} onChange={() => setResponseType("intervention")} /><span><strong>Intervention Required</strong><small>Record Intervention Recommended. This is not a guarantee.</small></span></label></fieldset><label className={styles.field}>Decision note <span>Optional</span><textarea value={responseNote} onChange={(event) => setResponseNote(event.target.value)} /></label>{responseError && <p className={styles.errorText} role="alert">{responseError}</p>}<div className={styles.actions}><button className={styles.secondaryButton} type="button" onClick={() => setStage("assess")}>Back</button><button className={styles.primaryButton} type="submit">Record response</button></div></section><aside className={styles.sidePanel}><h2>Honest status language</h2><div className={styles.warningBox}><strong>Referral</strong><p>Shared for consideration means shared, not accepted.</p></div><div className={styles.purpleBox}><strong>Intervention</strong><p>Intervention Recommended remains open unless a valid closure is recorded.</p></div><div className={styles.infoBox}><strong>Monitoring</strong><p>Monitoring Recommended records the coordinator decision.</p></div></aside></form></section>;

  if (stage === "response-saved") return <section className={styles.page}><Heading eyebrow={`My Cases / ${report.reportReference}`} title="Response decision recorded" description="The recommendation has been saved without promising completed conservation action." /><section className={`${styles.card} ${styles.resultCard}`}><span className={styles.successIcon} aria-hidden="true">✓</span><h2>{savedResponse}</h2><p>{responseNote}</p><div className={styles.warningBox}><strong>Case remains open by default</strong><p>A recommendation is not the same as confirmed action. Close only when one of the valid outcome reasons applies.</p></div><div className={styles.actions}><Link className={styles.secondaryButton} href="/coordinator/my-cases">Keep case open</Link><button className={styles.primaryButton} type="button" onClick={() => setStage("close")}>5. Record a closure outcome</button></div></section></section>;

  if (stage === "referral") return <section className={styles.page}><Heading eyebrow="My Cases / Referral" title="Share for possible response" description="Send the report for consideration, or record that no participating response partner is available." /><form className={styles.card} onSubmit={confirmReferral}><h2>Sharing summary</h2><p className={styles.muted}>Report {report.reportReference} — {report.threat} — {report.generalLocation}</p><div className={styles.referralGrid}><label className={styles.field}>Conservation contact *<select value={responder} onChange={(event) => setResponder(event.target.value)} aria-invalid={Boolean(referralError)}><option value="">Select a contact</option><option value="reef-organisation">Reef conservation contact</option><option value="marine-park-team">Marine park contact</option></select></label><aside className={styles.warningBox}><strong>Sharing status</strong><p>The observer sees that the case was shared, not that action is guaranteed.</p></aside><label className={`${styles.field} ${styles.fullWidth}`}>Sharing note *<textarea value={referralNote} onChange={(event) => setReferralNote(event.target.value)} /></label></div>{referralError && <p className={styles.errorText} role="alert">{referralError}</p>}<div className={styles.splitActions}><button className={styles.secondaryButton} type="button" onClick={closeWithoutPartner}>No partner available</button><button className={styles.primaryButton} type="submit">Confirm sharing</button></div></form></section>;

  if (stage === "close") return <section className={styles.page}><Heading eyebrow="My Cases / Close report" title="5. Choose a closure reason" description="Only reasons compatible with the recorded assessment and response are available." /><form className={styles.reviewGrid} onSubmit={closeCase}><section className={styles.card}><fieldset className={styles.closureList}><legend>Select one closure reason</legend>{allowedClosures.map((item) => <label key={item.value}><input type="radio" name="closure" checked={closureReason === item.value} onChange={() => { setClosureReason(item.value); setClosureError(""); }} /><span><strong>{item.label}</strong><small>{item.observer}</small></span></label>)}</fieldset><label className={styles.field}>Closure note *<textarea value={closureNote} onChange={(event) => setClosureNote(event.target.value)} aria-invalid={Boolean(closureError)} /></label>{closureError && <p className={styles.errorText} role="alert">{closureError}</p>}</section><aside className={styles.sidePanel}><h2>Before closing</h2><ul className={styles.checkList}><li>One compatible reason selected</li><li>Explanation recorded</li><li>Observer wording mapped</li><li>Who and when recorded</li><li>Report retained in history</li></ul><div className={styles.errorBox}><strong>Contradictory outcomes are blocked</strong><p>For example, evidence accepted cannot later be closed as Not Substantiated.</p></div><div className={styles.actions}><button className={styles.secondaryButton} type="button" onClick={() => setStage(reviewOutcome === "not_substantiated" ? "assess" : reviewOutcome === "referral" ? "referral" : "response-saved")}>Back</button><button className={styles.dangerButton} type="submit">Close case</button></div></aside></form></section>;

  return <section className={styles.page}><Heading eyebrow={`My Cases / ${report.reportReference}`} title="Case outcome recorded" description="The closure reason, observer wording and case activity have been saved." /><section className={`${styles.card} ${styles.resultCard}`}><span className={styles.successIcon} aria-hidden="true">✓</span><h2>{closure?.label ?? "Case closed"}</h2><p>Report {report.reportReference} now has an honest, traceable outcome.</p><div className={styles.infoBox}><strong>Message shown to observer</strong><p>{closure?.observer}</p></div><p className={styles.muted}><strong>Recorded by {currentCoordinator}</strong></p><div className={styles.actions}><Link className={styles.secondaryButton} href="/coordinator/report-queue">Return to queue</Link><button className={styles.primaryButton} type="button" onClick={() => setStage("detail")}>View recorded case</button></div></section></section>;
}
