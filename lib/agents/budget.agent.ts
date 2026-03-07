import { model } from "@/lib/adk/config";
import {
  BudgetResultSchema,
  type BudgetResult,
  type ItineraryResult,
  type PlaceResult,
} from "@/lib/adk/schemas";
import { getDetailedFlightEstimate } from "@/lib/tools/flight.tool";
import { getCurrencyConversionDetail } from "@/lib/tools/currency.tool";
import { getDailyTripCosts } from "@/lib/tools/dailycosts.tool";

/**
 * Budget Agent — v4
 *
 * Every major cost category is now anchored from a tool — the LLM
 * only estimates visa and miscellaneous (the two genuinely unknowns).
 *
 * Anchor sources:
 *  flights        → flight.tool     (formula, currency-aware)
 *  accommodation  → PlaceResult     (real hotel pricePerNight)
 *  activities     → ItineraryResult (sum of activity costs)
 *  food           → daily-costs.tool (Numbeo-calibrated table)
 *  localTransport → daily-costs.tool (Numbeo-calibrated table)
 *  visa           → LLM (genuinely destination-specific)
 *  miscellaneous  → LLM (guided by budget level)
 */

// ─── Types ────────────────────────────────────────────────────────────────────

interface BudgetInput {
  origin: string;
  destination: string;
  numberOfPeople: number;
  numberOfDays: number;
  budgetLevel: "low" | "medium" | "luxury";
  currency: string;
  tripTheme?: string[];
  itinerary: ItineraryResult;
  places: PlaceResult;
  seasonalMultiplier: "low" | "medium" | "high";
}

interface PriceAnchors {
  flight:        { min: number; avg: number; max: number };
  accommodation: { total: number; perNight: number };
  activities:    number;
  food:          { min: number; avg: number; max: number };
  transport:     { min: number; avg: number; max: number };
  usdRate:       number;
  nightsCount:   number;
  routeType:     string;
  rateSource:    "live" | "fallback";
  costsSource:   string;
}

// ─── Enum normaliser ──────────────────────────────────────────────────────────

function normalizeBudgetStatus(
  value: string
): "within" | "slightly_above" | "over" {
  const lower = value.toLowerCase();
  if (lower.includes("over") || lower.includes("exceed")) return "over";
  if (lower.includes("slightly") || lower.includes("above") || lower.includes("higher"))
    return "slightly_above";
  return "within";
}

// ─── Price anchor builder ─────────────────────────────────────────────────────

async function buildPriceAnchors(input: BudgetInput): Promise<PriceAnchors> {
  const nightsCount = Math.max(input.numberOfDays - 1, 1);

  // Run all tool calls in parallel for speed
  const [flightData, usdConversion, dailyCosts] = await Promise.all([
    // 1. Flight prices
    Promise.resolve(getDetailedFlightEstimate({
      origin: input.origin,
      destination: input.destination,
      numberOfTravelers: input.numberOfPeople,
      departureDate: input.itinerary.startDate,
      returnDate: input.itinerary.endDate,
      currency: input.currency,
      budgetLevel: input.budgetLevel,
    })),
    // 2. Exchange rate
    getCurrencyConversionDetail(1, "USD", input.currency),
    // 3. Food + transport from daily costs table
    Promise.resolve(getDailyTripCosts(
      input.destination,
      input.budgetLevel,
      input.numberOfDays,
      input.currency,
    )),
  ]);

  // 4. Accommodation from PlaceResult (already in user's currency)
  const hotelSample =
    input.places.hotelRecommendations[input.budgetLevel]?.[0] ??
    input.places.hotelRecommendations.medium?.[0];
  const accommodationPerNight = hotelSample?.pricePerNight ?? 0;
  const accommodationTotal = accommodationPerNight * nightsCount;

  // 5. Activities from itinerary
  const activitiesTotal = input.itinerary.totalEstimatedCostPerPerson;

  const usdRate = usdConversion?.rate ?? 1;
  const rateSource = usdConversion?.source ?? "fallback";

  console.log(`[Budget Agent] All anchors ready:
  ✈  Flight/person:   ${flightData.pricePerPerson.average} ${input.currency} [${flightData.routeType}]
  🏨 Accommodation:   ${accommodationPerNight} ${input.currency}/night × ${nightsCount} = ${accommodationTotal} ${input.currency}
  🎟  Activities:      ${activitiesTotal} ${input.currency}
  🍽  Food/day:        ${dailyCosts.food.avg} ${input.currency} × ${input.numberOfDays} = ${dailyCosts.totalFood.avg} ${input.currency} [${dailyCosts.source}]
  🚌 Transport/day:   ${dailyCosts.transport.avg} ${input.currency} × ${input.numberOfDays} = ${dailyCosts.totalTransport.avg} ${input.currency}
  💱 1 USD:           ${usdRate} ${input.currency} [${rateSource}]`);

  return {
    flight:        { min: flightData.pricePerPerson.min, avg: flightData.pricePerPerson.average, max: flightData.pricePerPerson.max },
    accommodation: { total: accommodationTotal, perNight: accommodationPerNight },
    activities:    activitiesTotal,
    food:          { min: dailyCosts.totalFood.min, avg: dailyCosts.totalFood.avg, max: dailyCosts.totalFood.max },
    transport:     { min: dailyCosts.totalTransport.min, avg: dailyCosts.totalTransport.avg, max: dailyCosts.totalTransport.max },
    usdRate,
    nightsCount,
    routeType: flightData.routeType,
    rateSource,
    costsSource: dailyCosts.source,
  };
}

