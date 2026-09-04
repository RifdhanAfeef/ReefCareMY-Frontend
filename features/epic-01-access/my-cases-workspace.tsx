"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api/client";
import {
  forgetRememberedClaim,
  readRememberedClaims,
  type RememberedClaim,
} from "@/lib/api/claimed-case-store";
import { getCoordinatorCase } from "@/lib/api/coordinatorApi";
import type { CoordinatorCase } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format/date";
import { StatusPill } from "./status-pill";
import styles from "./access-ui.module.css";

type LoadedCase = {
  claim: RememberedClaim;
  caseRecord: CoordinatorCase;
};

function displayDateTime(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : formatDateTime(parsed);
}

export function MyCasesWorkspace() {
  const [claims] = useState(readRememberedClaims);
  const [cases, setCases] = useState<LoadedCase[]>([]);
  const [loading, setLoading] = useState(claims.length > 0);
  const [failedCount, setFailedCount] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (claims.length === 0) return;
    let cancelled = false;

    Promise.allSettled(
      claims.map(async (claim) => ({
        claim,
        caseRecord: await getCoordinatorCase(claim.reportReference),
      })),
    ).then((results) => {
      if (cancelled) return;

      const loaded: LoadedCase[] = [];
      let failures = 0;
      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          loaded.push(result.value);
          return;
        }

        if (result.reason instanceof ApiError && [403, 404].includes(result.reason.status)) {
          forgetRememberedClaim(claims[index].reportReference);
        } else {
          failures += 1;
        }
      });

      setCases(loaded);
      setFailedCount(failures);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [claims, reloadKey]);

  function retry() {
    setLoading(true);
    setFailedCount(0);
    setReloadKey((value) => value + 1);
  }

  if (loading) {
    return (
      <section className={styles.card}>
        <div className={styles.emptyState} role="status">
          <h2 className={styles.sectionHeading}>Loading your claimed cases…</h2>
          <p>Checking current ownership with the backend.</p>
        </div>
      </section>
    );
  }

  if (claims.length === 0) {
    return (
      <section className={styles.card}>
        <div className={styles.emptyState}>
          <h2 className={styles.sectionHeading}>No claimed cases saved on this device</h2>
          <p>Reports you claim from the queue will appear here after the backend confirms ownership.</p>
          <p className={styles.muted}>Older claims and claims made on another device still require a coordinator-owned cases list endpoint.</p>
          <Link className={styles.primaryButton} href="/coordinator/report-queue">Open report queue</Link>
        </div>
      </section>
    );
  }

  return (
    <div className={styles.stack}>
      <div className={styles.notice}>
        <strong>Backend-verified cases</strong>
        Each saved report reference is reloaded through the current owned-case endpoint. Cases the backend no longer allows are not displayed.
      </div>

      {failedCount > 0 && (
        <div className={styles.warningNotice} role="alert">
          <strong>Some cases could not be checked</strong>
          {failedCount} {failedCount === 1 ? "case" : "cases"} could not be reached. Your saved references were kept.
          <div className={styles.pageActions}>
            <button className={styles.secondaryButton} type="button" onClick={retry}>Try again</button>
          </div>
        </div>
      )}

      {cases.length === 0 ? (
        <section className={styles.card}>
          <div className={styles.emptyState}>
            <h2 className={styles.sectionHeading}>No accessible claimed cases</h2>
            <p>The backend did not confirm ownership for any saved report.</p>
            <Link className={styles.primaryButton} href="/coordinator/report-queue">Open report queue</Link>
          </div>
        </section>
      ) : (
        <section className={styles.tableCard} aria-label="Cases owned by this coordinator">
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Report</th>
                  <th scope="col">Threat</th>
                  <th scope="col">General area</th>
                  <th scope="col">Claimed</th>
                  <th scope="col">Status</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {cases.map(({ claim, caseRecord }) => (
                  <tr key={caseRecord.reportReference}>
                    <td className={styles.identifier}>{caseRecord.reportReference}</td>
                    <td>{caseRecord.threat}</td>
                    <td>{caseRecord.area}</td>
                    <td>{displayDateTime(claim.claimedAt)}</td>
                    <td><StatusPill status={caseRecord.statusLabel} /></td>
                    <td><Link className={styles.textButton} href={`/coordinator/reports/${caseRecord.reportReference}`}>Open case</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
