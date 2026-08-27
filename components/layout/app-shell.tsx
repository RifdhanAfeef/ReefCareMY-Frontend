import type { HeaderAction, NavigationItem } from "@/config/navigation";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import styles from "./app-shell.module.css";

type AppShellProps = {
  navigation: NavigationItem[];
  actions?: HeaderAction[];
  children: React.ReactNode;
};

export function AppShell({ navigation, actions, children }: AppShellProps) {
  return (
    <div className={styles.shell}>
      <SiteHeader navigation={navigation} actions={actions} />
      <main className={styles.main}>{children}</main>
      <SiteFooter />
    </div>
  );
}
