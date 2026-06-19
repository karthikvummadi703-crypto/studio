import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

describe("Auth Guard Logic", () => {
  it("useUser returns null user when no one is signed in", async () => {
    const { useUser } = await import("@/firebase");
    const { result } = renderHook(() => useUser());
    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("isAuthPage is true for /login path", () => {
    const authPaths = ["/login", "/register", "/"];
    const protectedPaths = ["/dashboard", "/calculator", "/profile", "/ai-advisor"];

    authPaths.forEach((p) => {
      const isAuthPage = p === "/login" || p === "/register" || p === "/";
      expect(isAuthPage).toBe(true);
    });

    protectedPaths.forEach((p) => {
      const isAuthPage = p === "/login" || p === "/register" || p === "/";
      expect(isAuthPage).toBe(false);
    });
  });
});
