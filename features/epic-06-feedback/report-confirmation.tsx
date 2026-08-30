"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import styles from "./report-confirmation.module.css";

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

// Reads the just-submitted report's summary from the URL rather than
// calling the API itself: POST /api/v1/reports is a real, mutating request
// against the live backend now, so a confirmation screen must never fire
// it just by being loaded/refreshed. The (not yet built) submit step is
// expected to call reportsApi.submitReport() itself, then navigate here
// with the result — reportReference/status/submittedAt/generalLocation
// come back from that response; threatCategory doesn't (US6.1/backend
// doc §8.3), so it's carried over from the form's own local state instead.
export function ReportConfirmation() {
  const searchParams = useSearchParams();

  const reportReference = searchParams.get("reportReference");
  const status = searchParams.get("status");
  const submittedAt = searchParams.get("submittedAt");
  const generalLocation = searchParams.get("generalLocation");
  const threatCategory = searchParams.get("threatCategory");

  if (!reportReference || !status || !submittedAt || !generalLocation || !threatCategory) {
    return (
      <p>
        We don&apos;t have your submission details here. Check{" "}
        <Link href="/my-reports">My reports</Link> instead.
      </p>
    );
  }

  return (
    <dl className={styles.summary}>
      <div className={styles.row}>
        <dt>Report ID</dt>
        <dd>{reportReference}</dd>
      </div>
      <div className={styles.row}>
        <dt>Threat type</dt>
        <dd>{threatCategory}</dd>
      </div>
      <div className={styles.row}>
        <dt>Location</dt>
        <dd>{generalLocation}</dd>
      </div>
      <div className={styles.row}>
        <dt>Submitted</dt>
        <dd>
          <time dateTime={submittedAt}>{new Date(submittedAt).toLocaleString()}</time>
        </dd>
      </div>
      <div className={styles.row}>
        <dt>Status</dt>
        <dd>{capitalize(status)}</dd>
      </div>
    </dl>
  );
}
