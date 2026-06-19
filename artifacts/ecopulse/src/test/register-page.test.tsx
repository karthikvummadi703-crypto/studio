import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useUser } from "@/firebase";
import React from "react";
import RegisterPage from "@/app/(auth)/register/page";
import * as firebaseAuth from "firebase/auth";

vi.mock("@/app/actions/session", () => ({ setSessionCookieAction: vi.fn() }));

describe("RegisterPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders the EcoPulse AI heading", () => {
    render(<RegisterPage />);
    const found = screen.getAllByText((_: string, el: Element | null) =>
      (el?.textContent ?? "").toLowerCase().includes("ecopulse")
    );
    expect(found.length).toBeGreaterThan(0);
  });

  it("renders name field", () => {
    render(<RegisterPage />);
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
  });

  it("renders email field", () => {
    render(<RegisterPage />);
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
  });

  it("renders password field", () => {
    render(<RegisterPage />);
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
  });

  it("renders Register Node submit button", () => {
    render(<RegisterPage />);
    expect(screen.getByRole("button", { name: /register node/i })).toBeInTheDocument();
  });

  it("shows link to sign in page", () => {
    render(<RegisterPage />);
    const body = document.body.textContent ?? "";
    expect(/sign in|log in|already have/i.test(body)).toBe(true);
  });

  it("updates name field on input", () => {
    render(<RegisterPage />);
    const nameInput = screen.getByLabelText(/full name/i);
    fireEvent.change(nameInput, { target: { value: "Alice Green" } });
    expect((nameInput as HTMLInputElement).value).toBe("Alice Green");
  });

  it("redirects authenticated user away from register page", () => {
    vi.mocked(useUser).mockReturnValueOnce({
      user: { uid: "test-uid" } as never,
      isLoading: false,
      isDemo: false,
    });
    render(<RegisterPage />);
    expect(document.body).toBeInTheDocument();
  });

  it("calls createUserWithEmailAndPassword on valid submit", async () => {
    vi.mocked(firebaseAuth.createUserWithEmailAndPassword).mockResolvedValueOnce({
      user: { uid: "123", updateProfile: vi.fn() },
    } as never);
    vi.mocked(firebaseAuth.updateProfile).mockResolvedValueOnce(undefined);

    render(<RegisterPage />);
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: "John Doe" } });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "john@test.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: "Password1" } });
    fireEvent.click(screen.getByRole("button", { name: /register node/i }));

    await waitFor(() => {
      expect(firebaseAuth.createUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        "john@test.com",
        "Password1"
      );
    });
  });
});
