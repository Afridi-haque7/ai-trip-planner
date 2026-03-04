/**
 * Hotel Estimation Tool — v2
 *
 * Core fix: rates are derived from real PlaceResult hotel data (which is
 * already in the user's currency and destination-specific), NOT from a
 * hardcoded USD lookup table with 12 cities.
 *
 * The tool is now a pure calculator — it takes known pricePerNight values
 * and computes totals with seasonal adjustments.
 */

import type { PlaceResult } from "@/lib/adk/schemas";

// ─── Types ────────────────────────────────────────────────────────────────────

interface HotelEstimationParams {
  places: PlaceResult;                          // Real hotel data from Place Agent
  budgetLevel: "low" | "medium" | "luxury";
  numberOfNights: number;
  checkInDate: string;                          // "YYYY-MM-DD"
  numberOfRooms?: number;
  currency: string;                             // ISO 4217 — for logging only
}

interface HotelCostEstimate {
  min: number;
  max: number;
  average: number;
}

interface DetailedHotelEstimate {
  budgetLevel: string;
  currency: string;
  nightlyRate: HotelCostEstimate;
  totalCost: HotelCostEstimate;
  seasonalMultiplier: number;
  numberOfNights: number;
  numberOfRooms: number;
  source: "places_data" | "fallback";
}

// ─── Seasonal multiplier ──────────────────────────────────────────────────────

/**
 * Returns a multiplier based on Northern Hemisphere seasonality.
 * Peak: Jun–Aug, Dec–Jan  → ×1.4
 * Shoulder: Mar–May, Sep–Nov → ×1.15
 * Off: Feb               → ×0.85
 */
function getSeasonalMultiplier(checkInDate: string): number {
  const month = new Date(checkInDate).getMonth(); // 0-indexed
  if ((month >= 5 && month <= 7) || month === 11 || month === 0) return 1.4;
  if ((month >= 2 && month <= 4) || (month >= 8 && month <= 10)) return 1.15;
  return 0.85;
}

// ─── Rate extractor ───────────────────────────────────────────────────────────

/**
 * Pulls pricePerNight values from PlaceResult for the given tier.
 * Falls back to adjacent tiers if the requested tier has no data.
 *
 * Returns { min, max, average } nightly rates in the user's currency.
 */
function extractNightlyRatesFromPlaces(
  places: PlaceResult,
  budgetLevel: "low" | "medium" | "luxury"
): { min: number; max: number; average: number; source: "places_data" | "fallback" } {
  const tierOrder: Array<"low" | "medium" | "luxury"> = ["low", "medium", "luxury"];

  // Try requested tier first, then adjacent tiers
  const tiersToTry = [
    budgetLevel,
    ...tierOrder.filter((t) => t !== budgetLevel),
  ] as Array<"low" | "medium" | "luxury">;

  for (const tier of tiersToTry) {
    const hotels = places.hotelRecommendations?.[tier] ?? [];
    const prices = hotels
      .map((h) => h.pricePerNight)
      .filter((p) => typeof p === "number" && p > 0);

    if (prices.length === 0) continue;

    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const average = Math.round(prices.reduce((s, p) => s + p, 0) / prices.length);

    console.log(
      `[Hotel Tool] Rates from places.${tier}: min=${min}, avg=${average}, max=${max}`
    );

    return { min, max, average, source: "places_data" };
  }

  // If PlaceResult has no hotel data at all, return zeros so the caller knows
  console.warn("[Hotel Tool] No hotel price data found in PlaceResult, returning zeros.");
  return { min: 0, max: 0, average: 0, source: "fallback" };
}

// ─── Main exports ─────────────────────────────────────────────────────────────

/**
 * Estimate total hotel cost for the stay.
 * All returned values are in the same currency as places.hotelRecommendations prices.
 */
export function estimateHotelCost(params: HotelEstimationParams): HotelCostEstimate {
  const { places, budgetLevel, numberOfNights, checkInDate, numberOfRooms = 1 } = params;

  const nightlyRates = extractNightlyRatesFromPlaces(places, budgetLevel);
  const seasonal = getSeasonalMultiplier(checkInDate);

  // Apply seasonal multiplier to the nightly rate
  const adjMin     = Math.round(nightlyRates.min     * seasonal);
  const adjAverage = Math.round(nightlyRates.average * seasonal);
  const adjMax     = Math.round(nightlyRates.max     * seasonal);

  return {
    min:     adjMin     * numberOfNights * numberOfRooms,
    max:     adjMax     * numberOfNights * numberOfRooms,
    average: adjAverage * numberOfNights * numberOfRooms,
  };
}

/**
 * Detailed breakdown — useful for the Budget Agent prompt context.
 */
export function getDetailedHotelEstimate(
  params: HotelEstimationParams
): DetailedHotelEstimate {
  const { places, budgetLevel, numberOfNights, checkInDate, numberOfRooms = 1, currency } = params;

  const nightlyRates = extractNightlyRatesFromPlaces(places, budgetLevel);
  const seasonal = getSeasonalMultiplier(checkInDate);

  const adjNightly = {
    min:     Math.round(nightlyRates.min     * seasonal),
    max:     Math.round(nightlyRates.max     * seasonal),
    average: Math.round(nightlyRates.average * seasonal),
  };

  const checkOutDate = new Date(checkInDate);
  checkOutDate.setDate(checkOutDate.getDate() + numberOfNights);

  console.log(
    `[Hotel Tool] ${budgetLevel} | ${numberOfNights} nights × ${numberOfRooms} room(s) | ` +
    `nightly avg: ${adjNightly.average} ${currency} | seasonal: ×${seasonal}`
  );

  return {
    budgetLevel,
    currency,
    nightlyRate: adjNightly,
    totalCost: {
      min:     adjNightly.min     * numberOfNights * numberOfRooms,
      max:     adjNightly.max     * numberOfNights * numberOfRooms,
      average: adjNightly.average * numberOfNights * numberOfRooms,
    },
    seasonalMultiplier: parseFloat(seasonal.toFixed(2)),
    numberOfNights,
    numberOfRooms,
    source: nightlyRates.source,
  };
}

/**
 * Returns nightly rate range per tier — useful for displaying tier comparison UI.
 * All values in the user's currency.
 */
export function getBudgetTiersForDestination(
  places: PlaceResult,
  currency: string
): Record<"low" | "medium" | "luxury", { min: number; max: number; average: number }> {
  const tiers = ["low", "medium", "luxury"] as const;
  return Object.fromEntries(
    tiers.map((tier) => {
      const rates = extractNightlyRatesFromPlaces(places, tier);
      return [tier, { min: rates.min, max: rates.max, average: rates.average }];
    })
  ) as Record<"low" | "medium" | "luxury", { min: number; max: number; average: number }>;
}