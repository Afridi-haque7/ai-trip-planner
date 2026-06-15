import { describe, it, expect } from "vitest";
import { tripSignature, getCachedTrip } from "@/lib/cache";

const base = {
  origin: "Delhi",
  destination: "Dubai",
  startDate: "2026-09-05",
  endDate: "2026-09-08",
  numberOfPeople: 2,
  budgetLevel: "medium",
  currency: "USD",
  tripTheme: ["adventure", "food"],
};

describe("tripSignature", () => {
  it("is deterministic for identical input", () => {
    expect(tripSignature(base)).toBe(tripSignature({ ...base }));
  });

  it("ignores case and surrounding whitespace", () => {
    expect(tripSignature(base)).toBe(
      tripSignature({ ...base, origin: "  DELHI ", destination: "Dubai " })
    );
  });

  it("is independent of theme order", () => {
    expect(tripSignature(base)).toBe(
      tripSignature({ ...base, tripTheme: ["food", "adventure"] })
    );
  });

  it("changes when a pricing-relevant field changes", () => {
    expect(tripSignature(base)).not.toBe(
      tripSignature({ ...base, startDate: "2026-10-05" })
    );
    expect(tripSignature(base)).not.toBe(
      tripSignature({ ...base, budgetLevel: "luxury" })
    );
    expect(tripSignature(base)).not.toBe(
      tripSignature({ ...base, currency: "INR" })
    );
    expect(tripSignature(base)).not.toBe(
      tripSignature({ ...base, numberOfPeople: 3 })
    );
  });

  it("produces a namespaced 16-hex key", () => {
    expect(tripSignature(base)).toMatch(/^trip:v1:[0-9a-f]{16}$/);
  });

  it("treats a missing theme as empty without throwing", () => {
    const { tripTheme, ...noTheme } = base;
    expect(() => tripSignature(noTheme)).not.toThrow();
  });
});

describe("getCachedTrip (no Redis configured)", () => {
  it("resolves null instead of throwing", async () => {
    await expect(getCachedTrip(base)).resolves.toBeNull();
  });
});
