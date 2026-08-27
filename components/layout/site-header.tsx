"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { HeaderAction, NavigationItem } from "@/config/navigation";
import { Brand } from "./brand";
import styles from "./site-header.module.css";

type SiteHeaderProps = {
  navigation: NavigationItem[];
  actions?: HeaderAction[];
};

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader({ navigation, actions = [] }: SiteHeaderProps) {
  const pathname = usePathname();

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Brand />

        <nav className={styles.navigation} aria-label="Primary navigation">
          {navigation.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                className={`${styles.navLink} ${active ? styles.active : ""}`}
                href={item.href}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {actions.length > 0 && (
          <div className={styles.actions}>
            {actions.map((action) => (
              <Link
                key={`${action.href}-${action.label}`}
                className={`${styles.action} ${styles[action.variant]}`}
                href={action.href}
              >
                {action.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
