"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMyReports } from "@/lib/api/reportsApi";
import type { ReportSummary } from "@/lib/api/types";
import styles from "./my-reports-list.module.css";

type LoadState = "loading" | "loaded" | "error";

export function MyReportsList() {
  const [items, setItems] = useState<ReportSummary[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getMyReports()
      .then((result) => {
        if (!cancelled) {
          setItems(result.items);
          setState("loaded");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : null);
          setState("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "loading") {
    return <p>Loading your reports…</p>;
  }

  if (state === "error") {
    return <p role="alert">{error ?? "We couldn't load your reports. Please try again."}</p>;
  }

  if (items.length === 0) {
    return <p>You haven&apos;t submitted any reports yet.</p>;
  }

  return (
    <ul className={styles.list}>
      {items.map((report) => (
        <li key={report.reportReference} className={styles.card}>
          <Link href={`/my-reports/${report.reportReference}`} className={styles.link}>
            <div className={styles.headline}>
              <span className={styles.reference}>{report.reportReference}</span>
              <span className={styles.status}>{report.statusLabel}</span>
            </div>
            <p className={styles.threat}>{report.threatCategory}</p>
            <p className={styles.location}>{report.generalLocation}</p>
            {report.outcome && <p className={styles.outcome}>{report.outcome}</p>}
            <time className={styles.date} dateTime={report.submittedAt}>
              Submitted {new Date(report.submittedAt).toLocaleDateString()}
            </time>
          </Link>
        </li>
      ))}
    </ul>
  );
}
