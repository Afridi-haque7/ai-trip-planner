import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  buildFlightBookingLink,
  buildHotelBookingLink,
  fetchTravelpayoutsFlights,
  fetchTravelpayoutsHotels,
} from "@/lib/tools/travelpayouts.tool";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("affiliate booking links", () => {
  it("returns null when no marker is configured", () => {
    vi.stubEnv("TRAVELPAYOUTS_MARKER", "");
    expect(buildFlightBookingLink("DEL", "DXB")).toBeNull();
    expect(buildHotelBookingLink("Dubai", "2026-09-05", "2026-09-08")).toBeNull();
  });

  it("builds a flight search link with the marker", () => {
    vi.stubEnv("TRAVELPAYOUTS_MARKER", "12345");
    expect(buildFlightBookingLink("DEL", "DXB")).toBe(
      "https://www.aviasales.com/search/DELDXB?marker=12345"
    );
  });

  it("builds a URL-encoded hotel search link with dates and guests", () => {
    vi.stubEnv("TRAVELPAYOUTS_MARKER", "12345");
    const link = buildHotelBookingLink("New York", "2026-09-05", "2026-09-08", 3);
    expect(link).toContain("destination=New%20York");
    expect(link).toContain("marker=12345");
    expect(link).toContain("checkIn=2026-09-05");
    expect(link).toContain("checkOut=2026-09-08");
    expect(link).toContain("adults=3");
  });
});

describe("fetchTravelpayouts* without a token", () => {
  it("flights resolves null and never calls fetch", async () => {
    vi.stubEnv("TRAVELPAYOUTS_TOKEN", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      fetchTravelpayoutsFlights("DEL", "DXB", "2026-09-05", 2)
    ).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("hotels resolves null without a token", async () => {
    vi.stubEnv("TRAVELPAYOUTS_TOKEN", "");
    await expect(
      fetchTravelpayoutsHotels("Dubai", "2026-09-05", "2026-09-08", 2)
    ).resolves.toBeNull();
  });
});

describe("fetchTravelpayoutsFlights with token (mocked API)", () => {
  beforeEach(() => {
    vi.stubEnv("TRAVELPAYOUTS_TOKEN", "tok_test");
    vi.stubEnv("TRAVELPAYOUTS_MARKER", "12345");
  });

  it("parses offers into per-person min/avg/max + affiliate link", async () => {
    const apiResponse = {
      success: true,
      data: [
        { price: 200, link: "/search/DEL0509DXB1" },
        { price: 300, link: "/search/x" },
        { price: 400, link: "/search/y" },
      ],
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => apiResponse })
    );

    const res = await fetchTravelpayoutsFlights("DEL", "DXB", "2026-09-05", 1);
    expect(res).not.toBeNull();
    expect(res!.currency).toBe("USD");
    expect(res!.pricePerPerson).toEqual({ min: 200, average: 300, max: 400 });
    expect(res!.source).toContain("travelpayouts");
    expect(res!.bookingLink).toContain("aviasales.com");
    expect(res!.bookingLink).toContain("marker=12345");
  });

  it("resolves null when the API yields no offers", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: [] }) })
    );
    await expect(
      fetchTravelpayoutsFlights("DEL", "DXB", "2026-09-05", 1)
    ).resolves.toBeNull();
  });

  it("rejects invalid IATA codes before hitting the network", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      fetchTravelpayoutsFlights("DELHI", "DXB", "2026-09-05", 1)
    ).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("fetchTravelpayoutsHotels with token (mocked API)", () => {
  beforeEach(() => {
    vi.stubEnv("TRAVELPAYOUTS_TOKEN", "tok_test");
    vi.stubEnv("TRAVELPAYOUTS_MARKER", "12345");
  });

  it("normalizes stay totals to per-night prices (3 nights)", async () => {
    const apiResponse = [
      { hotelName: "A", priceAvg: 300, priceFrom: 270 }, // 100 / night
      { hotelName: "B", priceAvg: 600, priceFrom: 540 }, // 200 / night
    ];
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => apiResponse })
    );

    const res = await fetchTravelpayoutsHotels(
      "Dubai",
      "2026-09-05",
      "2026-09-08",
      2
    );
    expect(res).not.toBeNull();
    expect(res!.currency).toBe("USD");
    expect(res!.min).toBe(100);
    expect(res!.max).toBe(200);
    expect(res!.average).toBe(150);
    expect(res!.bookingLink).toContain("hotellook.com");
  });
});
