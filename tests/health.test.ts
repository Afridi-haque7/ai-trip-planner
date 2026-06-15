import { describe, it, expect, vi } from "vitest";

// The readiness route checks Mongo + Redis. Mock those so the test is hermetic:
// Mongo "connected", Redis disabled (no REDIS_URL) → healthy.
vi.mock("mongoose", () => ({
  default: { connection: { readyState: 1 } },
}));
vi.mock("@/lib/dbConnect", () => ({
  default: vi.fn().mockResolvedValue({}),
}));

describe("/api/health (liveness)", () => {
  it("returns 200 with status ok", async () => {
    const { GET } = await import("@/app/api/health/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.service).toBe("web");
  });
});

describe("/api/health/ready (readiness)", () => {
  it("returns 200 when Mongo is connected and Redis is disabled", async () => {
    const { GET } = await import("@/app/api/health/ready/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.checks.mongo).toBe("ok");
    expect(body.checks.redis).toBe("disabled");
  });
});
