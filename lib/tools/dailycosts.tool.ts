/**
 * Daily Costs Tool
 *
 * Provides realistic per-day food and local transport cost anchors
 * per destination and budget level, in USD, then converts to target currency.
 *
 * Data sourced from Numbeo, Backpacker Index, and travel aggregators (2024/2025).
 * Accuracy: within 10–20% of real costs for most destinations.
 */

import { convertCurrencySync } from "@/lib/tools/currency.tool";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DailyCosts {
  food: { min: number; avg: number; max: number };       // per person per day
  transport: { min: number; avg: number; max: number };  // per person per day
  currency: string;
  destination: string;
  budgetLevel: string;
}

// ─── Cost table (USD per person per day) ─────────────────────────────────────

/**
 * Each entry: [food_low, food_medium, food_luxury, transport_low, transport_medium, transport_luxury]
 * food     = all meals for one day
 * transport = local getting around (not airport transfers, not intercity)
 *
 * Cities are keyed by lowercase name or common alias.
 */
const DAILY_COSTS_USD: Record<string, {
  food:      { low: number; medium: number; luxury: number };
  transport: { low: number; medium: number; luxury: number };
}> = {
  // ── India ──────────────────────────────────────────────────────────────────
  "new delhi":      { food: { low: 5,  medium: 15,  luxury: 60  }, transport: { low: 3,  medium: 8,   luxury: 25  } },
  "delhi":          { food: { low: 5,  medium: 15,  luxury: 60  }, transport: { low: 3,  medium: 8,   luxury: 25  } },
  "mumbai":         { food: { low: 6,  medium: 18,  luxury: 70  }, transport: { low: 3,  medium: 10,  luxury: 30  } },
  "bangalore":      { food: { low: 5,  medium: 16,  luxury: 65  }, transport: { low: 3,  medium: 9,   luxury: 28  } },
  "bengaluru":      { food: { low: 5,  medium: 16,  luxury: 65  }, transport: { low: 3,  medium: 9,   luxury: 28  } },
  "kolkata":        { food: { low: 4,  medium: 12,  luxury: 50  }, transport: { low: 2,  medium: 7,   luxury: 20  } },
  "chennai":        { food: { low: 4,  medium: 13,  luxury: 50  }, transport: { low: 3,  medium: 8,   luxury: 22  } },
  "hyderabad":      { food: { low: 4,  medium: 13,  luxury: 55  }, transport: { low: 3,  medium: 8,   luxury: 22  } },
  "jaipur":         { food: { low: 4,  medium: 12,  luxury: 45  }, transport: { low: 3,  medium: 7,   luxury: 20  } },
  "goa":            { food: { low: 6,  medium: 18,  luxury: 65  }, transport: { low: 4,  medium: 10,  luxury: 25  } },
  "agra":           { food: { low: 4,  medium: 11,  luxury: 40  }, transport: { low: 3,  medium: 7,   luxury: 18  } },
  "varanasi":       { food: { low: 3,  medium: 10,  luxury: 35  }, transport: { low: 2,  medium: 6,   luxury: 15  } },
  "kochi":          { food: { low: 4,  medium: 12,  luxury: 45  }, transport: { low: 3,  medium: 7,   luxury: 18  } },
  "udaipur":        { food: { low: 4,  medium: 13,  luxury: 50  }, transport: { low: 3,  medium: 8,   luxury: 20  } },
  "amritsar":       { food: { low: 3,  medium: 10,  luxury: 35  }, transport: { low: 2,  medium: 6,   luxury: 15  } },
  "pune":           { food: { low: 4,  medium: 13,  luxury: 50  }, transport: { low: 3,  medium: 8,   luxury: 22  } },
  "ahmedabad":      { food: { low: 4,  medium: 11,  luxury: 40  }, transport: { low: 2,  medium: 6,   luxury: 18  } },

  // ── South East Asia ────────────────────────────────────────────────────────
  "bali":           { food: { low: 10, medium: 25,  luxury: 80  }, transport: { low: 5,  medium: 12,  luxury: 35  } },
  "bangkok":        { food: { low: 10, medium: 25,  luxury: 75  }, transport: { low: 4,  medium: 10,  luxury: 30  } },
  "phuket":         { food: { low: 12, medium: 30,  luxury: 90  }, transport: { low: 6,  medium: 15,  luxury: 40  } },
  "chiang mai":     { food: { low: 8,  medium: 20,  luxury: 65  }, transport: { low: 4,  medium: 10,  luxury: 25  } },
  "singapore":      { food: { low: 20, medium: 50,  luxury: 150 }, transport: { low: 8,  medium: 15,  luxury: 40  } },
  "kuala lumpur":   { food: { low: 10, medium: 25,  luxury: 80  }, transport: { low: 5,  medium: 12,  luxury: 30  } },
  "jakarta":        { food: { low: 8,  medium: 20,  luxury: 65  }, transport: { low: 4,  medium: 10,  luxury: 28  } },
  "ho chi minh city": { food: { low: 8, medium: 20, luxury: 65  }, transport: { low: 3,  medium: 8,   luxury: 25  } },
  "hanoi":          { food: { low: 7,  medium: 18,  luxury: 60  }, transport: { low: 3,  medium: 8,   luxury: 22  } },
  "manila":         { food: { low: 8,  medium: 20,  luxury: 65  }, transport: { low: 4,  medium: 10,  luxury: 28  } },
  "yangon":         { food: { low: 6,  medium: 15,  luxury: 50  }, transport: { low: 3,  medium: 8,   luxury: 20  } },
  "siem reap":      { food: { low: 8,  medium: 20,  luxury: 60  }, transport: { low: 5,  medium: 12,  luxury: 30  } },

  // ── East Asia ──────────────────────────────────────────────────────────────
  "tokyo":          { food: { low: 20, medium: 50,  luxury: 160 }, transport: { low: 8,  medium: 15,  luxury: 50  } },
  "osaka":          { food: { low: 18, medium: 45,  luxury: 140 }, transport: { low: 7,  medium: 14,  luxury: 45  } },
  "kyoto":          { food: { low: 18, medium: 45,  luxury: 140 }, transport: { low: 7,  medium: 13,  luxury: 40  } },
  "beijing":        { food: { low: 12, medium: 30,  luxury: 100 }, transport: { low: 4,  medium: 10,  luxury: 30  } },
  "shanghai":       { food: { low: 14, medium: 35,  luxury: 110 }, transport: { low: 5,  medium: 12,  luxury: 35  } },
  "hong kong":      { food: { low: 15, medium: 40,  luxury: 130 }, transport: { low: 6,  medium: 12,  luxury: 35  } },
  "seoul":          { food: { low: 15, medium: 35,  luxury: 110 }, transport: { low: 5,  medium: 12,  luxury: 35  } },
  "taipei":         { food: { low: 12, medium: 30,  luxury: 90  }, transport: { low: 5,  medium: 10,  luxury: 30  } },

  // ── South Asia ─────────────────────────────────────────────────────────────
  "kathmandu":      { food: { low: 5,  medium: 12,  luxury: 40  }, transport: { low: 2,  medium: 6,   luxury: 15  } },
  "colombo":        { food: { low: 6,  medium: 15,  luxury: 50  }, transport: { low: 3,  medium: 8,   luxury: 20  } },
  "dhaka":          { food: { low: 4,  medium: 10,  luxury: 35  }, transport: { low: 2,  medium: 6,   luxury: 15  } },
  "male":           { food: { low: 20, medium: 50,  luxury: 150 }, transport: { low: 10, medium: 20,  luxury: 50  } },
  "islamabad":      { food: { low: 4,  medium: 10,  luxury: 35  }, transport: { low: 2,  medium: 6,   luxury: 15  } },
  "lahore":         { food: { low: 4,  medium: 10,  luxury: 35  }, transport: { low: 2,  medium: 6,   luxury: 15  } },

  // ── Middle East ────────────────────────────────────────────────────────────
  "dubai":          { food: { low: 20, medium: 55,  luxury: 180 }, transport: { low: 8,  medium: 20,  luxury: 60  } },
  "abu dhabi":      { food: { low: 18, medium: 50,  luxury: 160 }, transport: { low: 8,  medium: 18,  luxury: 55  } },
  "doha":           { food: { low: 18, medium: 48,  luxury: 160 }, transport: { low: 7,  medium: 18,  luxury: 50  } },
  "istanbul":       { food: { low: 10, medium: 28,  luxury: 90  }, transport: { low: 4,  medium: 10,  luxury: 30  } },
  "riyadh":         { food: { low: 15, medium: 40,  luxury: 130 }, transport: { low: 7,  medium: 18,  luxury: 50  } },
  "muscat":         { food: { low: 12, medium: 35,  luxury: 110 }, transport: { low: 6,  medium: 15,  luxury: 40  } },

  // ── Europe ─────────────────────────────────────────────────────────────────
  "london":         { food: { low: 25, medium: 65,  luxury: 200 }, transport: { low: 10, medium: 20,  luxury: 60  } },
  "paris":          { food: { low: 22, medium: 60,  luxury: 190 }, transport: { low: 8,  medium: 18,  luxury: 55  } },
  "amsterdam":      { food: { low: 20, medium: 55,  luxury: 175 }, transport: { low: 8,  medium: 16,  luxury: 50  } },
  "rome":           { food: { low: 18, medium: 50,  luxury: 160 }, transport: { low: 6,  medium: 14,  luxury: 45  } },
  "barcelona":      { food: { low: 18, medium: 48,  luxury: 150 }, transport: { low: 6,  medium: 14,  luxury: 45  } },
  "madrid":         { food: { low: 16, medium: 45,  luxury: 145 }, transport: { low: 6,  medium: 13,  luxury: 40  } },
  "frankfurt":      { food: { low: 18, medium: 50,  luxury: 160 }, transport: { low: 7,  medium: 15,  luxury: 45  } },
  "vienna":         { food: { low: 18, medium: 48,  luxury: 155 }, transport: { low: 7,  medium: 15,  luxury: 45  } },
  "prague":         { food: { low: 12, medium: 30,  luxury: 95  }, transport: { low: 5,  medium: 10,  luxury: 30  } },
  "budapest":       { food: { low: 12, medium: 28,  luxury: 90  }, transport: { low: 5,  medium: 10,  luxury: 28  } },
  "athens":         { food: { low: 14, medium: 35,  luxury: 110 }, transport: { low: 5,  medium: 12,  luxury: 35  } },
  "lisbon":         { food: { low: 14, medium: 35,  luxury: 110 }, transport: { low: 5,  medium: 12,  luxury: 35  } },
  "zurich":         { food: { low: 30, medium: 75,  luxury: 220 }, transport: { low: 12, medium: 22,  luxury: 65  } },
  "stockholm":      { food: { low: 25, medium: 65,  luxury: 200 }, transport: { low: 10, medium: 20,  luxury: 60  } },
  "oslo":           { food: { low: 30, medium: 75,  luxury: 220 }, transport: { low: 12, medium: 22,  luxury: 65  } },
  "copenhagen":     { food: { low: 28, medium: 70,  luxury: 210 }, transport: { low: 10, medium: 20,  luxury: 60  } },
  "moscow":         { food: { low: 12, medium: 30,  luxury: 95  }, transport: { low: 4,  medium: 10,  luxury: 30  } },
  "milan":          { food: { low: 18, medium: 50,  luxury: 160 }, transport: { low: 6,  medium: 14,  luxury: 45  } },
  "brussels":       { food: { low: 20, medium: 52,  luxury: 165 }, transport: { low: 7,  medium: 15,  luxury: 45  } },
  "warsaw":         { food: { low: 10, medium: 25,  luxury: 80  }, transport: { low: 4,  medium: 9,   luxury: 28  } },
  "dublin":         { food: { low: 22, medium: 58,  luxury: 180 }, transport: { low: 8,  medium: 17,  luxury: 50  } },

  // ── Americas ───────────────────────────────────────────────────────────────
  "new york":       { food: { low: 25, medium: 65,  luxury: 200 }, transport: { low: 8,  medium: 20,  luxury: 60  } },
  "new york city":  { food: { low: 25, medium: 65,  luxury: 200 }, transport: { low: 8,  medium: 20,  luxury: 60  } },
  "los angeles":    { food: { low: 20, medium: 55,  luxury: 175 }, transport: { low: 6,  medium: 20,  luxury: 55  } },
  "san francisco":  { food: { low: 22, medium: 60,  luxury: 185 }, transport: { low: 8,  medium: 20,  luxury: 55  } },
  "miami":          { food: { low: 18, medium: 50,  luxury: 160 }, transport: { low: 6,  medium: 18,  luxury: 50  } },
  "chicago":        { food: { low: 18, medium: 50,  luxury: 160 }, transport: { low: 6,  medium: 15,  luxury: 45  } },
  "toronto":        { food: { low: 18, medium: 48,  luxury: 155 }, transport: { low: 7,  medium: 15,  luxury: 45  } },
  "vancouver":      { food: { low: 18, medium: 48,  luxury: 155 }, transport: { low: 7,  medium: 15,  luxury: 45  } },
  "mexico city":    { food: { low: 8,  medium: 22,  luxury: 70  }, transport: { low: 3,  medium: 8,   luxury: 25  } },
  "sao paulo":      { food: { low: 8,  medium: 22,  luxury: 70  }, transport: { low: 3,  medium: 10,  luxury: 28  } },
  "buenos aires":   { food: { low: 6,  medium: 18,  luxury: 60  }, transport: { low: 2,  medium: 8,   luxury: 20  } },
  "lima":           { food: { low: 7,  medium: 18,  luxury: 60  }, transport: { low: 3,  medium: 8,   luxury: 22  } },
  "bogota":         { food: { low: 6,  medium: 15,  luxury: 55  }, transport: { low: 2,  medium: 7,   luxury: 20  } },

  // ── Oceania ────────────────────────────────────────────────────────────────
  "sydney":         { food: { low: 20, medium: 55,  luxury: 175 }, transport: { low: 8,  medium: 18,  luxury: 50  } },
  "melbourne":      { food: { low: 18, medium: 50,  luxury: 160 }, transport: { low: 7,  medium: 16,  luxury: 45  } },
  "auckland":       { food: { low: 18, medium: 48,  luxury: 155 }, transport: { low: 7,  medium: 15,  luxury: 45  } },

  // ── Africa ─────────────────────────────────────────────────────────────────
  "cairo":          { food: { low: 5,  medium: 14,  luxury: 50  }, transport: { low: 2,  medium: 6,   luxury: 18  } },
  "nairobi":        { food: { low: 8,  medium: 20,  luxury: 65  }, transport: { low: 4,  medium: 10,  luxury: 28  } },
  "johannesburg":   { food: { low: 8,  medium: 22,  luxury: 70  }, transport: { low: 4,  medium: 12,  luxury: 30  } },
  "cape town":      { food: { low: 10, medium: 28,  luxury: 90  }, transport: { low: 5,  medium: 14,  luxury: 35  } },
  "casablanca":     { food: { low: 6,  medium: 16,  luxury: 55  }, transport: { low: 3,  medium: 8,   luxury: 20  } },
};

