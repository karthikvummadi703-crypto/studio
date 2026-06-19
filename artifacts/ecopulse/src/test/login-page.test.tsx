import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";

vi.mock("@/app/actions/session", () => ({ setSessionCookieAction: vi.fn() }));

async function renderLogin() {
  const { default: LoginPage } = await import("@/app/(auth)/login/page");
  return render(<LoginPage />);
}

describe("LoginPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders the EcoPulse AI heading", async () => {
    await renderLogin();
    const headings = screen.getAllByText(/ecopulse ai/i);
    expect(headings.length).toBeGreaterThan(0);
  });

  it("renders email input", async () => {
    await renderLogin();
    expect(screen.getByPlaceholderText(/name@example\.com/i)).toBeInTheDocument();
  });

  it("renders a password input", async () => {
    await renderLogin();
    const passwordInput = document.querySelector('input[type="password"]');
    expect(passwordInput).not.toBeNull();
  });

  it("renders primary Sign In button", async () => {
    await renderLogin();
    const btns = screen.getAllByRole("button");
    const signInBtn = btns.find((b: HTMLElement) => b.textContent?.trim() === "Sign In");
    expect(signInBtn).toBeDefined();
  });

  it("renders Demo mode button", async () => {
    await renderLogin();
    expect(screen.getByRole("button", { name: /demo/i })).toBeInTheDocument();
  });

  it("renders Google sign-in button", async () => {
    await renderLogin();
    expect(screen.getByRole("button", { name: /google/i })).toBeInTheDocument();
  });

  it("shows Forgot password link", async () => {
    await renderLogin();
    expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
  });

  it("shows create account text somewhere on page", async () => {
    await renderLogin();
    const body = document.body.textContent ?? "";
    expect(/create|sign up|register/i.test(body)).toBe(true);
  });

  it("updates email field on input", async () => {
    await renderLogin();
    const emailInput = screen.getByPlaceholderText(/name@example\.com/i);
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    expect((emailInput as HTMLInputElement).value).toBe("test@example.com");
  });

  it("shows demo mode available banner", async () => {
    await renderLogin();
    expect(screen.getByText(/demo mode available/i)).toBeInTheDocument();
  });

  it("calls signInWithEmailAndPassword on form submit", async () => {
    const { signInWithEmailAndPassword } = await import("firebase/auth");
    const mockUser = { uid: "test-uid", getIdToken: vi.fn().mockResolvedValue("token") };
    vi.mocked(signInWithEmailAndPassword).mockResolvedValueOnce({ user: mockUser } as never);

    await renderLogin();

    fireEvent.change(screen.getByPlaceholderText(/name@example\.com/i), {
      target: { value: "user@test.com" },
    });
    const pw = document.querySelector('input[type="password"]') as HTMLInputElement;
    if (pw) fireEvent.change(pw, { target: { value: "password123" } });

    const signInBtn = screen
      .getAllByRole("button")
      .find((b: HTMLElement) => b.textContent?.trim() === "Sign In");
    if (signInBtn) fireEvent.click(signInBtn);

    await waitFor(() => {
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        "user@test.com",
        "password123"
      );
    });
  });
});
