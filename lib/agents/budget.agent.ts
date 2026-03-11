import { model } from "@/lib/adk/config";
import {
  BudgetResultSchema,
  type BudgetResult,
  type ItineraryResult,
  type PlaceResult,
} from "@/lib/adk/schemas";
import { getDetailedFlightEstimate } from "@/lib/tools/flight.tool";
import { getCurrencyConversionDetail, convertCurrencySync } from "@/lib/tools/currency.tool";
import { getDailyTripCosts } from "@/lib/tools/dailycosts.tool";

/**
 * Budget Agent — v7
 *
 * Currency-safe: a single `convert()` helper is the ONLY place where
 * cross-currency conversion happens. Every anchor value is explicitly
 * converted to the user's target currency before being used in the prompt
 * or the math corrector.
 *
 * Fixes over v6 (from security audit findings):
 *  Finding 1 (High): Schemas no longer have .default("USD") on currency fields.
 *    place.agent.ts and itinerary.agent.ts now stamp currency explicitly after
 *    parsing, so convert() never silently defaults to USD and double-converts.
 *  Finding 2 (Medium): Live USD rate is now fetched FIRST (sequential), then
 *    injected into the flight tool via liveUsdRate param. All anchors now share
 *    the exact same exchange rate — flight/non-flight drift is eliminated.
 *  Finding 3 (Medium): convert() now handles third-currency inputs via
 *    convertCurrencySync (static fallback table, 40+ currencies) instead of
 *    silently passing through the unconverted value.
 *
 * Anchor sources:
 *  flights        → flight.tool     (formula, exposes .currency)
 *  accommodation  → PlaceResult     (real hotel pricePerNight, exposes .currency per hotel)
 *  activities     → ItineraryResult (sum of activity costs, exposes .currency)
 *  food           → daily-costs.tool (Numbeo-calibrated, exposes .currency)
 *  localTransport → daily-costs.tool (Numbeo-calibrated, exposes .currency)
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
  currency: string; // ISO 4217 — the ONE true output currency
  tripTheme?: string[];
  itinerary: ItineraryResult;
  places: PlaceResult;
  seasonalMultiplier: "low" | "medium" | "high";
}

interface PriceAnchors {
  flight: { min: number; avg: number; max: number };
  accommodation: { total: number; perNight: number };
  activities: number;
  food: { min: number; avg: number; max: number };
  transport: { min: number; avg: number; max: number };
  usdRate: number;
  nightsCount: number;
  routeType: string;
  rateSource: "live" | "fallback";
  costsSource: string;
}

// ─── Single currency converter ────────────────────────────────────────────────

/**
 * Converts `value` from `sourceCurrency` into `targetCurrency`.
 *
 * Conversion matrix:
 *   src === tgt : no-op (return as-is)
 *   src === USD : value × usdRate  (fast path, no extra lookup)
 *   src === other : cross-rate via convertCurrencySync fallback table
 *                   (fixes Finding 3 — third currencies are actually converted,
 *                    not silently passed through as wrong-magnitude numbers)
 *
 * Treat undefined/empty source as USD — all legacy tools returned USD implicitly.
 */
function convert(
  value: number,
  sourceCurrency: string | undefined,
  targetCurrency: string,
  usdRate: number,
): number {
  const src = (sourceCurrency?.trim() || "USD").toUpperCase();
  const tgt = targetCurrency.toUpperCase();

  if (src === tgt) return Math.round(value);

  if (src === "USD") return Math.round(value * usdRate);

  // Third-currency path: src is neither USD nor tgt (e.g. EUR when tgt is INR).
  // convertCurrencySync uses the static fallback table which covers 40+ currencies.
  // This is correct enough for budget estimation and far better than pass-through.
  const converted = convertCurrencySync(value, src, tgt);
  console.warn(
    `[Budget Agent] ⚠ Third-currency detected: ${src} → ${tgt}. ` +
    `Converted ${value} ${src} → ${converted} ${tgt} via static fallback table. ` +
    `For accuracy, fix the upstream tool to return ${tgt} directly.`,
  );
  return Math.round(converted);
}

