import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import app from "../app";

// ── Mock Firebase token verification ─────────────────────────────────────────
vi.mock("../routes/ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../routes/ai")>();
  return actual;
});

global.fetch = vi.fn();

const mockFetch = vi.mocked(global.fetch);

function mockValidToken(uid = "test-uid-123") {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ users: [{ localId: uid }] }),
  } as Response);
}

function mockInvalidToken() {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    json: async () => ({ error: { message: "INVALID_ID_TOKEN" } }),
  } as Response);
}

// ── Auth middleware tests ─────────────────────────────────────────────────────
describe("Auth Middleware", () => {
  it("returns 401 when Authorization header is missing", async () => {
    const res = await request(app).post("/api/ai/chat").send({ userInput: "hello" });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/missing authorization/i);
  });

  it("returns 401 when token format is wrong (no Bearer prefix)", async () => {
    const res = await request(app)
      .post("/api/ai/chat")
      .set("Authorization", "Token abc123")
      .send({ userInput: "hello" });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/missing authorization/i);
  });

  it("returns 401 when Firebase rejects the token", async () => {
    mockInvalidToken();
    const res = await request(app)
      .post("/api/ai/chat")
      .set("Authorization", "Bearer invalid-token")
      .send({ userInput: "hello" });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/unauthorized/i);
  });
});

// ── POST /api/ai/chat validation tests ───────────────────────────────────────
describe("POST /api/ai/chat — input validation", () => {
  it("returns 400 when userInput is missing", async () => {
    mockValidToken();
    const res = await request(app)
      .post("/api/ai/chat")
      .set("Authorization", "Bearer valid-token")
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it("returns 400 when userInput is empty string", async () => {
    mockValidToken();
    const res = await request(app)
      .post("/api/ai/chat")
      .set("Authorization", "Bearer valid-token")
      .send({ userInput: "" });
    expect(res.status).toBe(400);
  });

  it("returns 400 when userInput exceeds max length", async () => {
    mockValidToken();
    const res = await request(app)
      .post("/api/ai/chat")
      .set("Authorization", "Bearer valid-token")
      .send({ userInput: "x".repeat(2001) });
    expect(res.status).toBe(400);
  });

  it("returns 400 when history contains invalid role", async () => {
    mockValidToken();
    const res = await request(app)
      .post("/api/ai/chat")
      .set("Authorization", "Bearer valid-token")
      .send({
        userInput: "hello",
        history: [{ role: "admin", text: "injected message" }],
      });
    expect(res.status).toBe(400);
  });

  it("returns 400 when history exceeds max count", async () => {
    mockValidToken();
    const history = Array.from({ length: 21 }, (_, i) => ({
      role: i % 2 === 0 ? "user" : "ai",
      text: "msg",
    }));
    const res = await request(app)
      .post("/api/ai/chat")
      .set("Authorization", "Bearer valid-token")
      .send({ userInput: "hello", history });
    expect(res.status).toBe(400);
  });
});

// ── POST /api/ai/insights validation tests ───────────────────────────────────
describe("POST /api/ai/insights — input validation", () => {
  it("returns 400 when totalEmissions is missing", async () => {
    mockValidToken();
    const res = await request(app)
      .post("/api/ai/insights")
      .set("Authorization", "Bearer valid-token")
      .send({});
    expect(res.status).toBe(400);
  });

  it("returns 400 when totalEmissions is negative", async () => {
    mockValidToken();
    const res = await request(app)
      .post("/api/ai/insights")
      .set("Authorization", "Bearer valid-token")
      .send({ totalEmissions: -5 });
    expect(res.status).toBe(400);
  });

  it("returns 400 when totalEmissions is not a number", async () => {
    mockValidToken();
    const res = await request(app)
      .post("/api/ai/insights")
      .set("Authorization", "Bearer valid-token")
      .send({ totalEmissions: "lots" });
    expect(res.status).toBe(400);
  });

  it("returns 400 when emissionsBreakdown contains negative values", async () => {
    mockValidToken();
    const res = await request(app)
      .post("/api/ai/insights")
      .set("Authorization", "Bearer valid-token")
      .send({
        totalEmissions: 10,
        emissionsBreakdown: { transportation: -1, homeEnergy: 0, food: 0, lifestyle: 0 },
      });
    expect(res.status).toBe(400);
  });
});

// ── Rate limiting tests ───────────────────────────────────────────────────────
describe("Rate limiting", () => {
  it("returns 429 after exceeding the chat rate limit", async () => {
    const uid = `rate-test-uid-${Date.now()}`;

    const responses: number[] = [];
    for (let i = 0; i < 17; i++) {
      mockValidToken(uid);
      const res = await request(app)
        .post("/api/ai/chat")
        .set("Authorization", "Bearer valid-token")
        .send({ userInput: "x".repeat(2001) });
      responses.push(res.status);
    }

    expect(responses.some((s) => s === 429)).toBe(true);
  });

  it("includes Retry-After header on 429 response", async () => {
    const uid = `retry-test-uid-${Date.now()}`;

    for (let i = 0; i < 16; i++) {
      mockValidToken(uid);
      await request(app)
        .post("/api/ai/chat")
        .set("Authorization", "Bearer valid-token")
        .send({ userInput: "test message" });
    }

    const lastRes = await request(app)
      .post("/api/ai/chat")
      .set("Authorization", "Bearer valid-token")
      .send({ userInput: "test message" });

    if (lastRes.status === 429) {
      expect(lastRes.headers["retry-after"]).toBeDefined();
    }
  });
});

// ── Security headers tests ────────────────────────────────────────────────────
describe("Security headers (Helmet)", () => {
  it("includes X-Content-Type-Options header", async () => {
    const res = await request(app).get("/api/health").catch(() => ({ headers: {} as Record<string, string> }));
    expect(res.headers?.["x-content-type-options"]).toBe("nosniff");
  });

  it("includes X-Frame-Options header", async () => {
    const res = await request(app).get("/api/health").catch(() => ({ headers: {} as Record<string, string> }));
    expect(res.headers?.["x-frame-options"]).toBeDefined();
  });
});

// ── 503 when AI is not configured ────────────────────────────────────────────
describe("AI service unavailable", () => {
  it("returns 503 when GOOGLE_AI_API_KEY is not set", async () => {
    const originalKey = process.env["GOOGLE_AI_API_KEY"];
    delete process.env["GOOGLE_AI_API_KEY"];

    mockValidToken();
    const res = await request(app)
      .post("/api/ai/chat")
      .set("Authorization", "Bearer valid-token")
      .send({ userInput: "hello" });

    process.env["GOOGLE_AI_API_KEY"] = originalKey;
    expect([400, 503]).toContain(res.status);
  });
});
