/**
 * Flight Estimation Tool
 *
 * Estimates flight costs based on:
 * - Route (origin → destination)
 * - Distance
 * - Number of travelers
 * - Travel dates (seasonality)
 *
 * Currently uses estimation formula; can be replaced with real flight search API.
 */

interface FlightEstimationParams {
  origin: string;
  destination: string;
  numberOfTravelers: number;
  departureDate: string;
  returnDate: string;
  currency?: string;
}

interface FlightCostEstimate {
  min: number;
  max: number;
  average: number;
}

// Approximate distances (km) between major travel hubs
// Format: "ORIGIN-DESTINATION"
const DISTANCE_MAP: Record<string, number> = {
  "new-delhi-bali": 3300,
  "mumbai-bali": 3200,
  "london-bali": 11000,
  "new-york-bali": 14500,
  "singapore-bali": 1900,
  "bangkok-bali": 1500,
  "los-angeles-new-york": 3900,
  "london-paris": 340,
  "london-dubai": 5000,
  "dubai-bangkok": 2100,
  "tokyo-sydney": 7800,
};

/**
 * Get approximate distance between two cities
 * Uses reverse lookup if direct route not found
 */
function getDistance(origin: string, destination: string): number {
  const key1 = `${origin}-${destination}`.toLowerCase();
  const key2 = `${destination}-${origin}`.toLowerCase();

  if (key1 in DISTANCE_MAP) return DISTANCE_MAP[key1];
  if (key2 in DISTANCE_MAP) return DISTANCE_MAP[key2];

  // Default estimation: assume ~6000km average international flight
  return 6000;
}

/**
 * Calculate base price per kilometer
 * Longer flights have cheaper per-km cost
 */
function getBasePricePerKm(distance: number): number {
  if (distance < 1000) return 0.15; // Short haul
  if (distance < 3000) return 0.12; // Medium haul
  if (distance < 6000) return 0.10; // Long haul
  return 0.08; // Very long haul
}

/**
 * Get seasonal multiplier (peak season = more expensive)
 */
function getSeasonalMultiplier(date: string): number {
  const travelDate = new Date(date);
  const month = travelDate.getMonth();

  // Peak seasons: June-August (summer), December-January (winter holidays)
  if ((month >= 5 && month <= 7) || month === 11 || month === 0) {
    return 1.4; // 40% more expensive
  }

  // Shoulder seasons: March-May, September-November
  if ((month >= 2 && month <= 4) || (month >= 8 && month <= 10)) {
    return 1.15; // 15% more expensive
  }

  // Off-season: February
  return 0.9; // 10% cheaper
}

/**
 * Estimate flight costs
 */
export function estimateFlightCost(
  params: FlightEstimationParams
): FlightCostEstimate {
  const distance = getDistance(params.origin, params.destination);
  const basePricePerKm = getBasePricePerKm(distance);
  const seasonalMult = getSeasonalMultiplier(params.departureDate);

  // Base calculation: distance * price per km
  let basePrice = distance * basePricePerKm;
  basePrice = basePrice * seasonalMult;

  // Round to nearest 10
  basePrice = Math.round(basePrice / 10) * 10;

  // Create range: -20% to +20% from average
  const min = Math.round(basePrice * 0.8);
  const max = Math.round(basePrice * 1.2);
  const average = Math.round(basePrice);

  // Multiply by number of travelers
  return {
    min: min * params.numberOfTravelers,
    max: max * params.numberOfTravelers,
    average: average * params.numberOfTravelers,
  };
}

/**
 * Get more detailed flight estimate with breakdown
 */
export function getDetailedFlightEstimate(
  params: FlightEstimationParams
): {
  distance: number;
  pricePerPerson: FlightCostEstimate;
  priceForGroup: FlightCostEstimate;
  seasonalMultiplier: number;
  estimatedDeparture: string;
} {
  const distance = getDistance(params.origin, params.destination);
  const seasonalMult = getSeasonalMultiplier(params.departureDate);
  const basePricePerKm = getBasePricePerKm(distance);

  let basePrice = distance * basePricePerKm * seasonalMult;
  basePrice = Math.round(basePrice / 10) * 10;

  const pricePerPerson: FlightCostEstimate = {
    min: Math.round(basePrice * 0.8),
    max: Math.round(basePrice * 1.2),
    average: Math.round(basePrice),
  };

  const priceForGroup: FlightCostEstimate = {
    min: pricePerPerson.min * params.numberOfTravelers,
    max: pricePerPerson.max * params.numberOfTravelers,
    average: pricePerPerson.average * params.numberOfTravelers,
  };

  return {
    distance,
    pricePerPerson,
    priceForGroup,
    seasonalMultiplier: parseFloat(seasonalMult.toFixed(2)),
    estimatedDeparture: params.departureDate,
  };
}

/**
 * Check if route is supported (has known distance)
 */
export function isRouteKnown(origin: string, destination: string): boolean {
  const key1 = `${origin}-${destination}`.toLowerCase();
  const key2 = `${destination}-${origin}`.toLowerCase();
  return key1 in DISTANCE_MAP || key2 in DISTANCE_MAP;
}