// ─── Prompt builder ───────────────────────────────────────────────────────────

function generateBudgetPrompt(input: BudgetInput, a: PriceAnchors): string {
  const seasonValue = input.seasonalMultiplier === "low" ? 0.7 : input.seasonalMultiplier === "high" ? 1.3 : 1.0;
  const themeSection = input.tripTheme?.length
    ? `\n- Themes: ${input.tripTheme.join(", ")} — note any theme-specific costs in assumptions`
    : "";

  // Estimate miscellaneous: ~8-12% of non-flight costs based on budget level
  const nonFlightTotal = a.accommodation.total + a.activities + a.food.avg + a.transport.avg;
  const miscPct = input.budgetLevel === "luxury" ? 0.12 : input.budgetLevel === "medium" ? 0.09 : 0.07;
  const miscGuide = Math.round(nonFlightTotal * miscPct);

  return `You are a travel budget expert. OUTPUT ONLY VALID JSON — no markdown, no code fences, no extra text.

Trip: ${input.origin} → ${input.destination} | ${input.numberOfDays} days | ${input.numberOfPeople} people | ${input.budgetLevel} budget | ${input.currency}
Season: ${input.seasonalMultiplier} (×${seasonValue}) | 1 USD = ${a.usdRate} ${input.currency}${themeSection}

ALL MAJOR COSTS ARE PRE-CALCULATED — use these exact values:
- flights:       min=${a.flight.min}  avg=${a.flight.avg}  max=${a.flight.max}  [${a.routeType}]
- accommodation: min=avg=max=${a.accommodation.total}  (${a.accommodation.perNight}/night × ${a.nightsCount} nights)
- food:          min=${a.food.min}  avg=${a.food.avg}  max=${a.food.max}  (${input.numberOfDays} days, source: ${a.costsSource})
- localTransport:min=${a.transport.min}  avg=${a.transport.avg}  max=${a.transport.max}  (${input.numberOfDays} days)
- activities:    min=avg=max=${a.activities}  (from itinerary)

YOUR ONLY JOB — estimate these 2 fields in ${input.currency}:
1. visa: research if ${input.origin} nationals need a visa for ${input.destination}. If free/on-arrival = 0. If required, estimate cost.
2. miscellaneous: tips, souvenirs, laundry, sim card, unexpected costs. Guide: ~${miscGuide} ${input.currency} for ${input.budgetLevel} traveler.

Return ONLY this JSON:
{
  "currency": "${input.currency}",
  "breakdown": {
    "flights":        {"min": ${a.flight.min},          "max": ${a.flight.max},          "average": ${a.flight.avg}},
    "accommodation":  {"min": ${a.accommodation.total}, "max": ${a.accommodation.total}, "average": ${a.accommodation.total}},
    "food":           {"min": ${a.food.min},            "max": ${a.food.max},            "average": ${a.food.avg}},
    "localTransport": {"min": ${a.transport.min},       "max": ${a.transport.max},       "average": ${a.transport.avg}},
    "activities":     {"min": ${a.activities},          "max": ${a.activities},          "average": ${a.activities}},
    "visa":           {"min": 0, "max": 0, "average": 0},
    "miscellaneous":  {"min": 0, "max": 0, "average": 0}
  },
  "totalEstimatedCostPerPerson": {"min": 0, "max": 0, "average": 0},
  "totalEstimatedCostForGroup":  {"min": 0, "max": 0, "average": 0},
  "seasonalAdjustment": {
    "season": "${input.seasonalMultiplier}",
    "multiplierApplied": ${seasonValue},
    "reason": "Explain seasonal pricing impact on ${input.destination}"
  },
  "dailyAverageCostPerPerson": 0,
  "budgetStatus": "within",
  "assumptions": []
}

RULES:
1. budgetStatus: within | slightly_above | over
2. Do NOT change flights/accommodation/food/localTransport/activities — they are confirmed
3. Only fill visa and miscellaneous
4. Write 5–8 specific assumptions covering: route, hotel tier, food source (${a.costsSource}), visa policy, group size`;
}