// ─── Enum normaliser ──────────────────────────────────────────────────────────

function normalizeBudgetStatus(
  value: string,
): "within" | "slightly_above" | "over" {
  const lower = value.toLowerCase();
  if (lower.includes("over") || lower.includes("exceed")) return "over";
  if (
    lower.includes("slightly") ||
    lower.includes("above") ||
    lower.includes("higher")
  )
    return "slightly_above";
  return "within";
}

// ─── Price anchor builder ─────────────────────────────────────────────────────

async function buildPriceAnchors(input: BudgetInput): Promise<PriceAnchors> {
  const nightsCount = Math.max(input.numberOfDays - 1, 1);
  const tgt = input.currency;

  // ── Step 1: Fetch live USD rate first so it can be injected into the
  //            flight tool — fixes Finding 2 (flight-rate drift).
  //            All tools and convert() must share the exact same rate.
  const usdConversion = await getCurrencyConversionDetail(1, "USD", tgt);
  const usdRate    = usdConversion?.rate ?? 1;
  const rateSource = (usdConversion?.source ?? "fallback") as "live" | "fallback";

  if (rateSource === "fallback") {
    console.warn(
      `[Budget Agent] ⚠ USD→${tgt} rate unavailable — using 1:1 fallback. ` +
      `All USD-denominated tool values will be WRONG. Check currency.tool.`,
    );
  }

  // ── Step 2: Remaining tools in parallel; flight tool receives the live
  //            rate so it uses the same conversion as food/transport/hotels.
  const [flightData, dailyCosts] = await Promise.all([
    Promise.resolve(
      getDetailedFlightEstimate({
        origin:            input.origin,
        destination:       input.destination,
        numberOfTravelers: input.numberOfPeople,
        departureDate:     input.itinerary.startDate,
        returnDate:        input.itinerary.endDate,
        currency:          tgt,
        budgetLevel:       input.budgetLevel,
        liveUsdRate:       usdRate, // ← eliminates flight/non-flight rate drift
      }),
    ),
    Promise.resolve(
      getDailyTripCosts(
        input.destination,
        input.budgetLevel,
        input.numberOfDays,
        tgt,
      ),
    ),
  ]);

  // ── Flights ───────────────────────────────────────────────────────────────
  // Flight tool receives tgt currency so should return tgt values, but guard
  // against implementations that always return USD regardless of the param.
  const flightSrc = flightData.currency ?? tgt;
  const flight = {
    min: convert(flightData.pricePerPerson.min, flightSrc, tgt, usdRate),
    avg: convert(flightData.pricePerPerson.average, flightSrc, tgt, usdRate),
    max: convert(flightData.pricePerPerson.max, flightSrc, tgt, usdRate),
  };

  // ── Accommodation ─────────────────────────────────────────────────────────
  // Walk tier priority until we find a non-empty array.
  // Using .find() instead of ?? so that an existing-but-empty array falls through.
  const tierPriority = [input.budgetLevel, "medium", "low", "luxury"] as const;
  const hotelTier =
    tierPriority
      .map((t) => input.places.hotelRecommendations[t])
      .find((arr) => Array.isArray(arr) && arr.length > 0) ?? [];

  const hotelPricesInTarget = hotelTier
    .map((h) => convert(h.pricePerNight, h.currency ?? "USD", tgt, usdRate))
    .filter((p) => p > 0);

  const accommodationPerNight =
    hotelPricesInTarget.length > 0
      ? Math.round(
          hotelPricesInTarget.reduce((s, p) => s + p, 0) /
            hotelPricesInTarget.length,
        )
      : 0;
  const accommodationTotal = accommodationPerNight * nightsCount;

  // ── Food & transport ──────────────────────────────────────────────────────
  const dailySrc = dailyCosts.currency ?? "USD";
  const food = {
    min: convert(dailyCosts.totalFood.min, dailySrc, tgt, usdRate),
    avg: convert(dailyCosts.totalFood.avg, dailySrc, tgt, usdRate),
    max: convert(dailyCosts.totalFood.max, dailySrc, tgt, usdRate),
  };
  const transport = {
    min: convert(dailyCosts.totalTransport.min, dailySrc, tgt, usdRate),
    avg: convert(dailyCosts.totalTransport.avg, dailySrc, tgt, usdRate),
    max: convert(dailyCosts.totalTransport.max, dailySrc, tgt, usdRate),
  };

  // ── Activities ────────────────────────────────────────────────────────────
  const activitySrc = input.itinerary.currency ?? "USD";
  const activitiesTotal = convert(
    input.itinerary.totalEstimatedCostPerPerson,
    activitySrc,
    tgt,
    usdRate,
  );

  // ── Audit log ─────────────────────────────────────────────────────────────
  console.log(
    `[Budget Agent] Anchors → ${tgt}  (1 USD = ${usdRate} ${tgt}, source: ${rateSource})\n` +
      `  ✈  Flight/person  : ${flight.min}–${flight.max}  avg=${flight.avg}  [tool: ${flightSrc}]\n` +
      `  🏨 Hotel/night    : ${accommodationPerNight}  × ${nightsCount} nights = ${accommodationTotal}` +
      `  [hotel currencies: ${hotelTier.map((h) => h.currency ?? "USD").join(", ") || "none"}]\n` +
      `  🎟  Activities     : ${activitiesTotal}  [itinerary: ${activitySrc}]\n` +
      `  🍽  Food (total)   : ${food.min}–${food.max}  avg=${food.avg}  [daily-costs: ${dailySrc}]\n` +
      `  🚌 Transport (tot): ${transport.min}–${transport.max}  avg=${transport.avg}`,
  );

  return {
    flight,
    accommodation: {
      total: accommodationTotal,
      perNight: accommodationPerNight,
    },
    activities: activitiesTotal,
    food,
    transport,
    usdRate,
    nightsCount,
    routeType: flightData.routeType,
    rateSource,
    costsSource: dailyCosts.source,
  };
}

