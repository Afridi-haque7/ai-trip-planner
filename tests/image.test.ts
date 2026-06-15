import { describe, it, expect } from "vitest";
import { isRelevant, getMultipleImageUrls } from "@/lib/tools/image.tool";

describe("isRelevant — reject mismatched matches", () => {
  it("accepts exact and partial subject matches", () => {
    expect(isRelevant("Sri Ranganathaswamy Temple", "Sri Ranganathaswamy Temple")).toBe(true);
    expect(isRelevant("Howrah Bridge Kolkata", "Howrah Bridge")).toBe(true);
    expect(isRelevant("Marina Bay Sands Singapore", "Marina Bay Sands")).toBe(true);
  });

  it("rejects an unrelated article", () => {
    expect(isRelevant("Eiffel Tower Paris", "Statue of Liberty")).toBe(false);
    expect(isRelevant("Gardens by the Bay", "Central Park")).toBe(false);
  });

  it("accepts when there isn't enough signal to judge (generic stopwords only)", () => {
    // No significant tokens in the query → can't reject, so accept.
    expect(isRelevant("the hotel", "Some Building")).toBe(true);
  });
});

describe("getMultipleImageUrls — empty query falls back without network", () => {
  it("returns the requested count of placeholder URLs", async () => {
    const urls = await getMultipleImageUrls("", 2, "destination");
    expect(urls).toHaveLength(2);
    urls.forEach((u) => expect(u).toContain("picsum.photos"));
  });
});