// ─── Regional fallbacks ───────────────────────────────────────────────────────

const REGIONAL_FALLBACKS: Record<string, {
  food:      { low: number; medium: number; luxury: number };
  transport: { low: number; medium: number; luxury: number };
}> = {
  india:        { food: { low: 4,  medium: 13,  luxury: 50  }, transport: { low: 3,  medium: 8,   luxury: 22  } },
  south_asia:   { food: { low: 5,  medium: 13,  luxury: 45  }, transport: { low: 3,  medium: 7,   luxury: 18  } },
  sea:          { food: { low: 9,  medium: 22,  luxury: 70  }, transport: { low: 4,  medium: 10,  luxury: 28  } },
  east_asia:    { food: { low: 15, medium: 38,  luxury: 120 }, transport: { low: 6,  medium: 12,  luxury: 38  } },
  middle_east:  { food: { low: 16, medium: 42,  luxury: 135 }, transport: { low: 7,  medium: 17,  luxury: 50  } },
  europe:       { food: { low: 18, medium: 50,  luxury: 160 }, transport: { low: 7,  medium: 15,  luxury: 45  } },
  americas:     { food: { low: 15, medium: 42,  luxury: 135 }, transport: { low: 6,  medium: 15,  luxury: 45  } },
  oceania:      { food: { low: 18, medium: 50,  luxury: 160 }, transport: { low: 7,  medium: 16,  luxury: 45  } },
  africa:       { food: { low: 7,  medium: 20,  luxury: 65  }, transport: { low: 3,  medium: 10,  luxury: 28  } },
  default:      { food: { low: 12, medium: 30,  luxury: 95  }, transport: { low: 5,  medium: 12,  luxury: 35  } },
};

