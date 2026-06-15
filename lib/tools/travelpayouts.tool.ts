/**
 * Travelpayouts live pricing — Aviasales (flights) + Hotellook (hotels).
 *
 * Free data API that also pays affiliate commission on bookings, so every result
 * carries a `bookingLink` stamped with our marker. Prices are fetched in USD to
 * match the Budget Agent's base-currency anchor (it applies the live USD→target
 * rate itself). Results are cached in Redis per route/date so we stay fast and
 * within rate limits; identical popular searches hit the cache.
 *
 * Returns null on any missing-token / timeout / shape-mismatch so callers fall
 * back to estimates instead of failing. Live data activates the moment
 * TRAVELPAYOUTS_TOKEN (+ TRAVELPAYOUTS_MARKER for links) is set.
 */

import { cacheGetJson, cacheSetJson } from "@/lib/redis";

const TIMEOUT_MS = 6000;
const CACHE_TTL_SECONDS = 60 * 45; // 45 min — pricing moves slowly enough

export interface LiveFlightResult {
  pricePerPerson: { min: number; average: number; max: number };
  currency: string;
  source: string;
  bookingLink?: string;
}

export interface LiveHotelResult {
  min: number;
  average: number;
  max: number;
  currency: string;
  source: string;
  bookingLink?: string;
}

function token(): string | undefined {
  return process.env.TRAVELPAYOUTS_TOKEN || undefined;
}
function marker(): string {
  return process.env.TRAVELPAYOUTS_MARKER || "";
}

// ─── Affiliate booking links ────────────────────────────────────────────────
// Decoupled from price fetches so a "Book" button still renders (and earns
// commission) even when a price API returns nothing. Null when no marker is set.

export function buildFlightBookingLink(
  originIata: string,
  destIata: string
): string | null {
  const m = marker();
  if (!m || !originIata || !destIata) return null;
  return `https://www.aviasales.com/search/${originIata}${destIata}?marker=${m}`;
}

export function buildHotelBookingLink(
  cityName: string,
  checkIn: string,
  checkOut: string,
  adults: number = 2
): string | null {
  const m = marker();
  if (!m || !cityName) return null;
  return `https://search.hotellook.com/?marker=${m}&destination=${encodeURIComponent(
    cityName
  )}&checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}`;
}

/** fetch() with a hard abort so a slow upstream never stalls the request. */
async function fetchJson(
  url: string,
  headers: Record<string, string> = {}
): Promise<any | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers, signal: controller.signal });
    if (!res.ok) {
      console.warn(`[Travelpayouts] ${res.status} for ${url.split("?")[0]}`);
      return null;
    }
    return await res.json();
  } catch (err: any) {
    if (err?.name !== "AbortError") {
      console.warn("[Travelpayouts] fetch error:", err?.message);
    }
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function stats(prices: number[]) {
  const clean = prices.filter((p) => typeof p === "number" && p > 0);
  if (clean.length === 0) return null;
  const min = Math.min(...clean);
  const max = Math.max(...clean);
  const average = Math.round(clean.reduce((a, b) => a + b, 0) / clean.length);
  return { min: Math.round(min), average, max: Math.round(max) };
}

// ─── Flights (Aviasales prices-for-dates) ───────────────────────────────────

export async function fetchTravelpayoutsFlights(
  originIata: string,
  destIata: string,
  departureDate: string,
  adults: number = 1
): Promise<LiveFlightResult | null> {
  const tkn = token();
  if (!tkn) return null;
  if (!originIata || !destIata || originIata.length !== 3 || destIata.length !== 3) {
    return null;
  }

  const cacheKey = `tp:flights:${originIata}:${destIata}:${departureDate}`;
  const cached = await cacheGetJson<LiveFlightResult>(cacheKey);
  if (cached) return cached;

  // departure_at accepts YYYY-MM-DD; one-way cheapest offers, sorted by price.
  const params = new URLSearchParams({
    origin: originIata,
    destination: destIata,
    departure_at: departureDate,
    currency: "usd",
    one_way: "true",
    direct: "false",
    sorting: "price",
    limit: "30",
    page: "1",
  });

  const data = await fetchJson(
    `https://api.travelpayouts.com/aviasales/v3/prices_for_dates?${params}`,
    { "X-Access-Token": tkn }
  );

  const offers: any[] = data?.data ?? [];
  if (offers.length === 0) return null;

  const s = stats(offers.map((o) => Number(o.price)));
  if (!s) return null;

  // Affiliate booking deep-link (rich relative `link` from the API + our marker,
  // falling back to a generic search link).
  const rawLink: string | undefined = offers[0]?.link;
  const bookingLink =
    rawLink && marker()
      ? `https://www.aviasales.com${rawLink}${rawLink.includes("?") ? "&" : "?"}marker=${marker()}`
      : buildFlightBookingLink(originIata, destIata) ?? undefined;

  const result: LiveFlightResult = {
    pricePerPerson: s, // already per-person; Aviasales prices are per passenger
    currency: "USD",
    source: "travelpayouts_aviasales_live",
    bookingLink,
  };

  await cacheSetJson(cacheKey, result, CACHE_TTL_SECONDS);
  console.log(
    `[Travelpayouts] ✈️ ${originIata}->${destIata}: $${s.min}-$${s.max} (avg $${s.average})`
  );
  return result;
}

// ─── Hotels (Hotellook cache) ───────────────────────────────────────────────

export async function fetchTravelpayoutsHotels(
  cityName: string,
  checkInDate: string,
  checkOutDate: string,
  adults: number = 2
): Promise<LiveHotelResult | null> {
  const tkn = token();
  if (!tkn) return null;
  if (!cityName) return null;

  const cacheKey = `tp:hotels:${cityName.toLowerCase()}:${checkInDate}:${checkOutDate}`;
  const cached = await cacheGetJson<LiveHotelResult>(cacheKey);
  if (cached) return cached;

  const nights = Math.max(
    1,
    Math.round(
      (new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) /
        86400000
    )
  );

  // NOTE: Hotellook's cached-price endpoint can vary by partner/account. Treat it
  // as best-effort: on any non-200 (e.g. 404) fetchJson returns null and we fall
  // through to the caller's existing hotel fallback. The affiliate booking link
  // below is built independently so it always works when a marker is set.
  const params = new URLSearchParams({
    location: cityName,
    currency: "usd",
    checkIn: checkInDate,
    checkOut: checkOutDate,
    limit: "30",
    token: tkn,
  });

  const data = await fetchJson(
    `https://engine.hotellook.com/api/v2/cache.json?${params}`
  );

  const hotels: any[] = Array.isArray(data) ? data : data?.hotels ?? [];
  if (hotels.length === 0) return null;

  // priceAvg/priceFrom are totals for the stay → normalize to per-night.
  const perNight = hotels
    .map((h) => {
      const total = Number(h.priceAvg ?? h.priceFrom);
      return total > 0 ? total / nights : null;
    })
    .filter((p): p is number => p !== null);

  const s = stats(perNight);
  if (!s) return null;

  const result: LiveHotelResult = {
    ...s,
    currency: "USD",
    source: "travelpayouts_hotellook_live",
    bookingLink:
      buildHotelBookingLink(cityName, checkInDate, checkOutDate, adults) ??
      undefined,
  };

  await cacheSetJson(cacheKey, result, CACHE_TTL_SECONDS);
  console.log(
    `[Travelpayouts] 🏨 ${cityName}: $${s.min}-$${s.max}/night (avg $${s.average})`
  );
  return result;
}