// ─── Math corrector ───────────────────────────────────────────────────────────

function correctBudgetMath(parsed: any, input: BudgetInput, a: PriceAnchors): any {
  const bd = parsed.breakdown ?? {};

  // Force ALL confirmed anchor values — cannot be overridden by LLM
  bd.flights        = { min: a.flight.min,          average: a.flight.avg,          max: a.flight.max };
  bd.accommodation  = { min: a.accommodation.total, average: a.accommodation.total, max: a.accommodation.total };
  bd.food           = { min: a.food.min,            average: a.food.avg,            max: a.food.max };
  bd.localTransport = { min: a.transport.min,       average: a.transport.avg,       max: a.transport.max };
  bd.activities     = { min: a.activities,          average: a.activities,          max: a.activities };

  // Sanitize LLM-filled fields
  const sanitize = (cat: any) => ({
    min:     Math.max(0, Number(cat?.min)     || 0),
    average: Math.max(0, Number(cat?.average) || 0),
    max:     Math.max(0, Number(cat?.max)     || 0),
  });
  bd.visa          = sanitize(bd.visa);
  bd.miscellaneous = sanitize(bd.miscellaneous);

  // Ensure min ≤ avg ≤ max for LLM fields
  for (const key of ["visa", "miscellaneous"]) {
    const cat = bd[key];
    cat.min     = Math.min(cat.min, cat.average);
    cat.max     = Math.max(cat.max, cat.average);
  }

  // Recalculate totals from breakdown
  const cats = Object.values(bd) as any[];
  parsed.totalEstimatedCostPerPerson = {
    min:     Math.round(cats.reduce((s, c) => s + (c?.min     ?? 0), 0)),
    average: Math.round(cats.reduce((s, c) => s + (c?.average ?? 0), 0)),
    max:     Math.round(cats.reduce((s, c) => s + (c?.max     ?? 0), 0)),
  };

  parsed.totalEstimatedCostForGroup = {
    min:     Math.round(parsed.totalEstimatedCostPerPerson.min     * input.numberOfPeople),
    average: Math.round(parsed.totalEstimatedCostPerPerson.average * input.numberOfPeople),
    max:     Math.round(parsed.totalEstimatedCostPerPerson.max     * input.numberOfPeople),
  };

  parsed.dailyAverageCostPerPerson = input.numberOfDays > 0
    ? Math.round(parsed.totalEstimatedCostPerPerson.average / input.numberOfDays)
    : parsed.totalEstimatedCostPerPerson.average;

  return parsed;
}

// ─── Agent ────────────────────────────────────────────────────────────────────

export const budgetAgent = {
  async run(input: BudgetInput): Promise<BudgetResult> {
    // Step 1: Build all price anchors from tools (parallel)
    const anchors = await buildPriceAnchors(input);

    // Step 2: Prompt LLM only for visa + misc
    const prompt = generateBudgetPrompt(input, anchors);
    const response = await model.generateContent(prompt);
    const text = response.response.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // Step 3: Extract JSON
    let jsonStr = text.trim();
    const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (fenceMatch) jsonStr = fenceMatch[1].trim();
    const braceStart = jsonStr.indexOf("{");
    const braceEnd = jsonStr.lastIndexOf("}");
    if (braceStart !== -1 && braceEnd !== -1) {
      jsonStr = jsonStr.slice(braceStart, braceEnd + 1);
    }

    const parsed = JSON.parse(jsonStr);

    // Step 4: Normalise enums
    if (parsed.budgetStatus) {
      parsed.budgetStatus = normalizeBudgetStatus(parsed.budgetStatus);
    }

    // Step 5: Force anchors + recalculate all totals
    const corrected = correctBudgetMath(parsed, input, anchors);

    // Step 6: Validate
    return BudgetResultSchema.parse(corrected);
  },
};