"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMockAppState } from "@/features/shared/mock-app-state";
import styles from "./triage.module.css";

export function ReportQueue() {
  const { cases, currentCoordinator } = useMockAppState();
  const [search, setSearch] = useState("");
  const [site, setSite] = useState("all");
  const [status, setStatus] = useState("all");
  const sites = useMemo(() => Array.from(new Set(cases.map((record) => record.generalLocation))).sort(), [cases]);
  const reports = useMemo(() => cases.filter((report) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || report.reportReference.toLowerCase().includes(query) || report.threat.toLowerCase().includes(query);
    const matchesSite = site === "all" || report.generalLocation === site;
    const matchesStatus = status === "all" || (status === "unclaimed" ? !report.owner : report.owner === currentCoordinator);
    return matchesSearch && matchesSite && matchesStatus;
  }), [cases, currentCoordinator, search, site, status]);
  const unclaimedCount = cases.filter((record) => !record.owner).length;

  return <section className={styles.page}>
    <header className={`${styles.heading} ${styles.queuePageHeading}`}><p className={styles.eyebrow}>Coordinator workspace / Report intake</p><h1>Submitted reports</h1><p>Claim an available report or check who currently owns a case.</p></header>
    <section className={styles.card}><div className={styles.queueCardHeading}><h2>Report queue</h2><span className={styles.pendingChip}>{unclaimedCount} unclaimed</span></div>
      <div className={styles.filters}><label>Search<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Report reference or threat" /></label><label>Ownership<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All reports</option><option value="unclaimed">Unclaimed</option><option value="mine">My cases</option></select></label><label>Site<select value={site} onChange={(event) => setSite(event.target.value)}><option value="all">All sites</option>{sites.map((item) => <option key={item}>{item}</option>)}</select></label></div>
      <div className={styles.tableWrap}><table><thead><tr><th>Report reference</th><th>Threat type</th><th>General site</th><th>Status</th><th>Owner</th><th>Action</th></tr></thead><tbody>{reports.map((report) => {
        const isMine = report.owner === currentCoordinator;
        const actionLabel = !report.owner ? "Review and claim" : isMine ? "Open my case" : "View access notice";
        return <tr key={report.reportReference}><td><strong>{report.reportReference}</strong></td><td>{report.threat}</td><td>{report.generalLocation}</td><td><span className={styles.receivedChip}>{report.statusLabel}</span></td><td>{report.owner ?? "Unclaimed"}</td><td><Link className={styles.tableLink} href={`/coordinator/reports/${report.reportReference}`}>{actionLabel}<span className="sr-only"> {report.reportReference}</span></Link></td></tr>;
      })}</tbody></table></div>
      {reports.length === 0 && <div className={styles.emptyState} role="status"><strong>No matching reports</strong><p>Change the search or filters to view other reports.</p></div>}
    </section>
  </section>;
}
