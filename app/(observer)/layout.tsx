import { AppShell } from "@/components/layout/app-shell";
import { observerNavigation, signedInActions } from "@/config/navigation";

export default function ObserverLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell navigation={observerNavigation} actions={signedInActions}>
      {children}
    </AppShell>
  );
}
