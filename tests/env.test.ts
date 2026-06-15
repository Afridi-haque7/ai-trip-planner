import { describe, it, expect, afterEach, vi } from "vitest";
import { features } from "@/lib/env";

afterEach(() => vi.unstubAllEnvs());

describe("feature flags reflect configured env", () => {
  it("cache() tracks REDIS_URL", () => {
    vi.stubEnv("REDIS_URL", "");
    expect(features.cache()).toBe(false);
    vi.stubEnv("REDIS_URL", "redis://localhost:6379");
    expect(features.cache()).toBe(true);
  });

  it("stripe() tracks STRIPE_SECRET_KEY", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    expect(features.stripe()).toBe(false);
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_x");
    expect(features.stripe()).toBe(true);
  });

  it("livePricing() tracks TRAVELPAYOUTS_TOKEN", () => {
    vi.stubEnv("TRAVELPAYOUTS_TOKEN", "");
    expect(features.livePricing()).toBe(false);
    vi.stubEnv("TRAVELPAYOUTS_TOKEN", "tok");
    expect(features.livePricing()).toBe(true);
  });
});
