import type { AuthUser } from "./types";

// Single source of truth for "is there a signed-in session" outside of
// React: auth-context.tsx writes here on login/logout, and client.ts reads
// here to attach the Authorization header to outgoing requests. Both must
// agree on this shape, which is why it lives in its own module instead of
// each file touching localStorage with a hardcoded key.
const STORAGE_KEY = "reefcare.auth";

export type StoredAuth = {
  user: AuthUser;
  accessToken: string;
};

export function readStoredAuth(): StoredAuth | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredAuth;
  } catch {
    return null;
  }
}

export function writeStoredAuth(value: StoredAuth | null): void {
  if (typeof window === "undefined") {
    return;
  }

  if (value) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}
