"use client";

import Link from "next/link";
import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  claimReport,
  closeCase as closeCoordinatorCase,
  getCoordinatorCase,
  getCoordinatorEvidence,
  recordEvidenceAssessment,
  recordCaseDecision,
  requestMoreInformation,
  startReview,
} from "@/lib/api/coordinatorApi";
import type { ClaimedCase, ClosureReasonCode, CoordinatorCase, ResponseType } from "@/lib/api/types";
import { userFacingError } from "@/lib/api/user-facing-error";
import { formatDateTime } from "@/lib/format/date";
import { closureReasons, type ReviewOutcome } from "./triage-data";
import styles from "./triage.module.css";

type Stage = "detail" | "assess" | "request" | "request-sent" | "response" | "response-saved" | "referral" | "close" | "closed";
type EvidenceAnswer = "yes" | "no" | "";
type DuplicateAnswer = "yes" | "no" | "unsure" | "";
type RouteState = "claim" | "loading" | "ready" | "error";

const requestChoices = [
  ["clearer-photo", "A clearer photograph showing the issue"],
  ["wider-photo", "A wider photograph of the surrounding reef"],
  ["location", "A more accurate location"],
  ["details", "Additional observation details"],
] as const;

const responseLabels: Record<ResponseType, string> = {
  monitoring_only: "Monitoring Recommended",
  refer_or_share: "Shared for Possible Response",
  intervention_required: "Intervention Recommended",
};

function Heading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <header className={styles.heading}><p className={styles.eyebrow}>{eyebrow}</p><h1>{title}</h1><p>{description}</p></header>;
}

function displayDateTime(value?: string) {
  if (!value) return "Not provided";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : formatDateTime(parsed);
}

function formatFieldName(value: string) {
  return value.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").replace(/^./, (letter) => letter.toUpperCase());
}

