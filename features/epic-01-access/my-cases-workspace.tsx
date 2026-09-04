"use client";

import Link from "next/link";
import styles from "./access-ui.module.css";

export function MyCasesWorkspace() {
  return (
    <section className={styles.card}>
      <div className={styles.emptyState}>
        <h2 className={styles.sectionHeading}>Owned-case list is not available yet</h2>
        <p>
          The backend currently provides the unclaimed report queue and individual
          owned-case details, but it does not provide an endpoint that lists cases
          assigned to the signed-in coordinator.
        </p>
        <p className={styles.muted}>
          This page no longer shows prototype records as if they were live data.
          Add a coordinator-owned cases endpoint before enabling this list.
        </p>
        <Link className={styles.primaryButton} href="/coordinator/report-queue">
          Open report queue
        </Link>
      </div>
    </section>
  );
}
