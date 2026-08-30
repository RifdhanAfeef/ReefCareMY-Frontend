"use client";

import { AppShell } from "@/components/layout/app-shell";
import {
  observerNavigation,
  publicActions,
  publicNavigation,
  signedInActions,
} from "@/config/navigation";
import { useAuth } from "@/features/epic-01-access/auth-context";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const signedIn = status === "authenticated";

  return (
    <AppShell
      navigation={signedIn ? observerNavigation : publicNavigation}
      actions={status === "loading" ? [] : signedIn ? signedInActions : publicActions}
    >
      {children}
    </AppShell>
  );
}
