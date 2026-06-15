import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { planToPriceId, planForPriceId } from "@/lib/stripe";

const STARTER = "price_starter_123";
const PRO = "price_pro_456";

beforeEach(() => {
  vi.stubEnv("STRIPE_PRICE_STARTER", STARTER);
  vi.stubEnv("STRIPE_PRICE_PRO", PRO);
});
afterEach(() => vi.unstubAllEnvs());

describe("plan ↔ price mapping", () => {
  it("maps internal plan → Stripe price id", () => {
    expect(planToPriceId("basic")).toBe(STARTER);
    expect(planToPriceId("premium")).toBe(PRO);
  });

  it("maps Stripe price id → internal plan", () => {
    expect(planForPriceId(STARTER)).toBe("basic");
    expect(planForPriceId(PRO)).toBe("premium");
  });

  it("returns null for unknown, empty, or undefined price id", () => {
    expect(planForPriceId("price_unknown")).toBeNull();
    expect(planForPriceId("")).toBeNull();
    expect(planForPriceId(undefined)).toBeNull();
  });
});

describe("getStripe", () => {
  it("throws when STRIPE_SECRET_KEY is missing", async () => {
    vi.resetModules();
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    const { getStripe } = await import("@/lib/stripe");
    expect(() => getStripe()).toThrow(/STRIPE_SECRET_KEY/);
  });
});
