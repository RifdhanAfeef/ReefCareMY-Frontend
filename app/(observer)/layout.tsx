import { AppShell } from "@/components/layout/app-shell";
import { observerNavigation, signedInActions } from "@/config/navigation";
import { RequireAuth } from "@/features/epic-01-access/require-auth";

// Every observer route (Report a Reef, My Reports) requires sign-in
// (US1.5 AC1/AC2). Gating here covers the whole route group in one place.
export default function ObserverLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell navigation={observerNavigation} actions={signedInActions}>
      <RequireAuth>{children}</RequireAuth>
    </AppShell>
  );
}
