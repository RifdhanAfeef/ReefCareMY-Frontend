import Link from "next/link";
import styles from "./site-header.module.css";

export function Brand() {
  return (
    <Link className={styles.brand} href="/" aria-label="ReefCare MY home">
      <span className={styles.brandMark} aria-hidden="true" />
      <span>ReefCare MY</span>
    </Link>
  );
}
