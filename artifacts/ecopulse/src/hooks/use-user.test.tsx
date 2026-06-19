"use client";

import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useUser } from "@/firebase/auth/use-user";
import * as firebaseAuth from "firebase/auth";
import { IS_DEMO_KEY } from "@/lib/constants";

vi.mock("firebase/auth", () => ({
  onAuthStateChanged: vi.fn(),
  getAuth: vi.fn(() => ({})),
}));

describe("useUser hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it("returns isLoading=true initially then false after auth resolves", async () => {
    let authCallback: any;
    (firebaseAuth.onAuthStateChanged as any).mockImplementation((auth: any, cb: any) => {
      authCallback = cb;
      return vi.fn();
    });

    const { result } = renderHook(() => useUser());

    // Initial state
    expect(result.current.isLoading).toBe(true);

    // Resolve auth
    authCallback(null);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it("returns null user when unauthenticated", async () => {
    (firebaseAuth.onAuthStateChanged as any).mockImplementation((auth: any, cb: any) => {
      cb(null);
      return vi.fn();
    });

    const { result } = renderHook(() => useUser());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.user).toBeNull();
    expect(result.current.isDemo).toBe(false);
  });

  it("returns user when authenticated with email", async () => {
    const mockUser = { uid: "123", email: "test@test.com", isAnonymous: false };
    (firebaseAuth.onAuthStateChanged as any).mockImplementation((auth: any, cb: any) => {
      cb(mockUser);
      return vi.fn();
    });

    const { result } = renderHook(() => useUser());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isDemo).toBe(false);
  });

  it("returns isDemo=true for anonymous users with IS_DEMO_KEY in sessionStorage", async () => {
    const mockAnonUser = { uid: "anon123", isAnonymous: true };
    sessionStorage.setItem(IS_DEMO_KEY, "true");

    (firebaseAuth.onAuthStateChanged as any).mockImplementation((auth: any, cb: any) => {
      cb(mockAnonUser);
      return vi.fn();
    });

    const { result } = renderHook(() => useUser());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.user).toEqual(mockAnonUser);
    expect(result.current.isDemo).toBe(true);
  });

  it("blocks anonymous users if demo flag is missing", async () => {
    const mockAnonUser = { uid: "anon123", isAnonymous: true };
    // No sessionStorage flag set

    (firebaseAuth.onAuthStateChanged as any).mockImplementation((auth: any, cb: any) => {
      cb(mockAnonUser);
      return vi.fn();
    });

    const { result } = renderHook(() => useUser());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.user).toBeNull();
    expect(result.current.isDemo).toBe(false);
  });
});