// ─── Prompt builder ───────────────────────────────────────────────────────────

function generateBudgetPrompt(input: BudgetInput, a: PriceAnchors): string {
  const seasonValue =
    input.seasonalMultiplier === "low"
      ? 0.7
      : input.seasonalMultiplier === "high"
        ? 1.3
        : 1.0;

  const themeSection = input.tripTheme?.length
    ? `\n- Trip themes: ${input.tripTheme.join(", ")} — note theme-specific costs in assumptions`
    : "";

  // Guide the LLM's miscellaneous estimate using a % of known non-flight spend
  const nonFlightTotal =
    a.accommodation.total + a.activities + a.food.avg + a.transport.avg;
  const miscPct =
    input.budgetLevel === "luxury"
      ? 0.12
      : input.budgetLevel === "medium"
        ? 0.09
        : 0.07;
  const miscGuide = Math.round(nonFlightTotal * miscPct);

  return `You are a travel budget expert. OUTPUT ONLY VALID JSON — no markdown, no code fences, no extra text.

=== TRIP SUMMARY ===
Route    : ${input.origin} → ${input.destination}
Duration : ${input.numberOfDays} days (${a.nightsCount} nights)
Travelers: ${input.numberOfPeople}
Budget   : ${input.budgetLevel}
Currency : ${input.currency} ← ALL monetary values must be in this currency
Season   : ${input.seasonalMultiplier} (×${seasonValue}) | 1 USD = ${a.usdRate} ${input.currency}${themeSection}

=== PRE-CALCULATED ANCHORS (already in ${input.currency} — copy exactly, do NOT change) ===
flights        : min=${a.flight.min}  avg=${a.flight.avg}  max=${a.flight.max}  [${a.routeType}]
accommodation  : ${a.accommodation.total}  (${a.accommodation.perNight} ${input.currency}/night × ${a.nightsCount} nights)
food           : min=${a.food.min}  avg=${a.food.avg}  max=${a.food.max}  [${input.numberOfDays} days, ${a.costsSource}]
localTransport : min=${a.transport.min}  avg=${a.transport.avg}  max=${a.transport.max}  [${input.numberOfDays} days]
activities     : ${a.activities}  [from itinerary]

=== YOUR TASK — fill ONLY these 2 fields (in ${input.currency}) ===
1. visa         : Does ${input.origin} require a visa for ${input.destination}?
                  Visa-free / on-arrival → 0. Otherwise estimate fee in ${input.currency}.
2. miscellaneous: Tips, souvenirs, laundry, SIM card, contingency.
                  Guide for a ${input.budgetLevel} traveler: ~${miscGuide} ${input.currency}.

Return ONLY this JSON (every number must be in ${input.currency}):
{
  "currency": "${input.currency}",
  "breakdown": {
    "flights":        {"min": ${a.flight.min},          "average": ${a.flight.avg},          "max": ${a.flight.max}},
    "accommodation":  {"min": ${a.accommodation.total}, "average": ${a.accommodation.total}, "max": ${a.accommodation.total}},
    "food":           {"min": ${a.food.min},            "average": ${a.food.avg},            "max": ${a.food.max}},
    "localTransport": {"min": ${a.transport.min},       "average": ${a.transport.avg},       "max": ${a.transport.max}},
    "activities":     {"min": ${a.activities},          "average": ${a.activities},          "max": ${a.activities}},
    "visa":           {"min": 0, "average": 0, "max": 0},
    "miscellaneous":  {"min": 0, "average": 0, "max": 0}
  },
  "totalEstimatedCostPerPerson": {"min": 0, "average": 0, "max": 0},
  "totalEstimatedCostForGroup":  {"min": 0, "average": 0, "max": 0},
  "seasonalAdjustment": {
    "season": "${input.seasonalMultiplier}",
    "multiplierApplied": ${seasonValue},
    "reason": "<explain seasonal pricing impact on ${input.destination}>"
  },
  "dailyAverageCostPerPerson": 0,
  "budgetStatus": "within",
  "assumptions": []
}

STRICT RULES:
1. budgetStatus must be: within | slightly_above | over
2. Do NOT change flights / accommodation / food / localTransport / activities — copy the anchor values exactly
3. Only fill visa.min/average/max and miscellaneous.min/average/max
4. Leave totalEstimatedCostPerPerson, totalEstimatedCostForGroup, dailyAverageCostPerPerson as 0 — recalculated server-side
5. Write 5–8 specific assumptions: route type, hotel tier, food source (${a.costsSource}), visa policy, group size, currency (${input.currency})`;
}