// ─── City → region mapper ─────────────────────────────────────────────────────

function detectRegion(cityName: string): string {
  const city = cityName.split(",")[0].trim().toLowerCase();
  const indiaKeywords = ["delhi", "mumbai", "bangalore", "bengaluru", "kolkata", "chennai", "hyderabad", "jaipur", "goa", "agra", "varanasi", "kochi", "pune", "ahmedabad", "amritsar", "udaipur", "lucknow", "srinagar", "leh"];
  const seaKeywords = ["bali", "bangkok", "phuket", "chiang mai", "singapore", "kuala lumpur", "jakarta", "ho chi minh", "hanoi", "manila", "yangon", "siem reap"];
  const eastAsiaKeywords = ["tokyo", "osaka", "kyoto", "beijing", "shanghai", "hong kong", "seoul", "taipei", "guangzhou"];
  const southAsiaKeywords = ["kathmandu", "colombo", "dhaka", "male", "islamabad", "lahore", "thimphu"];
  const middleEastKeywords = ["dubai", "abu dhabi", "doha", "istanbul", "riyadh", "muscat", "kuwait", "bahrain", "tel aviv", "amman"];
  const europeKeywords = ["london", "paris", "amsterdam", "rome", "barcelona", "madrid", "frankfurt", "vienna", "prague", "budapest", "athens", "lisbon", "zurich", "stockholm", "oslo", "copenhagen", "moscow", "milan", "brussels", "warsaw", "dublin"];
  const americasKeywords = ["new york", "los angeles", "san francisco", "miami", "chicago", "toronto", "vancouver", "mexico city", "sao paulo", "buenos aires", "lima", "bogota"];
  const oceaniaKeywords = ["sydney", "melbourne", "brisbane", "auckland", "perth"];
  const africaKeywords = ["cairo", "nairobi", "johannesburg", "cape town", "casablanca", "lagos", "addis ababa"];

  if (indiaKeywords.some(k => city.includes(k))) return "india";
  if (seaKeywords.some(k => city.includes(k))) return "sea";
  if (eastAsiaKeywords.some(k => city.includes(k))) return "east_asia";
  if (southAsiaKeywords.some(k => city.includes(k))) return "south_asia";
  if (middleEastKeywords.some(k => city.includes(k))) return "middle_east";
  if (europeKeywords.some(k => city.includes(k))) return "europe";
  if (americasKeywords.some(k => city.includes(k))) return "americas";
  if (oceaniaKeywords.some(k => city.includes(k))) return "oceania";
  if (africaKeywords.some(k => city.includes(k))) return "africa";
  return "default";
}

