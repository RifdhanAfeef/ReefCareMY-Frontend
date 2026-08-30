"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as authApi from "@/lib/api/authApi";
import { readStoredAuth, writeStoredAuth } from "@/lib/api/token-store";
import type { AuthUser } from "@/lib/api/types";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  accessToken: string | null;
  // Registration is not session-establishing (the register endpoint
  // returns no token — see authApi.ts), so it's not part of this context:
  // it's a plain API call the register form makes directly, followed by
  // its own separate call to login().
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    // localStorage doesn't exist during SSR, so this can't be a lazy
    // useState initializer without mismatching the server-rendered markup;
    // it must run once after mount instead.
    const stored = readStoredAuth();
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUser(stored.user);
      setAccessToken(stored.accessToken);
      setStatus("authenticated");
    } else {
      setStatus("unauthenticated");
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await authApi.login(email, password);
    setUser(result.user);
    setAccessToken(result.accessToken);
    setStatus("authenticated");
    writeStoredAuth({ user: result.user, accessToken: result.accessToken });
  }, []);

  const logout = useCallback(() => {
    // The deployed API has no /auth/logout route — signing out only ever
    // clears the locally stored token, nothing is called on the backend.
    setUser(null);
    setAccessToken(null);
    setStatus("unauthenticated");
    writeStoredAuth(null);
  }, []);

  const value = useMemo(
    () => ({ status, user, accessToken, login, logout }),
    [status, user, accessToken, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }
  return context;
}
