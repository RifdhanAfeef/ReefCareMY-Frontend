"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getCoordinatorQueue } from "@/lib/api/coordinatorApi";
import type { CoordinatorQueueResult } from "@/lib/api/types";
import { readStoredAuth } from "@/lib/api/token-store";
import styles from "./triage.module.css";

const pageSize = 20;

type LoadState = "loading" | "loaded" | "error";

function waitingTime(hours?: number) {
  if (hours == null) return "—";
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
  const [ownership, setOwnership] = useState("all");
  const currentUserId = readStoredAuth()?.user.id;

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
        const isClaimed = Boolean(report.owner) || Boolean(report.claimedAt);
        const matchesOwnership =
          ownership === "all" ||
          (ownership === "unclaimed" && !isClaimed) ||
          (ownership === "mine" && report.owner?.id === currentUserId) ||
          (ownership === "claimed" && isClaimed);
        return matchesSearch && matchesSite && matchesOwnership;
      }),
    [currentUserId, items, ownership, search, site],
  );

  const total = result?.total ?? 0;
  const hasAllReportsContract = items.length === 0 || items.every((item) =>
    Object.prototype.hasOwnProperty.call(item, "owner") &&
    Object.prototype.hasOwnProperty.call(item, "statusCode"),
  );
  const actualPageSize = result?.pageSize || pageSize;
  const totalPages = Math.max(1, Math.ceil(total / actualPageSize));
  const firstItem = total === 0 ? 0 : (page - 1) * actualPageSize + 1;
  const lastItem = Math.min(page * actualPageSize, total);

  function changePage(nextPage: number) {
    setSearch("");
    setSite("all");
    setOwnership("all");
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
        <p>Review every submitted report and see whether it is unclaimed, claimed or already progressing through review.</p>
      </header>

      <section className={styles.card}>
        <div className={styles.queueCardHeading}>
          <h2>All submitted reports</h2>
          {state === "loaded" && (
            <span className={styles.pendingChip}>{total} reports</span>
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
            {!hasAllReportsContract && (
              <div className={styles.warningBox} role="status">
                <strong>The backend is still returning the old unclaimed-only queue shape</strong>
                <p>Claimed reports cannot appear until this endpoint returns statusCode, owner and claimedAt for every submitted report.</p>
              </div>
            )}
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
              <label>
                Ownership on this page
                <select value={ownership} onChange={(event) => setOwnership(event.target.value)}>
                  <option value="all">All reports</option>
                  <option value="unclaimed">Unclaimed</option>
                  <option value="claimed">Claimed</option>
                  <option value="mine">Claimed by me</option>
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
                      <th>Owner</th>
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
                        <td>{report.owner ? "—" : waitingTime(report.hoursInQueue)}</td>
                        <td>{report.owner?.displayName ?? "Unclaimed"}</td>
                        <td>
                          {!report.owner && !report.claimedAt ? (
                            <Link className={styles.tableLink} href={`/coordinator/reports/${report.reportReference}?claim=1`}>
                              Review and claim<span className="sr-only"> {report.reportReference}</span>
                            </Link>
                          ) : report.owner?.id === currentUserId ? (
                            <Link className={styles.tableLink} href={`/coordinator/reports/${report.reportReference}`}>
                              View claimed case<span className="sr-only"> {report.reportReference}</span>
                            </Link>
                          ) : (
                            <span className={styles.muted}>Claimed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {reports.length === 0 && (
              <div className={styles.emptyState} role="status">
                <strong>{items.length === 0 ? "No reports were returned" : "No matching reports"}</strong>
                <p>
                  {items.length === 0
                    ? "The backend did not return any submitted reports for this page."
                    : "Change the search, site or ownership filter to view other reports on this page."}
                </p>
              </div>
            )}

            {total > 0 && (
              <nav className={styles.pagination} aria-label="Report queue pages">
                <p aria-live="polite">
                  Showing {firstItem}–{lastItem} of {total} reports
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