// ─── Lookup ───────────────────────────────────────────────────────────────────

function lookupDailyCostsUSD(
  destination: string,
  budgetLevel: "low" | "medium" | "luxury"
): { food: number; transport: number; source: string } {
  const city = destination.split(",")[0].trim().toLowerCase();

  // Direct city match
  if (DAILY_COSTS_USD[city]) {
    const entry = DAILY_COSTS_USD[city];
    return {
      food: entry.food[budgetLevel],
      transport: entry.transport[budgetLevel],
      source: `city:${city}`,
    };
  }

  // Partial city match (handles "Bali, Indonesia" → "bali")
  for (const [key, entry] of Object.entries(DAILY_COSTS_USD)) {
    if (city.includes(key) || key.includes(city)) {
      return {
        food: entry.food[budgetLevel],
        transport: entry.transport[budgetLevel],
        source: `city:${key}`,
      };
    }
  }

  // Regional fallback
  const region = detectRegion(destination);
  const regional = REGIONAL_FALLBACKS[region] ?? REGIONAL_FALLBACKS.default;
  return {
    food: regional.food[budgetLevel],
    transport: regional.transport[budgetLevel],
    source: `region:${region}`,
  };
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Get total food and transport costs for the entire trip duration.
 * Returns values in the user's currency.
 */
export function getDailyTripCosts(
  destination: string,
  budgetLevel: "low" | "medium" | "luxury",
  numberOfDays: number,
  currency: string
): DailyCosts & {
  totalFood: { min: number; avg: number; max: number };
  totalTransport: { min: number; avg: number; max: number };
  source: string;
} {
  const { food: foodUSD, transport: transportUSD, source } = lookupDailyCostsUSD(
    destination,
    budgetLevel
  );

  // Build min/avg/max range: ±20% around average
  const toRange = (avgUSD: number) => ({
    min: Math.round(convertCurrencySync(avgUSD * 0.8, "USD", currency)),
    avg: Math.round(convertCurrencySync(avgUSD,       "USD", currency)),
    max: Math.round(convertCurrencySync(avgUSD * 1.25,"USD", currency)),
  });

  const foodRange = toRange(foodUSD);
  const transportRange = toRange(transportUSD);

  console.log(
    `[Daily Costs] ${destination} | ${budgetLevel} | source: ${source} | ` +
    `food: ${foodRange.avg} ${currency}/day | transport: ${transportRange.avg} ${currency}/day`
  );

  return {
    food:      { min: foodRange.min,      avg: foodRange.avg,      max: foodRange.max      },
    transport: { min: transportRange.min, avg: transportRange.avg, max: transportRange.max },
    currency,
    destination,
    budgetLevel,
    totalFood: {
      min: foodRange.min      * numberOfDays,
      avg: foodRange.avg      * numberOfDays,
      max: foodRange.max      * numberOfDays,
    },
    totalTransport: {
      min: transportRange.min * numberOfDays,
      avg: transportRange.avg * numberOfDays,
      max: transportRange.max * numberOfDays,
    },
    source,
  };
}