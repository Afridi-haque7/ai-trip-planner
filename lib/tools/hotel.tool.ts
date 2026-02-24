/**
 * Hotel Estimation Tool
 *
 * Estimates hotel costs based on:
 * - Destination
 * - Budget level (low/medium/luxury)
 * - Number of nights
 * - Travel dates (seasonality)
 *
 * Currently uses estimation formula; can be replaced with real hotel search API.
 */

interface HotelEstimationParams {
  destination: string;
  numberOfNights: number;
  budgetLevel: "low" | "medium" | "luxury";
  checkInDate: string;
  numberOfRooms?: number;
  currency?: string;
}

interface HotelCostEstimate {
  min: number;
  max: number;
  average: number;
}

// Base nightly rates by destination and budget tier
// Format: "DESTINATION" -> { low, medium, luxury }
const BASE_RATES: Record<
  string,
  { low: number; medium: number; luxury: number }
> = {
  "new-delhi": { low: 30, medium: 80, luxury: 250 },
  mumbai: { low: 40, medium: 100, luxury: 300 },
  bali: { low: 25, medium: 70, luxury: 200 },
  bangkok: { low: 20, medium: 60, luxury: 180 },
  singapore: { low: 60, medium: 150, luxury: 400 },
  dubai: { low: 50, medium: 120, luxury: 350 },
  london: { low: 70, medium: 160, luxury: 450 },
  paris: { low: 60, medium: 140, luxury: 420 },
  "new-york": { low: 90, medium: 200, luxury: 500 },
  tokyo: { low: 50, medium: 130, luxury: 380 },
  sydney: { low: 70, medium: 150, luxury: 400 },
  "los-angeles": { low: 60, medium: 140, luxury: 380 },
};

/**
 * Get base nightly rate for destination
 * If destination not found, uses median estimate
 */
function getBaseNightlyRate(
  destination: string,
  budgetLevel: "low" | "medium" | "luxury"
): number {
  const key = destination.toLowerCase().replace(/\s+/g, "-");

  if (key in BASE_RATES) {
    return BASE_RATES[key][budgetLevel];
  }

  // Default estimates for unknown destinations
  switch (budgetLevel) {
    case "low":
      return 35;
    case "medium":
      return 100;
    case "luxury":
      return 300;
  }
}

/**
 * Get seasonal multiplier
 */
function getSeasonalMultiplier(checkInDate: string): number {
  const date = new Date(checkInDate);
  const month = date.getMonth();

  // Peak seasons: June-August (summer), December-January (winter holidays)
  if ((month >= 5 && month <= 7) || month === 11 || month === 0) {
    return 1.5; // 50% more expensive
  }

  // Shoulder seasons: March-May, September-November
  if ((month >= 2 && month <= 4) || (month >= 8 && month <= 10)) {
    return 1.2; // 20% more expensive
  }

  // Off-season: February
  return 0.85; // 15% cheaper
}

/**
 * Estimate hotel costs for total stay
 */
export function estimateHotelCost(
  params: HotelEstimationParams
): HotelCostEstimate {
  const baseRate = getBaseNightlyRate(params.destination, params.budgetLevel);
  const seasonalMult = getSeasonalMultiplier(params.checkInDate);
  const numberOfRooms = params.numberOfRooms || 1;

  // Calculate nightly rate with seasonal adjustment
  let nightlyRate = baseRate * seasonalMult;
  nightlyRate = Math.round(nightlyRate);

  // Create range: -15% to +20% from average
  const minNightly = Math.round(nightlyRate * 0.85);
  const maxNightly = Math.round(nightlyRate * 1.2);

  // Calculate total for all nights and rooms
  const min = minNightly * params.numberOfNights * numberOfRooms;
  const max = maxNightly * params.numberOfNights * numberOfRooms;
  const average = nightlyRate * params.numberOfNights * numberOfRooms;

  return {
    min: Math.round(min),
    max: Math.round(max),
    average: Math.round(average),
  };
}

/**
 * Get detailed hotel estimate with breakdown
 */
export function getDetailedHotelEstimate(
  params: HotelEstimationParams
): {
  destination: string;
  budgetLevel: string;
  nightlyRate: {
    min: number;
    max: number;
    average: number;
  };
  totalCost: HotelCostEstimate;
  seasonalMultiplier: number;
  checkInDate: string;
  checkOutDate: string;
} {
  const baseRate = getBaseNightlyRate(params.destination, params.budgetLevel);
  const seasonalMult = getSeasonalMultiplier(params.checkInDate);
  const numberOfRooms = params.numberOfRooms || 1;

  let nightlyRate = baseRate * seasonalMult;
  nightlyRate = Math.round(nightlyRate);

  const minNightly = Math.round(nightlyRate * 0.85);
  const maxNightly = Math.round(nightlyRate * 1.2);

  const nightlyRates = {
    min: minNightly,
    max: maxNightly,
    average: nightlyRate,
  };

  const totalCost: HotelCostEstimate = {
    min: minNightly * params.numberOfNights * numberOfRooms,
    max: maxNightly * params.numberOfNights * numberOfRooms,
    average: nightlyRate * params.numberOfNights * numberOfRooms,
  };

  const checkOutDate = new Date(params.checkInDate);
  checkOutDate.setDate(
    checkOutDate.getDate() + params.numberOfNights
  );
  const checkOutIso = checkOutDate.toISOString().split("T")[0];

  return {
    destination: params.destination,
    budgetLevel: params.budgetLevel,
    nightlyRate: nightlyRates,
    totalCost: {
      min: Math.round(totalCost.min),
      max: Math.round(totalCost.max),
      average: Math.round(totalCost.average),
    },
    seasonalMultiplier: parseFloat(seasonalMult.toFixed(2)),
    checkInDate: params.checkInDate,
    checkOutDate: checkOutIso,
  };
}

/**
 * Get available budget tiers for a destination
 */
export function getBudgetTiersForDestination(
  destination: string
): Record<string, number> {
  return {
    low: getBaseNightlyRate(destination, "low"),
    medium: getBaseNightlyRate(destination, "medium"),
    luxury: getBaseNightlyRate(destination, "luxury"),
  };
}