// ─── Math corrector ───────────────────────────────────────────────────────────

/**
 * Post-processes the LLM JSON:
 * 1. Warns if LLM returned a different currency than requested
 * 2. Forces all anchor values back to tool-computed numbers (LLM cannot override)
 * 3. Sanitizes + clamps LLM-filled fields (visa, miscellaneous)
 * 4. Recomputes all totals from the breakdown deterministically
 * 5. Stamps currency = input.currency unconditionally
 */
function correctBudgetMath(
  parsed: any,
  input: BudgetInput,
  a: PriceAnchors,
): any {
  // ── Currency drift detection ──────────────────────────────────────────────
  if (
    parsed.currency &&
    parsed.currency.toUpperCase() !== input.currency.toUpperCase()
  ) {
    console.warn(
      `[Budget Agent] ⚠ LLM returned currency="${parsed.currency}" but expected "${input.currency}". ` +
        `Overriding. All anchor values are already in ${input.currency}.`,
    );
  }
  parsed.currency = input.currency; // stamp correct currency unconditionally

  const bd = parsed.breakdown ?? {};

  // ── Force confirmed anchor values ─────────────────────────────────────────
  bd.flights = {
    min: a.flight.min,
    average: a.flight.avg,
    max: a.flight.max,
  };
  bd.accommodation = {
    min: a.accommodation.total,
    average: a.accommodation.total,
    max: a.accommodation.total,
  };
  bd.food = {
    min: a.food.min,
    average: a.food.avg,
    max: a.food.max,
  };
  bd.localTransport = {
    min: a.transport.min,
    average: a.transport.avg,
    max: a.transport.max,
  };
  bd.activities = {
    min: a.activities,
    average: a.activities,
    max: a.activities,
  };

  // ── Sanitize LLM-filled fields ────────────────────────────────────────────
  const sanitize = (cat: any) => ({
    min: Math.max(0, Number(cat?.min) || 0),
    average: Math.max(0, Number(cat?.average) || 0),
    max: Math.max(0, Number(cat?.max) || 0),
  });
  bd.visa = sanitize(bd.visa);
  bd.miscellaneous = sanitize(bd.miscellaneous);

  // Enforce min ≤ average ≤ max for LLM-filled fields
  for (const key of ["visa", "miscellaneous"] as const) {
    const cat = bd[key];
    cat.min = Math.min(cat.min, cat.average);
    cat.max = Math.max(cat.max, cat.average);
  }

  parsed.breakdown = bd;

  // ── Recompute totals deterministically ────────────────────────────────────
  const cats = Object.values(bd) as any[];
  parsed.totalEstimatedCostPerPerson = {
    min: Math.round(cats.reduce((s, c) => s + (c?.min ?? 0), 0)),
    average: Math.round(cats.reduce((s, c) => s + (c?.average ?? 0), 0)),
    max: Math.round(cats.reduce((s, c) => s + (c?.max ?? 0), 0)),
  };
  parsed.totalEstimatedCostForGroup = {
    min: Math.round(
      parsed.totalEstimatedCostPerPerson.min * input.numberOfPeople,
    ),
    average: Math.round(
      parsed.totalEstimatedCostPerPerson.average * input.numberOfPeople,
    ),
    max: Math.round(
      parsed.totalEstimatedCostPerPerson.max * input.numberOfPeople,
    ),
  };
  parsed.dailyAverageCostPerPerson =
    input.numberOfDays > 0
      ? Math.round(
          parsed.totalEstimatedCostPerPerson.average / input.numberOfDays,
        )
      : parsed.totalEstimatedCostPerPerson.average;

  return parsed;
}

