"use client";

import { AppShell } from "@/components/layout/app-shell";
import {
  administratorNavigation,
  coordinatorNavigation,
  observerNavigation,
  publicActions,
  publicNavigation,
  signedInActions,
} from "@/config/navigation";
import { useAuth } from "@/features/epic-01-access/auth-context";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { status, user } = useAuth();
  const signedIn = status === "authenticated";
  const signedInNavigation = user?.role === "case_coordinator"
    ? coordinatorNavigation
    : user?.role === "system_administrator"
      ? administratorNavigation
      : observerNavigation;

  return (
    <AppShell
      navigation={signedIn ? signedInNavigation : publicNavigation}
      actions={status === "loading" ? [] : signedIn ? signedInActions : publicActions}
    >
      {children}
    </AppShell>
  );
}
