"use client";

import { useEffect, useState } from "react";
import { getReportTimeline } from "@/lib/api/reportsApi";
import type { ReportTimelineEvent } from "@/lib/api/types";
import styles from "./report-timeline.module.css";

type LoadState = "loading" | "loaded" | "error";

export function ReportTimeline({ reportReference }: { reportReference: string }) {
  const [events, setEvents] = useState<ReportTimelineEvent[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getReportTimeline(reportReference)
      .then((result) => {
        if (!cancelled) {
          setEvents(result.timeline);
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
  }, [reportReference]);

  if (state === "loading") {
    return <p>Loading status history…</p>;
  }

  if (state === "error") {
    return (
      <p role="alert">{error ?? "We couldn't load this report's status history."}</p>
    );
  }

  return (
    <ol className={styles.timeline}>
      {events.map((event, index) => (
        // Rendered exactly as the backend labels it — no internal
        // status-code translation happens on the frontend (US6.2 AC4).
        <li key={`${event.occurredAt}-${index}`} className={styles.step}>
          <span className={styles.marker} aria-hidden="true" />
          <div>
            <p className={styles.label}>{event.statusLabel}</p>
            <time className={styles.date} dateTime={event.occurredAt}>
              {new Date(event.occurredAt).toLocaleString()}
            </time>
          </div>
        </li>
      ))}
    </ol>
  );
}
