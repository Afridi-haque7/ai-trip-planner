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
  liveFlightData?: any;
  liveHotelData?: any;
}

interface PriceAnchors {
  flight: { min: number; avg: number; max: number };
  accommodation: { total: number; perNight: number };
  activities: number;
  food: { min: number; avg: number; max: number };
  transport: { min: number; avg: number; max: number };
  visa: { min: number; avg: number; max: number } | null; // null = unknown, let LLM decide
  usdRate: number;
  nightsCount: number;
  routeType: string;
  rateSource: "live" | "fallback";
  costsSource: string;
}

// ─── Visa knowledge base ────────────────────────────────────────────────────

/**
 * Hard-coded visa requirements for common origin→destination region pairs.
 * The LLM is unreliable for visa facts so we pre-compute a hint.
 *
 * Structure: origin country keyword → destination region → { required, approxUSD }
 * approxUSD = 0 means free/on-arrival.
 */
const VISA_HINTS: Array<{
  originKeywords: string[];
  destinationKeywords: string[];
  required: boolean;
  approxUSD: number;
  note: string;
}> = [
  // Indian passport — Schengen (Italy, France, Germany, Spain, etc.)
  {
    originKeywords: ["india", "indian"],
    destinationKeywords: ["italy", "naples", "rome", "milan", "venice", "florence",
      "france", "paris", "germany", "berlin", "munich", "frankfurt",
      "spain", "barcelona", "madrid", "greece", "athens", "amsterdam",
      "netherlands", "portugal", "lisbon", "schengen", "austria", "vienna",
      "czech", "prague", "switzerland", "zurich", "belgium", "brussels",
      "sweden", "stockholm", "norway", "oslo", "denmark", "copenhagen",
      "finland", "helsinki", "poland", "warsaw"],
    required: true,
    approxUSD: 90, // Schengen visa ~€80 ≈ $90
    note: "Schengen visa required for Indian passport holders (~€80 / ~$90 USD)",
  },
  // Indian passport — UK
  {
    originKeywords: ["india", "indian"],
    destinationKeywords: ["uk", "united kingdom", "london", "england", "britain"],
    required: true,
    approxUSD: 130, // UK Standard Visitor Visa ~£115 ≈ $130
    note: "UK Standard Visitor Visa required for Indian passport holders (~£115 / ~$130 USD)",
  },
  // Indian passport — USA
  {
    originKeywords: ["india", "indian"],
    destinationKeywords: ["usa", "united states", "america", "new york", "los angeles", "chicago", "miami", "san francisco"],
    required: true,
    approxUSD: 185, // US B1/B2 visa ~$185
    note: "US B1/B2 tourist visa required for Indian passport holders (~$185 USD)",
  },
  // Indian passport — Australia
  {
    originKeywords: ["india", "indian"],
    destinationKeywords: ["australia", "sydney", "melbourne", "brisbane", "perth"],
    required: true,
    approxUSD: 145, // Australian Tourist Visa ~AUD 145 ≈ $95 USD
    note: "Australian Tourist Visa (subclass 600) required for Indian passport holders (~AUD 145 / ~$95 USD)",
  },
  // Indian passport — Canada
  {
    originKeywords: ["india", "indian"],
    destinationKeywords: ["canada", "toronto", "vancouver"],
    required: true,
    approxUSD: 100, // Canada Tourist Visa ~CAD 100 ≈ $75 USD
    note: "Canadian Temporary Resident Visa required for Indian passport holders (~CAD 100 / ~$75 USD)",
  },
  // Indian passport — Japan
  {
    originKeywords: ["india", "indian"],
    destinationKeywords: ["japan", "tokyo", "osaka", "kyoto", "fukuoka"],
    required: true,
    approxUSD: 0, // Japan visa is free to apply but requires embassy visit
    note: "Japan tourist visa required for Indian passport holders (application fee is free but proof of funds required)",
  },
  // Indian passport — SEA (mostly visa-free or on-arrival)
  {
    originKeywords: ["india", "indian"],
    destinationKeywords: ["thailand", "bangkok", "phuket", "chiang mai"],
    required: false,
    approxUSD: 0,
    note: "Thailand: visa-free for Indian passport holders up to 30 days",
  },
  {
    originKeywords: ["india", "indian"],
    destinationKeywords: ["bali", "indonesia", "jakarta"],
    required: false,
    approxUSD: 0,
    note: "Indonesia: visa-free on arrival for Indian passport holders up to 30 days",
  },
  {
    originKeywords: ["india", "indian"],
    destinationKeywords: ["singapore"],
    required: false,
    approxUSD: 0,
    note: "Singapore: visa-free for Indian passport holders up to 30 days",
  },
  {
    originKeywords: ["india", "indian"],
    destinationKeywords: ["malaysia", "kuala lumpur"],
    required: false,
    approxUSD: 0,
    note: "Malaysia: visa-free for Indian passport holders up to 30 days",
  },
  {
    originKeywords: ["india", "indian"],
    destinationKeywords: ["dubai", "uae", "abu dhabi"],
    required: false,
    approxUSD: 0,
    note: "UAE: visa on arrival available for Indian passport holders (~$100 but often arranged by airlines)",
  },
];