// ─── Agent ────────────────────────────────────────────────────────────────────

export const budgetAgent = {
  async run(input: BudgetInput): Promise<BudgetResult> {
    // Step 1 — Build all price anchors from tools in parallel,
    //           converting everything into input.currency via convert()
    const anchors = await buildPriceAnchors(input);

    // Step 2 — Prompt LLM only for visa + miscellaneous
    const prompt = generateBudgetPrompt(input, anchors);
    const response = await model.generateContent(prompt);
    const text =
      response.response.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // Step 3 — Extract JSON (strip markdown fences if LLM disobeys)
    let jsonStr = text.trim();
    const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (fenceMatch) jsonStr = fenceMatch[1].trim();
    const braceStart = jsonStr.indexOf("{");
    const braceEnd = jsonStr.lastIndexOf("}");
    if (braceStart !== -1 && braceEnd !== -1) {
      jsonStr = jsonStr.slice(braceStart, braceEnd + 1);
    }

    const parsed = JSON.parse(jsonStr);

    // Step 4 — Normalise enum values
    if (parsed.budgetStatus) {
      parsed.budgetStatus = normalizeBudgetStatus(parsed.budgetStatus);
    }

    // Step 5 — Force anchors back + recompute all totals deterministically
    const corrected = correctBudgetMath(parsed, input, anchors);

    // Step 6 — Validate against schema
    return BudgetResultSchema.parse(corrected);
  },
};
