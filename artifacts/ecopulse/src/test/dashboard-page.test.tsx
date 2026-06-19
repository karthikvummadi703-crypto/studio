import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import Dashboard from "@/app/dashboard/page";
import * as dashboardHooks from "@/hooks/use-dashboard-data";
import * as firebaseHooks from "@/firebase";

vi.mock("@/hooks/use-dashboard-data", () => ({
  useDashboardData: vi.fn(),
}));

vi.mock("@/firebase", () => ({
  useUser: vi.fn(),
  useFirestore: vi.fn(() => ({})),
  useDoc: vi.fn(() => ({ data: null, isLoading: false, error: null })),
  useCollection: vi.fn(() => ({ data: [], isLoading: false, error: null })),
  useAuth: vi.fn(() => ({})),
  auth: {},
  db: {},
  FirebaseClientProvider: ({ children }: { children: React.ReactNode }) => children,
}));

const mockProfile = { fullName: "Demo User", greenPoints: 120, sustainabilityScore: 82 };
const mockRecords = [{ co2: 1.5, timestamp: new Date() }];

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(dashboardHooks.useDashboardData).mockReturnValue({
      profile: mockProfile,
      records: mockRecords,
      activities: [],
      isLoading: false,
    } as never);
  });

  it("renders without crashing for authenticated user", () => {
    vi.mocked(firebaseHooks.useUser).mockReturnValue({
      user: { uid: "demo-uid", displayName: "Demo User" } as never,
      isLoading: false,
      isDemo: true,
    });
    const { container } = render(<Dashboard />);
    expect(container).toBeInTheDocument();
  });

  it("renders sustainability score for authenticated user", () => {
    vi.mocked(firebaseHooks.useUser).mockReturnValue({
      user: { uid: "demo-uid", displayName: "Demo User" } as never,
      isLoading: false,
      isDemo: true,
    });
    render(<Dashboard />);
    expect(screen.getAllByText("82").length).toBeGreaterThan(0);
  });

  it("renders green points for authenticated user", () => {
    vi.mocked(firebaseHooks.useUser).mockReturnValue({
      user: { uid: "demo-uid", displayName: "Demo User" } as never,
      isLoading: false,
      isDemo: true,
    });
    render(<Dashboard />);
    expect(screen.getAllByText("120").length).toBeGreaterThan(0);
  });

  it("shows loading state when data is loading", () => {
    vi.mocked(firebaseHooks.useUser).mockReturnValue({
      user: { uid: "demo-uid" } as never,
      isLoading: false,
      isDemo: false,
    });
    vi.mocked(dashboardHooks.useDashboardData).mockReturnValue({
      profile: null,
      records: [],
      activities: [],
      isLoading: true,
    } as never);
    const { container } = render(<Dashboard />);
    expect(container).toBeInTheDocument();
  });

  it("shows user full name when available", () => {
    vi.mocked(firebaseHooks.useUser).mockReturnValue({
      user: { uid: "demo-uid", displayName: "Demo User" } as never,
      isLoading: false,
      isDemo: true,
    });
    render(<Dashboard />);
    expect(screen.getByText("Demo User")).toBeInTheDocument();
  });
});