interface VisaHint {
  required: boolean;
  approxUSD: number;
  note: string;
}

function getVisaHint(
  origin: string,
  destination: string,
): VisaHint | null {
  const orig = origin.toLowerCase();
  const dest = destination.toLowerCase();

  for (const hint of VISA_HINTS) {
    const matchOrigin = hint.originKeywords.some((k) => orig.includes(k));
    const matchDest   = hint.destinationKeywords.some((k) => dest.includes(k));
    if (matchOrigin && matchDest) {
      return {
        required:   hint.required,
        approxUSD:  hint.approxUSD,
        note:       hint.note,
      };
    }
  }
  return null; // unknown — let LLM decide
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
  const [flightDataFallback, dailyCosts] = await Promise.all([
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
  let flight;
  let flightSrc;
  let flightRouteType = flightDataFallback.routeType;

  if (input.liveFlightData && input.liveFlightData.pricePerPerson) {
      flightSrc = input.liveFlightData.currency;
      flight = {
        min: convert(input.liveFlightData.pricePerPerson.min, flightSrc, tgt, usdRate),
        avg: convert(input.liveFlightData.pricePerPerson.average, flightSrc, tgt, usdRate),
        max: convert(input.liveFlightData.pricePerPerson.max, flightSrc, tgt, usdRate),
      };
      console.log(`[Budget Agent] ✅ Using LIVE flight data!`);
  } else {
      flightSrc = flightDataFallback.currency ?? tgt;
      flight = {
        min: convert(flightDataFallback.pricePerPerson.min, flightSrc, tgt, usdRate),
        avg: convert(flightDataFallback.pricePerPerson.average, flightSrc, tgt, usdRate),
        max: convert(flightDataFallback.pricePerPerson.max, flightSrc, tgt, usdRate),
      };
      console.log(`[Budget Agent] ⚠ Using FALLBACK flight data.`);
  }

  // ── Accommodation ─────────────────────────────────────────────────────────
  let accommodationPerNight = 0;
  let hotelTierStr = "none";
  
  if (input.liveHotelData) {
      accommodationPerNight = convert(input.liveHotelData.average, input.liveHotelData.currency, tgt, usdRate);
      hotelTierStr = "live_rapidapi";
      console.log(`[Budget Agent] ✅ Using LIVE hotel data!`);
  } else {
      const tierPriority = [input.budgetLevel, "medium", "low", "luxury"] as const;
      const hotelTier =
        tierPriority
          .map((t) => input.places.hotelRecommendations[t])
          .find((arr) => Array.isArray(arr) && arr.length > 0) ?? [];

      const hotelPricesInTarget = hotelTier
        .map((h) => convert(h.pricePerNight, h.currency ?? "USD", tgt, usdRate))
        .filter((p) => p > 0);

      accommodationPerNight =
        hotelPricesInTarget.length > 0
          ? Math.round(
              hotelPricesInTarget.reduce((s, p) => s + p, 0) /
                hotelPricesInTarget.length,
            )
          : 0;
          
      hotelTierStr = hotelTier.map((h) => h.currency ?? "USD").join(", ") || "none";
      console.log(`[Budget Agent] ⚠ Using FALLBACK hotel data.`);
  }
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

  // ── Visa (known-policy hint) ────────────────────────────────────────────
  const visaHint = getVisaHint(input.origin, input.destination);
  const visa = visaHint
    ? visaHint.required
      ? {
          min: convert(visaHint.approxUSD, "USD", tgt, usdRate),
          avg: convert(visaHint.approxUSD, "USD", tgt, usdRate),
          max: convert(visaHint.approxUSD, "USD", tgt, usdRate),
        }
      : { min: 0, avg: 0, max: 0 }
    : null;

  // ── Audit log ─────────────────────────────────────────────────────────────
  console.log(
    `[Budget Agent] Anchors → ${tgt}  (1 USD = ${usdRate} ${tgt}, source: ${rateSource})\n` +
      `  ✈  Flight/person  : ${flight.min}–${flight.max}  avg=${flight.avg}  [tool: ${flightSrc}]\n` +
      `  🏨 Hotel/night    : ${accommodationPerNight}  × ${nightsCount} nights = ${accommodationTotal}` +
      `  [hotel currencies: ${hotelTierStr}]\n` +
      `  🎟  Activities     : ${activitiesTotal}  [itinerary: ${activitySrc}]\n` +
      `  🛂 Visa hint      : ${visa ? `${visa.avg} ${tgt}` : "unknown (LLM decides)"}${visaHint ? `  [${visaHint.note}]` : ""}\n` +
      `  🍽  Food (total)   : ${food.min}–${food.max}  avg=${food.avg}  [daily-costs: ${dailySrc}]\n` +
      `  🚌 Transport (tot): ${transport.min}–${transport.max}  avg=${transport.avg}`,
  );

  return {
    visa,
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
    routeType: flightRouteType,
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
  const visaTask = a.visa
    ? `1. visa         : PRE-CALCULATED and LOCKED. Use exactly min=${a.visa.min}, average=${a.visa.avg}, max=${a.visa.max}.`
    : `1. visa         : Does ${input.origin} require a visa for ${input.destination}?
                  Visa-free / on-arrival → 0. Otherwise estimate fee in ${input.currency}.`;
  const visaSeed = a.visa
    ? `{"min": ${a.visa.min}, "average": ${a.visa.avg}, "max": ${a.visa.max}}`
    : `{"min": 0, "average": 0, "max": 0}`;
  const visaRule = a.visa
    ? `3. Do NOT change visa (locked) or any anchored category. Only fill miscellaneous.min/average/max`
    : `3. Only fill visa.min/average/max and miscellaneous.min/average/max`;

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
${visaTask}
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
    "visa":           ${visaSeed},
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
  "assumptions": [
    "Assumption 1 as a plain string",
    "Assumption 2 as a plain string"
  ]
}

STRICT RULES:
1. budgetStatus must be: within | slightly_above | over
2. Do NOT change flights / accommodation / food / localTransport / activities — copy the anchor values exactly
${visaRule}
4. Leave totalEstimatedCostPerPerson, totalEstimatedCostForGroup, dailyAverageCostPerPerson as 0 — recalculated server-side
5. Write 5–8 specific assumptions AS PLAIN STRINGS IN AN ARRAY (NOT objects): route type, hotel tier, food source (${a.costsSource}), visa policy, group size, currency (${input.currency})`;
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
  bd.visa = a.visa
    ? { min: a.visa.min, average: a.visa.avg, max: a.visa.max }
    : sanitize(bd.visa);
  bd.miscellaneous = sanitize(bd.miscellaneous);

  // Enforce min ≤ average ≤ max for LLM-filled fields
  for (const key of ["miscellaneous"] as const) {
    const cat = bd[key];
    cat.min = Math.min(cat.min, cat.average);
    cat.max = Math.max(cat.max, cat.average);
  }

  if (!a.visa) {
    const cat = bd.visa;
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
