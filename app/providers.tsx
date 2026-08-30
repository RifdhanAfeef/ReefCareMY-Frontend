"use client";

import { AuthProvider } from "@/features/epic-01-access/auth-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
