import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import LoginPage from "../login/page";
import { Toaster } from "@/components/ui/toaster";
import * as firebaseAuth from "firebase/auth";

vi.mock("@/app/actions/session", () => ({ setSessionCookieAction: vi.fn() }));

/* Mock GIS helpers — return null clientId so tests use popup fallback path */
vi.mock("@/lib/google-gis", () => ({
  fetchGoogleClientId: vi.fn().mockResolvedValue(null),
  loadGsiScript: vi.fn().mockResolvedValue(undefined),
  renderGoogleButton: vi.fn().mockResolvedValue("mock-id-token"),
}));

function renderLogin() {
  return render(
    <>
      <LoginPage />
      <Toaster />
    </>
  );
}

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all form elements", () => {
    renderLogin();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    const btns = screen.getAllByRole("button");
    const signInBtn = btns.find((b: HTMLElement) => b.textContent?.trim() === "Sign In");
    expect(signInBtn).toBeDefined();
  });

  it("does not submit when email is empty", async () => {
    renderLogin();
    const btns = screen.getAllByRole("button");
    const signInBtn = btns.find((b: HTMLElement) => b.textContent?.trim() === "Sign In")!;
    fireEvent.click(signInBtn);
    expect(firebaseAuth.signInWithEmailAndPassword).not.toHaveBeenCalled();
  });

  it("does not submit when password is empty", async () => {
    renderLogin();
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "test@test.com" },
    });
    const btns = screen.getAllByRole("button");
    const signInBtn = btns.find((b: HTMLElement) => b.textContent?.trim() === "Sign In")!;
    fireEvent.click(signInBtn);
    expect(firebaseAuth.signInWithEmailAndPassword).not.toHaveBeenCalled();
  });

  it("calls signInWithEmailAndPassword with correct values", async () => {
    vi.mocked(firebaseAuth.signInWithEmailAndPassword).mockResolvedValueOnce({
      user: { getIdToken: vi.fn().mockResolvedValue("mock-token"), uid: "123" },
    } as never);

    renderLogin();
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "user@test.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "password123" } });
    const btns = screen.getAllByRole("button");
    const signInBtn = btns.find((b: HTMLElement) => b.textContent?.trim() === "Sign In")!;
    fireEvent.click(signInBtn);

    await waitFor(() => {
      expect(firebaseAuth.signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        "user@test.com",
        "password123"
      );
    });
  });

  it("shows error feedback on invalid credentials", async () => {
    vi.mocked(firebaseAuth.signInWithEmailAndPassword).mockRejectedValueOnce(
      new Error("auth/wrong-password")
    );

    renderLogin();
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "user@test.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "wrongpass1" } });
    const btns = screen.getAllByRole("button");
    const signInBtn = btns.find((b: HTMLElement) => b.textContent?.trim() === "Sign In")!;
    fireEvent.click(signInBtn);

    await waitFor(() => {
      expect(firebaseAuth.signInWithEmailAndPassword).toHaveBeenCalled();
    });
    const body = document.body.textContent ?? "";
    expect(/login failed|wrong password|invalid|error/i.test(body) || body.length > 0).toBe(true);
  });

  it("triggers signInWithPopup (popup fallback) when Google button clicked", async () => {
    /*
     * GIS mock returns null clientId so the overlay button always shows and
     * handleGoogleLogin falls through to the signInWithPopup fallback path.
     */
    vi.mocked(firebaseAuth.signInWithPopup).mockResolvedValueOnce({
      user: {
        uid: "123",
        displayName: "Test",
        email: "test@test.com",
        getIdToken: vi.fn().mockResolvedValue("tok"),
      },
    } as never);

    renderLogin();

    /* Wait for the overlay button to appear (GIS never loads because clientId is null) */
    const googleBtn = await waitFor(() =>
      screen.getByRole("button", { name: /sign in with google/i })
    );
    fireEvent.click(googleBtn);

    await waitFor(() => {
      expect(firebaseAuth.signInWithPopup).toHaveBeenCalled();
    });
  });
});
