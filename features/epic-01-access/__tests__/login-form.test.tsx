import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "../auth-context";
import { LoginForm } from "../login-form";
import * as authApi from "@/lib/api/authApi";

// authApi.login now makes a real network call against the deployed
// backend, which a unit test must never do — every scenario below drives
// the component through a mocked login(), not the real one.
vi.mock("@/lib/api/authApi");
const mockedLogin = vi.mocked(authApi.login);

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(""),
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function SignedInUser() {
  const { user, accessToken } = useAuth();
  return (
    <p>
      Signed in as {user?.displayName ?? "nobody"}, token {accessToken ?? "none"}
    </p>
  );
}

beforeEach(() => {
  push.mockClear();
  mockedLogin.mockReset();
  window.localStorage.clear();
});

async function fillAndSubmit(email: string, password: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Email"), email);
  await user.type(screen.getByLabelText("Password"), password);
  await user.click(screen.getByRole("button", { name: /log in|signing in/i }));
  return user;
}

// The deployed backend (verified against the live API 2026-08-30) returns
// the same "Invalid credentials" message whether the account doesn't exist
// or the password is wrong. The frontend must show that text verbatim.
describe("Login — generic credential error", () => {
  it("shows the backend's message as-is", async () => {
    mockedLogin.mockRejectedValue(new Error("Invalid credentials"));

    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>,
    );

    await fillAndSubmit("observer@example.org", "wrong-password");

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid credentials");
  });
});

describe("Login — button is disabled and shows a loading state while submitting", () => {
  it("disables the button and swaps its label until the request settles", async () => {
    const pending = deferred<Awaited<ReturnType<typeof authApi.login>>>();
    mockedLogin.mockReturnValue(pending.promise);

    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>,
    );

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Email"), "observer@example.org");
    await user.type(screen.getByLabelText("Password"), "correct-horse-battery");

    const button = screen.getByRole("button", { name: /log in/i });
    await user.click(button);

    expect(button).toBeDisabled();
    expect(button).toHaveTextContent(/signing in/i);

    pending.resolve({
      accessToken: "tok-abc",
      tokenType: "bearer",
      expiresIn: 3600,
      user: { id: 1, displayName: "observer", role: "observer" },
    });

    await screen.findByRole("button", { name: "Log in" });
  });
});

describe("Login — success stores the session and navigates onward", () => {
  it("persists the access token to localStorage and exposes it via context", async () => {
    mockedLogin.mockResolvedValue({
      accessToken: "tok-abc",
      tokenType: "bearer",
      expiresIn: 3600,
      user: { id: 1, displayName: "observer", role: "observer" },
    });

    render(
      <AuthProvider>
        <LoginForm />
        <SignedInUser />
      </AuthProvider>,
    );

    await fillAndSubmit("observer@example.org", "correct-horse-battery");

    expect(
      await screen.findByText("Signed in as observer, token tok-abc"),
    ).toBeInTheDocument();
    expect(push).toHaveBeenCalledWith("/my-reports");
    expect(mockedLogin).toHaveBeenCalledWith("observer@example.org", "correct-horse-battery");

    const stored = JSON.parse(window.localStorage.getItem("reefcare.auth") ?? "null");
    expect(stored?.user?.displayName).toBe("observer");
    expect(stored?.accessToken).toBe("tok-abc");
  });

  it.todo(
    "a submitted report persists with the authenticated observer as its submitter — requires Epic 2 report-submission wiring",
  );
});
