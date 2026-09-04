"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getCoordinatorQueue } from "@/lib/api/coordinatorApi";
import type { CoordinatorQueueResult } from "@/lib/api/types";
import styles from "./triage.module.css";

const pageSize = 20;

type LoadState = "loading" | "loaded" | "error";

function waitingTime(hours: number) {
  if (hours < 1) return "Less than 1 hour";
  const roundedHours = Math.round(hours);
  return `${roundedHours} ${roundedHours === 1 ? "hour" : "hours"}`;
}

export function ReportQueue() {
  const [result, setResult] = useState<CoordinatorQueueResult | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [search, setSearch] = useState("");
  const [site, setSite] = useState("all");

  useEffect(() => {
    let cancelled = false;

    getCoordinatorQueue(page, pageSize)
      .then((queueResult) => {
        if (cancelled) return;
        setResult(queueResult);
        setState("loaded");
      })
      .catch((requestError) => {
        if (cancelled) return;
        setError(
          requestError instanceof Error
            ? requestError.message
            : "The report queue could not be loaded.",
        );
        setState("error");
      });

    return () => {
      cancelled = true;
    };
  }, [page, reloadKey]);

  const items = useMemo(() => result?.items ?? [], [result]);
  const sites = useMemo(
    () => Array.from(new Set(items.map((record) => record.area))).sort(),
    [items],
  );
  const reports = useMemo(
    () =>
      items.filter((report) => {
        const query = search.trim().toLowerCase();
        const matchesSearch =
          !query ||
          report.reportReference.toLowerCase().includes(query) ||
          report.threat.toLowerCase().includes(query);
        const matchesSite = site === "all" || report.area === site;
        return matchesSearch && matchesSite;
      }),
    [items, search, site],
  );

  const total = result?.total ?? 0;
  const actualPageSize = result?.pageSize || pageSize;
  const totalPages = Math.max(1, Math.ceil(total / actualPageSize));
  const firstItem = total === 0 ? 0 : (page - 1) * actualPageSize + 1;
  const lastItem = Math.min(page * actualPageSize, total);

  function changePage(nextPage: number) {
    setSearch("");
    setSite("all");
    setState("loading");
    setError(null);
    setPage(nextPage);
  }

  function retryLoad() {
    setState("loading");
    setError(null);
    setReloadKey((current) => current + 1);
  }

  return (
    <section className={styles.page}>
      <header className={`${styles.heading} ${styles.queuePageHeading}`}>
        <p className={styles.eyebrow}>Coordinator workspace / Report intake</p>
        <h1>Submitted reports</h1>
        <p>Review and claim reports that are currently available in the coordinator queue.</p>
      </header>

      <section className={styles.card}>
        <div className={styles.queueCardHeading}>
          <h2>Available reports</h2>
          {state === "loaded" && (
            <span className={styles.pendingChip}>{total} available</span>
          )}
        </div>

        {state === "loading" && (
          <div className={styles.queueMessage} role="status">
            <strong>Loading report queue…</strong>
            <p>Retrieving the latest available reports from ReefCare MY.</p>
          </div>
        )}

        {state === "error" && (
          <div className={styles.errorBox} role="alert">
            <strong>Report queue unavailable</strong>
            <p>{error}</p>
            <button
              className={styles.secondaryButton}
              type="button"
              onClick={retryLoad}
            >
              Try again
            </button>
          </div>
        )}

        {state === "loaded" && result && (
          <>
            <div className={styles.filters}>
              <label>
                Search this page
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Report reference or threat"
                />
              </label>
              <label>
                Site on this page
                <select value={site} onChange={(event) => setSite(event.target.value)}>
                  <option value="all">All sites</option>
                  {sites.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
            </div>

            {reports.length > 0 && (
              <div className={styles.tableWrap}>
                <table>
                  <thead>
                    <tr>
                      <th>Report reference</th>
                      <th>Threat type</th>
                      <th>General site</th>
                      <th>Status</th>
                      <th>Waiting</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report) => (
                      <tr key={report.reportReference}>
                        <td><strong>{report.reportReference}</strong></td>
                        <td>{report.threat}</td>
                        <td>{report.area}</td>
                        <td><span className={styles.receivedChip}>{report.statusLabel}</span></td>
                        <td>{waitingTime(report.hoursInQueue)}</td>
                        <td>
                          <Link
                            className={styles.tableLink}
                            href={`/coordinator/reports/${report.reportReference}`}
                          >
                            Review and claim
                            <span className="sr-only"> {report.reportReference}</span>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {reports.length === 0 && (
              <div className={styles.emptyState} role="status">
                <strong>{items.length === 0 ? "No reports are waiting" : "No matching reports"}</strong>
                <p>
                  {items.length === 0
                    ? "Newly submitted reports will appear here when they are available to claim."
                    : "Change the search or site filter to view other reports on this page."}
                </p>
              </div>
            )}

            {total > 0 && (
              <nav className={styles.pagination} aria-label="Report queue pages">
                <p aria-live="polite">
                  Showing {firstItem}–{lastItem} of {total} available reports
                </p>
                <div>
                  <button
                    className={styles.secondaryButton}
                    type="button"
                    disabled={page <= 1}
                    onClick={() => changePage(page - 1)}
                  >
                    Previous
                  </button>
                  <span>Page {page} of {totalPages}</span>
                  <button
                    className={styles.secondaryButton}
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => changePage(page + 1)}
                  >
                    Next
                  </button>
                </div>
              </nav>
            )}
          </>
        )}
      </section>
    </section>
  );
}
