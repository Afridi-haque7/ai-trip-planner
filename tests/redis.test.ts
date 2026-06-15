import { describe, it, expect } from "vitest";
import { getRedis, redisPing, cacheGetJson, cacheSetJson } from "@/lib/redis";

// With REDIS_URL unset in the test env, every helper must degrade gracefully —
// never throw, never block a request path.
describe("redis graceful degradation (REDIS_URL unset)", () => {
  it("getRedis returns null", () => {
    expect(getRedis()).toBeNull();
  });

  it("redisPing resolves false", async () => {
    await expect(redisPing()).resolves.toBe(false);
  });

  it("cacheGetJson resolves null", async () => {
    await expect(cacheGetJson("any:key")).resolves.toBeNull();
  });

  it("cacheSetJson resolves without throwing", async () => {
    await expect(cacheSetJson("any:key", { a: 1 }, 60)).resolves.toBeUndefined();
  });
});