function SecureEvidencePreview({ reportReference, evidenceId }: { reportReference: string; evidenceId: number }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let objectUrl = "";

    getCoordinatorEvidence(reportReference, evidenceId)
      .then((evidence) => {
        objectUrl = URL.createObjectURL(evidence);
        if (cancelled) URL.revokeObjectURL(objectUrl);
        else setEvidenceUrl(objectUrl);
      })
      .catch((requestError) => {
        if (!cancelled) setError(userFacingError(requestError, "The evidence image could not be loaded."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [evidenceId, reportReference, retryKey]);

  function retryEvidence() {
    setLoading(true);
    setError("");
    setRetryKey((value) => value + 1);
  }

  return <div className={styles.evidenceAction}>
    {loading && <div className={styles.evidenceLoading} role="status">Loading evidence…</div>}
    {evidenceUrl && <Image className={styles.evidencePreview} src={evidenceUrl} alt={`Submitted evidence ${evidenceId}`} width={320} height={240} unoptimized />}
    {error && <div><p className={styles.errorText} role="alert">{error}</p><button className={styles.evidenceButton} type="button" onClick={retryEvidence}>Try again</button></div>}
  </div>;
}

function EvidenceRecords({ reportReference, evidence }: { reportReference: string; evidence: CoordinatorCase["evidence"] }) {
  if (evidence.length === 0) {
    return <div className={styles.queueMessage} role="status"><strong>No evidence metadata was returned</strong><p>The case can still be reviewed using the submitted observation details.</p></div>;
  }

  return <div className={styles.evidenceRecords}>{evidence.map((item, index) => {
    const fields = Object.entries(item).filter(([key, value]) => key !== "evidenceId" && (typeof value === "string" || typeof value === "number" || typeof value === "boolean"));
    return <article className={styles.evidenceRecord} key={item.evidenceId}>
      <SecureEvidencePreview reportReference={reportReference} evidenceId={item.evidenceId} />
      <div><strong>Evidence {index + 1}</strong>{fields.length === 0 && <p className={styles.muted}>Evidence is attached to this report.</p>}{fields.length > 0 && <dl className={styles.compactDetails}>{fields.map(([key, value]) => <div key={key}><dt>{formatFieldName(key)}</dt><dd>{String(value)}</dd></div>)}</dl>}</div>
    </article>;
  })}</div>;
}

export function CoordinatorCaseRoute({ reportReference, startWithClaim = false }: { reportReference: string; startWithClaim?: boolean }) {
  const [routeState, setRouteState] = useState<RouteState>(startWithClaim ? "claim" : "loading");
  const [report, setReport] = useState<CoordinatorCase | null>(null);
  const [error, setError] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [claimConfirmation, setClaimConfirmation] = useState<ClaimedCase | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (startWithClaim && reloadKey === 0) return;
    let cancelled = false;
    getCoordinatorCase(reportReference).then((caseRecord) => {
      if (cancelled) return;
      setReport(caseRecord);
      setRouteState("ready");
    }).catch((requestError) => {
      if (cancelled) return;
      setError(userFacingError(requestError, "The case could not be loaded."));
      setRouteState("error");
    });
    return () => { cancelled = true; };
  }, [reloadKey, reportReference, startWithClaim]);

  async function confirmClaim() {
    setClaiming(true);
    setError("");
    try {
      const claimedCase = await claimReport(reportReference);
      setClaimConfirmation(claimedCase);

      let caseRecord: CoordinatorCase;
      try {
        caseRecord = await getCoordinatorCase(reportReference);
      } catch (requestError) {
        setError(`The report was claimed successfully, but its details could not be loaded. ${userFacingError(requestError, "Try loading the case again.")}`);
        setRouteState("error");
        return;
      }

      if (window.location.protocol !== "about:") {
        window.history.replaceState(
          window.history.state,
          "",
          `/coordinator/reports/${encodeURIComponent(reportReference)}`,
        );
      }
      setReport(caseRecord);
      setRouteState("ready");
    } catch (requestError) {
      setError(userFacingError(requestError, "The report could not be claimed."));
    } finally {
      setClaiming(false);
    }
  }

  async function refreshCase() {
    const caseRecord = await getCoordinatorCase(reportReference);
    setReport(caseRecord);
    return caseRecord;
  }

  if (routeState === "claim") return <section className={styles.page}>
    <Heading eyebrow={`Report intake / ${reportReference}`} title="Claim this report" description="Become the active Case Coordinator before opening protected evidence and decision controls." />
    <section className={styles.card}>
      <h2>Incoming report</h2>
      <div className={styles.summaryGrid}><div><span>Report reference</span><strong>{reportReference}</strong></div><div><span>Current queue state</span><strong>Available to claim</strong></div></div>
      <aside className={styles.warningBox}><strong>Claiming records ownership — not a verdict</strong><p>You will become responsible for reviewing this report. Its evidence status will not change until you assess it.</p></aside>
      {error && <p className={styles.errorText} role="alert">{error}</p>}
      <div className={styles.splitActions}><Link className={styles.secondaryButton} href="/coordinator/report-queue">Cancel</Link><button className={styles.primaryButton} type="button" onClick={confirmClaim} disabled={claiming}>{claiming ? "Claiming report…" : "Claim and open report"}</button></div>
    </section>
  </section>;

  if (routeState === "loading") return <section className={styles.page}><Heading eyebrow="Coordinator workspace" title="Loading case" description="Retrieving the latest protected case details from ReefCare MY." /><div className={styles.queueMessage} role="status"><strong>Loading report {reportReference}…</strong></div></section>;

  if (routeState === "error" || !report) return <section className={styles.page}>
    <Heading eyebrow="Coordinator workspace" title="Case unavailable" description="This case could not be opened for the signed-in coordinator." />
    <section className={styles.card}><div className={styles.errorBox} role="alert"><strong>Unable to open report {reportReference}</strong><p>{error}</p></div><div className={styles.actions}><Link className={styles.secondaryButton} href="/coordinator/report-queue">Return to report queue</Link><button className={styles.primaryButton} type="button" onClick={() => { setRouteState("loading"); setError(""); setReloadKey((value) => value + 1); }}>Try again</button></div></section>
  </section>;

  return <CaseWorkflow report={report} refreshCase={refreshCase} claimConfirmation={claimConfirmation} />;
}

function CaseWorkflow({ report, refreshCase, claimConfirmation }: { report: CoordinatorCase; refreshCase: () => Promise<CoordinatorCase>; claimConfirmation: ClaimedCase | null }) {
  const [stage, setStage] = useState<Stage>("detail");
  const [usable, setUsable] = useState<EvidenceAnswer>("");
  const [credible, setCredible] = useState<EvidenceAnswer>("");
  const [duplicate, setDuplicate] = useState<DuplicateAnswer>("");
  const [decisionNote, setDecisionNote] = useState("");
  const [assessmentError, setAssessmentError] = useState("");
  const [requestItems, setRequestItems] = useState<string[]>(["clearer-photo", "details"]);
  const [requestMessage, setRequestMessage] = useState("Please add a wider photograph and clarify how the issue was positioned on the reef.");
  const [requestError, setRequestError] = useState("");
  const [requestFromAssessment, setRequestFromAssessment] = useState(false);
  const [responseType, setResponseType] = useState<ResponseType | "">("");
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
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState(report.statusCode);
  const closure = closureReasons.find((item) => item.value === closureReason);
  const allowedClosures = useMemo(() => closureReasons.filter((item) => item.allowedOutcomes.includes(reviewOutcome)), [reviewOutcome]);

  const toggleRequestItem = (value: string) => setRequestItems((items) => items.includes(value) ? items.filter((item) => item !== value) : [...items, value]);
  const beginInfoRequest = () => { setUsable("no"); setCredible(""); setDuplicate(""); setRequestFromAssessment(false); setStage("request"); };

  async function beginAssessment() {
    if (currentStatus !== "claimed") {
      setStage(currentStatus === "evidence_accepted" ? "response" : "assess");
      return;
    }

    setPendingAction("start-review");
    setAssessmentError("");
    try {
      const result = await startReview(report.reportReference);
      setCurrentStatus(result.statusCode);
      await refreshCase();
      setStage("assess");
    } catch (requestError) {
      setAssessmentError(userFacingError(requestError, "The evidence review could not be started."));
    } finally {
      setPendingAction(null);
    }
  }

  async function saveAssessment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!usable || (usable === "yes" && (!credible || !duplicate))) { setAssessmentError("Answer all required evidence questions before continuing."); return; }
    setAssessmentError("");
    if (usable === "no") { setReviewOutcome(null); setRequestFromAssessment(true); setStage("request"); return; }
    setPendingAction("assessment");
    try {
      const result = await recordEvidenceAssessment(report.reportReference, {
        evidenceUsable: true,
        observationCredible: credible === "yes",
        notes: [`Related report check: ${duplicate}.`, decisionNote.trim()].filter(Boolean).join(" "),
        relatedReportState: duplicate,
      });
      setCurrentStatus(result.status);
      if (result.status === "evidence_accepted") {
        setStage("response");
      } else if (result.status === "closed_not_substantiated") {
        setReviewOutcome("not_substantiated");
        setClosureReason("not_substantiated");
        setClosureNote("The submitted observation could not be substantiated from the available evidence.");
        setStage("closed");
      } else {
        await refreshCase();
        setStage("detail");
      }
    } catch (requestError) {
      setAssessmentError(userFacingError(requestError, "The evidence assessment could not be saved."));
    } finally {
      setPendingAction(null);
    }
  }

  async function sendRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const selectedLabels = requestChoices.filter(([value]) => requestItems.includes(value)).map(([, label]) => label);
    const reason = `${selectedLabels.join("; ")}. ${requestMessage.trim()}`.trim();
    if (requestItems.length === 0 || !requestMessage.trim()) { setRequestError("Select at least one missing item and enter a message to the observer."); return; }
    if (reason.length > 500) { setRequestError("The selected items and message must total 500 characters or fewer."); return; }
    setPendingAction("request"); setRequestError("");
    try {
      if (requestFromAssessment) {
        const result = await recordEvidenceAssessment(report.reportReference, {
          evidenceUsable: false,
          notes: reason,
        });
        setCurrentStatus(result.status);
      } else {
        await requestMoreInformation(report.reportReference, reason);
        setCurrentStatus("needs_more_info");
      }
      setStage("request-sent");
    }
    catch (requestErrorValue) { setRequestError(userFacingError(requestErrorValue, "The information request could not be sent.")); }
    finally { setPendingAction(null); }
  }

  function combinedDecisionNotes() {
    return [responseNote.trim(), `Desk review: evidence usable; reported threat plausible; related report check: ${duplicate}.`, decisionNote.trim()].filter(Boolean).join(" ");
  }

  async function saveResponse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!responseType) { setResponseError("Choose the most appropriate response before continuing."); return; }
    setResponseError("");
    if (responseType === "refer_or_share") { setReviewOutcome("referral"); setStage("referral"); return; }
    if (currentStatus !== "evidence_accepted") {
      setResponseError("A response can only be recorded after the backend accepts the evidence assessment.");
      return;
    }
    setPendingAction("decision");
    try {
      await recordCaseDecision(report.reportReference, { responseType, notes: combinedDecisionNotes() });
      setReviewOutcome(responseType === "monitoring_only" ? "monitoring" : "intervention");
      setSavedResponse(responseLabels[responseType]); setClosureReason(""); setClosureNote(""); setStage("response-saved");
    } catch (requestErrorValue) { setResponseError(userFacingError(requestErrorValue, "The response decision could not be recorded.")); }
    finally { setPendingAction(null); }
  }

  async function confirmReferral(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!responder || !referralNote.trim()) { setReferralError("Select a conservation contact and enter a sharing note."); return; }
    setPendingAction("referral"); setReferralError("");
    try {
      await recordCaseDecision(report.reportReference, { responseType: "refer_or_share", notes: `${combinedDecisionNotes()} ${referralNote.trim()}`.trim(), referredTo: responder });
      setReviewOutcome("referral"); setSavedResponse(responseLabels.refer_or_share); setClosureReason("referred_other_org"); setClosureNote(referralNote.trim()); setStage("close");
    } catch (requestErrorValue) { setReferralError(userFacingError(requestErrorValue, "The referral decision could not be recorded.")); }
    finally { setPendingAction(null); }
  }

  async function closeWithoutPartner() {
    setPendingAction("referral"); setReferralError("");
    try {
      await recordCaseDecision(report.reportReference, { responseType: "refer_or_share", notes: `${combinedDecisionNotes()} No participating response partner is currently available.`.trim() });
      setReviewOutcome("referral"); setSavedResponse(responseLabels.refer_or_share); setClosureReason("no_responsible_partner"); setClosureNote("No participating response partner is currently available for this report."); setStage("close");
    } catch (requestErrorValue) { setReferralError(userFacingError(requestErrorValue, "The response decision could not be recorded.")); }
    finally { setPendingAction(null); }
  }

  async function submitClosure(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!closureReason || !allowedClosures.some((item) => item.value === closureReason)) { setClosureError("Select one valid closure reason for the recorded assessment and response."); return; }
    if (!closureNote.trim()) { setClosureError("Enter a closure note explaining the recorded outcome."); return; }
    setPendingAction("closure"); setClosureError("");
    try {
      await closeCoordinatorCase(report.reportReference, { closureReasonCode: closureReason, publicClosureNote: closureNote.trim(), ...(reviewOutcome === "referral" && responder ? { referredTo: responder } : {}) });
      setStage("closed");
    } catch (requestErrorValue) { setClosureError(userFacingError(requestErrorValue, "The case could not be closed.")); }
    finally { setPendingAction(null); }
  }

  async function returnToDetail() {
    setPendingAction("refresh");
    try { await refreshCase(); setStage("detail"); }
    catch (requestErrorValue) { setResponseError(userFacingError(requestErrorValue, "The updated case could not be loaded.")); }
    finally { setPendingAction(null); }
  }

  const exactLocation = report.preciseLocation?.latitude != null && report.preciseLocation.longitude != null ? `${report.preciseLocation.latitude.toFixed(6)}, ${report.preciseLocation.longitude.toFixed(6)}` : "No exact coordinates were submitted";
  const uncertainty = report.preciseLocation?.uncertaintyMetres != null ? `Estimated uncertainty: ${report.preciseLocation.uncertaintyMetres} m` : null;

  if (stage === "detail") return <section className={styles.page}>
    <Heading eyebrow={`My Cases / ${report.reportReference}`} title="Review reef observation" description="Review the submitted evidence, observation details and protected location before making a decision." />
    <span className={styles.ownerChip}>Owned by {report.owner.displayName}</span>
    {claimConfirmation && <div className={styles.successBox} role="status"><strong>{claimConfirmation.statusLabel}: report assigned successfully</strong><p>Claimed at {displayDateTime(claimConfirmation.claimedAt)}. You can now begin reviewing its evidence.</p></div>}
    <div className={styles.reviewGrid}><section className={styles.card}>
      <h2>Submitted evidence</h2><p className={styles.muted}>Evidence provided by the observer with this report.</p><EvidenceRecords reportReference={report.reportReference} evidence={report.evidence} />
      <dl className={styles.detailList}><div><dt>Threat type</dt><dd>{report.threat}</dd></div><div><dt>Observed</dt><dd>{displayDateTime(report.observedAt)}</dd></div><div><dt>Estimated depth</dt><dd>{report.estimatedDepthMetres == null ? "Not provided" : `${report.estimatedDepthMetres} m`}</dd></div><div><dt>Description</dt><dd>{report.description}</dd></div><div><dt>General area</dt><dd>{report.area ?? "Not provided"}</dd></div><div><dt>Submitted</dt><dd>{displayDateTime(report.submittedAt)}</dd></div></dl>
      <div className={styles.protectedBox}><strong>Authorised exact location</strong><p>{exactLocation}</p>{uncertainty && <small>{uncertainty}</small>}</div>
    </section><aside className={styles.sidePanel}><h2>Case control</h2><dl className={styles.detailList}><div><dt>Active owner</dt><dd>{report.owner.displayName}</dd></div><div><dt>Status</dt><dd>{report.statusLabel}</dd></div></dl><div className={styles.infoBox}><strong>Review type</strong><p>Your assessment is a desk review, not an on-site confirmation.</p></div>{assessmentError && <p className={styles.errorText} role="alert">{assessmentError}</p>}<button className={styles.primaryButton} type="button" onClick={beginAssessment} disabled={pendingAction !== null || !["claimed", "under_review", "evidence_accepted"].includes(currentStatus)}>{pendingAction === "start-review" ? "Starting review…" : currentStatus === "evidence_accepted" ? "Continue to response" : "Start evidence assessment"}</button><button className={styles.secondaryButton} type="button" onClick={beginInfoRequest} disabled={pendingAction !== null}>Request more information</button></aside></div>
  </section>;

  if (stage === "assess") return <section className={styles.page}>
    <Heading eyebrow="My Cases / Evidence review" title="Assess the submitted evidence" description="Complete the evidence and related-report checks before choosing a response." />
    <form className={styles.reviewGrid} onSubmit={saveAssessment}><section className={styles.card}><h2>Report {report.reportReference}</h2>
      <fieldset className={styles.radioGroup}><legend>1. Is the evidence usable?</legend><label><input type="radio" name="usable" checked={usable === "yes"} onChange={() => setUsable("yes")} />Yes — the evidence can be assessed</label><label><input type="radio" name="usable" checked={usable === "no"} onChange={() => { setUsable("no"); setCredible(""); setDuplicate(""); }} />No — more information is required</label></fieldset>
      <fieldset className={styles.radioGroup} disabled={usable !== "yes"}><legend>2. Does the evidence plausibly support the reported threat?</legend><label><input type="radio" name="credible" checked={credible === "yes"} onChange={() => setCredible("yes")} />Yes — continue to a response decision</label><label><input type="radio" name="credible" checked={credible === "no"} onChange={() => setCredible("no")} />No — prepare a Not Substantiated closure</label></fieldset>
      <fieldset className={styles.radioGroup} disabled={usable !== "yes"}><legend>3. Does this appear related to an existing report?</legend><label><input type="radio" name="duplicate" checked={duplicate === "no"} onChange={() => setDuplicate("no")} />No matching report found</label><label><input type="radio" name="duplicate" checked={duplicate === "yes"} onChange={() => setDuplicate("yes")} />Yes — include the relationship in the decision note</label><label><input type="radio" name="duplicate" checked={duplicate === "unsure"} onChange={() => setDuplicate("unsure")} />Unsure — note the uncertainty</label></fieldset>
      <label className={styles.field}>Assessment note <span>Optional — saved with the evidence assessment</span><textarea value={decisionNote} onChange={(event) => setDecisionNote(event.target.value)} placeholder="Add any relevant assessment notes" /></label>{assessmentError && <p className={styles.errorText} role="alert">{assessmentError}</p>}<div className={styles.actions}><button className={styles.secondaryButton} type="button" onClick={() => setStage("detail")} disabled={pendingAction !== null}>Back to case</button><button className={styles.primaryButton} type="submit" disabled={pendingAction !== null}>{pendingAction === "assessment" ? "Saving assessment…" : "Continue"}</button></div>
    </section><aside className={styles.sidePanel}><h2>Assessment guidance</h2><div className={styles.infoBox}><strong>Review only what was submitted</strong><p>Use the photographs and observation details available in this case. Request more information whenever the evidence is unclear.</p></div></aside></form>
  </section>;

  if (stage === "request") return <section className={styles.page}>
    <Heading eyebrow="My Cases / Information request" title="Request more information" description="Tell the observer what is missing so the report can continue through review." />
    <form className={styles.reviewGrid} onSubmit={sendRequest}><section className={styles.card}><h2>What information is missing?</h2><div className={styles.checkboxGroup}>{requestChoices.map(([value, label]) => <label key={value}><input type="checkbox" checked={requestItems.includes(value)} onChange={() => toggleRequestItem(value)} />{label}</label>)}</div><label className={styles.field}>Message to the observer *<textarea value={requestMessage} onChange={(event) => setRequestMessage(event.target.value)} aria-invalid={Boolean(requestError)} /></label>{requestError && <p className={styles.errorText} role="alert">{requestError}</p>}<div className={styles.actions}><button className={styles.secondaryButton} type="button" onClick={() => setStage("detail")} disabled={pendingAction !== null}>Cancel</button><button className={styles.primaryButton} type="submit" disabled={pendingAction !== null}>{pendingAction === "request" ? "Sending…" : "Send request"}</button></div></section><aside className={styles.sidePanel}><h2>Case effect</h2><p className={styles.pendingChip}>Needs More Information</p><div className={styles.purpleBox}><strong>Ownership retained</strong><p>{report.owner.displayName} remains the active Case Coordinator.</p></div></aside></form>
  </section>;

  if (stage === "request-sent") return <section className={styles.page}><Heading eyebrow={`My Cases / ${report.reportReference}`} title="Information request sent" description="The request was saved and the report remains assigned while the observer response is outstanding." /><section className={`${styles.card} ${styles.resultCard}`}><span className={styles.successIcon} aria-hidden="true">✓</span><h2>More information needed</h2><div className={styles.infoBox}><strong>Message to observer</strong><p>{requestMessage}</p></div><div className={styles.actions}><Link className={styles.secondaryButton} href="/coordinator/report-queue">Return to queue</Link><button className={styles.primaryButton} type="button" onClick={returnToDetail} disabled={pendingAction !== null}>{pendingAction === "refresh" ? "Refreshing…" : "Refresh assigned case"}</button></div></section></section>;

  if (stage === "response") return <section className={styles.page}>
    <Heading eyebrow="My Cases / Case decision" title="Choose the next response" description="Select the most appropriate next step after completing the desk review." />
    <form className={styles.reviewGrid} onSubmit={saveResponse}><section className={styles.card}><h2>Report {report.reportReference}</h2><p className={styles.muted}>{report.threat} — {report.area ?? "Location not provided"}</p><fieldset className={styles.optionCards}><legend className="sr-only">Response type</legend><label><input type="radio" name="response" checked={responseType === "monitoring_only"} onChange={() => setResponseType("monitoring_only")} /><span><strong>Monitoring Only</strong><small>Record monitoring without promising intervention.</small></span></label><label><input type="radio" name="response" checked={responseType === "refer_or_share"} onChange={() => setResponseType("refer_or_share")} /><span><strong>Refer / Share for Possible Response</strong><small>Choose a contact before the decision is saved.</small></span></label><label><input type="radio" name="response" checked={responseType === "intervention_required"} onChange={() => setResponseType("intervention_required")} /><span><strong>Intervention Required</strong><small>Record a recommendation, not a guarantee.</small></span></label></fieldset><label className={styles.field}>Decision note <span>Optional</span><textarea value={responseNote} onChange={(event) => setResponseNote(event.target.value)} /></label>{responseError && <p className={styles.errorText} role="alert">{responseError}</p>}<div className={styles.actions}><button className={styles.secondaryButton} type="button" onClick={() => setStage("assess")} disabled={pendingAction !== null}>Back to assessment</button><button className={styles.primaryButton} type="submit" disabled={pendingAction !== null}>{pendingAction === "decision" ? "Recording…" : "Record response"}</button></div></section><aside className={styles.sidePanel}><h2>Honest status language</h2><div className={styles.warningBox}><strong>Referral</strong><p>Shared for consideration does not mean accepted.</p></div><div className={styles.infoBox}><strong>Monitoring</strong><p>Monitoring Recommended records the coordinator decision.</p></div></aside></form>
  </section>;

  if (stage === "response-saved") return <section className={styles.page}><Heading eyebrow={`My Cases / ${report.reportReference}`} title="Response decision recorded" description="The recommendation was saved without promising completed conservation action." /><section className={`${styles.card} ${styles.resultCard}`}><span className={styles.successIcon} aria-hidden="true">✓</span><h2>{savedResponse}</h2><p>{responseNote}</p>{responseError && <p className={styles.errorText} role="alert">{responseError}</p>}<div className={styles.warningBox}><strong>Case remains open by default</strong><p>A recommendation is not the same as confirmed action. Close only when a valid outcome applies.</p></div><div className={styles.actions}><button className={styles.secondaryButton} type="button" onClick={returnToDetail} disabled={pendingAction !== null}>{pendingAction === "refresh" ? "Refreshing…" : "Keep case open"}</button><button className={styles.primaryButton} type="button" onClick={() => setStage("close")}>Record a closure outcome</button></div></section></section>;

  if (stage === "referral") return <section className={styles.page}><Heading eyebrow="My Cases / Referral" title="Share for possible response" description="Record the contact and sharing note before saving the referral decision." /><form className={styles.card} onSubmit={confirmReferral}><h2>Sharing summary</h2><p className={styles.muted}>Report {report.reportReference} — {report.threat} — {report.area ?? "Location not provided"}</p><div className={styles.referralGrid}><label className={styles.field}>Conservation contact *<select value={responder} onChange={(event) => setResponder(event.target.value)} aria-invalid={Boolean(referralError)}><option value="">Select a contact</option><option value="Reef conservation contact">Reef conservation contact</option><option value="Marine park contact">Marine park contact</option></select></label><aside className={styles.warningBox}><strong>Sharing status</strong><p>The observer sees that the case was shared, not that action is guaranteed.</p></aside><label className={`${styles.field} ${styles.fullWidth}`}>Sharing note *<textarea value={referralNote} onChange={(event) => setReferralNote(event.target.value)} /></label></div>{referralError && <p className={styles.errorText} role="alert">{referralError}</p>}<div className={styles.splitActions}><button className={styles.secondaryButton} type="button" onClick={closeWithoutPartner} disabled={pendingAction !== null}>{pendingAction === "referral" ? "Recording…" : "No partner available"}</button><button className={styles.primaryButton} type="submit" disabled={pendingAction !== null}>{pendingAction === "referral" ? "Recording…" : "Record referral"}</button></div></form></section>;

  if (stage === "close") return <section className={styles.page}><Heading eyebrow="My Cases / Close report" title="Choose a closure reason" description="Only reasons compatible with the recorded assessment and response are available." /><form className={styles.reviewGrid} onSubmit={submitClosure}><section className={styles.card}><fieldset className={styles.closureList}><legend>Select one closure reason</legend>{allowedClosures.map((item) => <label key={item.value}><input type="radio" name="closure" checked={closureReason === item.value} onChange={() => { setClosureReason(item.value); setClosureError(""); }} /><span><strong>{item.label}</strong><small>{item.observer}</small></span></label>)}</fieldset><label className={styles.field}>Public closure note *<textarea value={closureNote} onChange={(event) => setClosureNote(event.target.value)} aria-invalid={Boolean(closureError)} /></label>{closureError && <p className={styles.errorText} role="alert">{closureError}</p>}</section><aside className={styles.sidePanel}><h2>Before closing</h2><ul className={styles.checkList}><li>One compatible reason selected</li><li>Observer-safe explanation recorded</li><li>Your name and completion time will be recorded</li></ul><div className={styles.actions}><button className={styles.secondaryButton} type="button" onClick={() => setStage(reviewOutcome === "not_substantiated" ? "assess" : reviewOutcome === "referral" ? "referral" : "response-saved")} disabled={pendingAction !== null}>Back</button><button className={styles.dangerButton} type="submit" disabled={pendingAction !== null}>{pendingAction === "closure" ? "Closing…" : "Close case"}</button></div></aside></form></section>;

  return <section className={styles.page}><Heading eyebrow={`My Cases / ${report.reportReference}`} title="Case outcome recorded" description="The closure reason, public note and time were saved." /><section className={`${styles.card} ${styles.resultCard}`}><span className={styles.successIcon} aria-hidden="true">✓</span><h2>{closure?.label ?? "Case closed"}</h2><p>Report {report.reportReference} now has a traceable outcome.</p><div className={styles.infoBox}><strong>Message shown to observer</strong><p>{closureNote}</p></div><div className={styles.actions}><Link className={styles.primaryButton} href="/coordinator/report-queue">Return to queue</Link></div></section></section>;
}
