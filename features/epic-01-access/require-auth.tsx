"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./auth-context";

// Gates an entire route group behind sign-in (US1.5 AC1/AC2): an
// unauthenticated visitor who reaches a protected route is sent to the
// login page, which returns them here afterwards via ?next=.
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [status, pathname, router]);

  if (status !== "authenticated") {
    return null;
  }

  return <>{children}</>;
}
