import { apiRequest } from "./client";
import type { AuthResult, RegisteredUser, RegisterPayload } from "./types";

export const MIN_PASSWORD_LENGTH = 12;
export const MAX_PASSWORD_LENGTH = 128;
export const MAX_DISPLAY_NAME_LENGTH = 100;

export async function login(email: string, password: string): Promise<AuthResult> {
  // Real contract: POST /api/v1/auth/login, application/x-www-form-urlencoded,
  // body `username=<email>&password=<password>` — the wire field is named
  // "username" even though it holds the email. `auth: false` because there
  // is no session yet to attach.
  const body = new URLSearchParams({ username: email, password });

  return apiRequest<AuthResult>({
    path: "/api/v1/auth/login",
    method: "POST",
    body,
    auth: false,
  });
}

export async function register(payload: RegisterPayload): Promise<RegisteredUser> {
  // Real contract: POST /api/v1/auth/register, JSON body
  // { email, displayName, password }. No role field exists on this schema
  // at all — self-registration always creates an observer. The response
  // (201) is the created account, not a session; call login() separately
  // afterward if the caller wants to sign the new account in.
  const { email, displayName, password } = payload;

  return apiRequest<RegisteredUser>({
    path: "/api/v1/auth/register",
    method: "POST",
    body: { email, displayName, password },
    auth: false,
  });
}
