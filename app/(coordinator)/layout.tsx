import { AppShell } from "@/components/layout/app-shell";
import { coordinatorNavigation, signedInActions } from "@/config/navigation";

export default function CoordinatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell
      navigation={coordinatorNavigation}
      actions={signedInActions}
      identity={{ label: "Case Coordinator", initial: "C" }}
    >
      {children}
    </AppShell>
  );
}
