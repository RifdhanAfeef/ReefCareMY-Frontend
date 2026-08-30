"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MAX_DISPLAY_NAME_LENGTH,
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  register,
} from "@/lib/api/authApi";
import { useAuth } from "./auth-context";
import styles from "./auth-form.module.css";

// Deliberately simple — good enough to catch typos before a request; the
// backend's Pydantic EmailStr validator remains authoritative.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RegisterForm() {
  const { login } = useAuth();
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailValid = EMAIL_PATTERN.test(email.trim());
  const displayNameValid =
    displayName.trim().length > 0 && displayName.trim().length <= MAX_DISPLAY_NAME_LENGTH;
  const passwordTooShort = password.length > 0 && password.length < MIN_PASSWORD_LENGTH;
  const passwordValid =
    password.length >= MIN_PASSWORD_LENGTH && password.length <= MAX_PASSWORD_LENGTH;
  const canSubmit = emailValid && displayNameValid && passwordValid && !submitting;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      // Registering and signing in are two independent requests: the
      // account-creation response carries no token (authApi.ts), so a
      // separate login() call is what actually starts the session.
      await register({ displayName, email, password });
      await login(email, password);
      router.push("/my-reports");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <label className={styles.field}>
        <span>Display name</span>
        <input
          type="text"
          name="displayName"
          autoComplete="name"
          required
          maxLength={MAX_DISPLAY_NAME_LENGTH}
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          disabled={submitting}
        />
      </label>

      <label className={styles.field}>
        <span>Email</span>
        <input
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={submitting}
        />
      </label>

      <div className={styles.field}>
        <label htmlFor="register-password">Password</label>
        <input
          id="register-password"
          type="password"
          name="password"
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          maxLength={MAX_PASSWORD_LENGTH}
          aria-describedby="register-password-hint"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={submitting}
        />
        <span
          id="register-password-hint"
          className={passwordTooShort ? styles.hintError : styles.hint}
        >
          {MIN_PASSWORD_LENGTH}–{MAX_PASSWORD_LENGTH} characters.
        </span>
      </div>

      <button className={styles.submit} type="submit" disabled={!canSubmit}>
        {submitting ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
