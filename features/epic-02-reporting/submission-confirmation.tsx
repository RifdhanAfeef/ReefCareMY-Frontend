"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearDraftPhotos } from "./draft-storage";
import { useMockAppState } from "@/features/shared/mock-app-state";
import styles from "./reporting.module.css";

export function SubmissionConfirmation() {
  const router = useRouter();
  const { lastSubmission, resetReportDraft } = useMockAppState();

  async function startAnotherReport() {
    await clearDraftPhotos();
    resetReportDraft();
    router.push("/report-a-reef");
  }

  if (!lastSubmission) {
    return <section className={styles.confirmationCard}><h2>No recent submission</h2><p>Start a new report or open My Reports to review an existing observation.</p><div className={`${styles.actions} ${styles.centerActions}`}><Link className={styles.primaryButton} href="/report-a-reef">Start a report</Link><Link className={styles.secondaryButton} href="/my-reports">Open My Reports</Link></div></section>;
  }

  return (
    <section className={styles.confirmationCard}>
      <span className={styles.confirmationIcon} aria-hidden="true">✓</span>
      <h2>Your report has been received</h2>
      <p>Keep the reference below. You can follow future updates through My Reports.</p>
      <div className={styles.reference}><span>Report reference</span><strong>{lastSubmission.reportReference}</strong></div>
      <div className={styles.confirmationDetails}><div><span>Status</span><strong>{lastSubmission.statusLabel}</strong></div><div><span>General location</span><strong>{lastSubmission.generalLocation}</strong></div><div><span>Submitted</span><strong>{lastSubmission.submittedAt}</strong></div></div>
      <div className={`${styles.actions} ${styles.centerActions}`}><Link className={styles.primaryButton} href="/my-reports">View My Reports</Link><button className={styles.secondaryButton} type="button" onClick={startAnotherReport}>Start another report</button></div>
    </section>
  );
}
