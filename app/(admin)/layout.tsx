import { AppShell } from "@/components/layout/app-shell";
import { administratorNavigation, signedInActions } from "@/config/navigation";

export default function AdministratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell
      navigation={administratorNavigation}
      actions={signedInActions}
      identity={{ label: "Administrator", initial: "S" }}
    >
      {children}
    </AppShell>
  );
}
