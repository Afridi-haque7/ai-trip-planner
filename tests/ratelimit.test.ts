import { describe, it, expect, beforeEach, vi } from "vitest";

// Toggleable Redis stub so we can test both the fail-open and counting paths.
const h = vi.hoisted(() => ({ client: null as any }));
vi.mock("@/lib/redis", () => ({ getRedis: () => h.client }));

import { rateLimit, clientIp } from "@/lib/ratelimit";

function makeStub() {
  const store = new Map<string, number>();
  return {
    incr: async (k: string) => {
      const n = (store.get(k) ?? 0) + 1;
      store.set(k, n);
      return n;
    },
    expire: async () => 1,
    ttl: async () => 60,
  };
}

beforeEach(() => {
  h.client = null;
});

describe("rateLimit — fail-open when Redis is unavailable", () => {
  it("allows the request", async () => {
    const r = await rateLimit("user", 5, 60);
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBe(5);
    expect(r.limit).toBe(5);
  });
});

describe("rateLimit — counting with Redis", () => {
  it("allows up to the limit, then blocks", async () => {
    h.client = makeStub();
    const out = [];
    for (let i = 0; i < 4; i++) out.push(await rateLimit("u1", 3, 60));
    expect(out[0].allowed).toBe(true);
    expect(out[2].allowed).toBe(true); // 3rd hit == limit
    expect(out[3].allowed).toBe(false); // 4th exceeds
    expect(out[3].remaining).toBe(0);
  });

  it("tracks identifiers independently", async () => {
    h.client = makeStub();
    await rateLimit("a", 1, 60); // a → 1 (allowed)
    const aSecond = await rateLimit("a", 1, 60); // a → 2 (blocked)
    const bFirst = await rateLimit("b", 1, 60); // b → 1 (allowed)
    expect(aSecond.allowed).toBe(false);
    expect(bFirst.allowed).toBe(true);
  });
});

describe("clientIp", () => {
  it("takes the first x-forwarded-for entry", () => {
    expect(
      clientIp(new Headers({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" }))
    ).toBe("1.2.3.4");
  });
  it("falls back to x-real-ip then 'unknown'", () => {
    expect(clientIp(new Headers({ "x-real-ip": "9.9.9.9" }))).toBe("9.9.9.9");
    expect(clientIp(new Headers())).toBe("unknown");
  });
});
