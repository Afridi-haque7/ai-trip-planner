import { model } from "@/lib/adk/config";
import { PlaceResultSchema, type PlaceResult } from "@/lib/adk/schemas";
import { getMultipleImageUrls } from "@/lib/tools/image.tool";
import { convertCurrencySync } from "@/lib/tools/currency.tool";

/**
 * Place Agent — v3
 *
 * Fixes over v2:
 *  1. Food averagePrice anchored from destination cost-of-living data
 *     (same source as daily-costs.tool) — no more hardcoded INR values
 *  2. Attraction entry fees anchored per destination region in user's currency
 *  3. Hotel price anchors expanded to 20+ currencies with destination-specific ranges
 *  4. Example values in JSON template are dynamic, not hardcoded
 */

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlaceInput {
  origin: string;
  destination: string;
  numberOfPeople: number;
  currency: string;
  tripTheme?: string[];
}

// ─── Enum normalisers ─────────────────────────────────────────────────────────

function normalizeCategory(
  value: string
): "nature" | "historical" | "adventure" | "cultural" | "shopping" | "other" {
  const lower = value.toLowerCase();
  const valid = ["nature", "historical", "adventure", "cultural", "shopping", "other"];
  return (valid.find((c) => lower.includes(c)) ?? "other") as any;
}

function normalizeSuitableFor(
  value: string
): "budget" | "family" | "luxury" | "nightlife" | "couples" {
  const lower = value.toLowerCase();
  const valid = ["budget", "family", "luxury", "nightlife", "couples"];
  return (valid.find((o) => lower.includes(o)) ?? "family") as any;
}

// ─── Destination price anchor builder ────────────────────────────────────────

/**
 * Per-meal costs in USD (single meal, not full day).
 * Derived from daily-costs.tool food values ÷ 3 meals.
 */
const MEAL_COSTS_USD: Record<string, { low: number; medium: number; luxury: number }> = {
  // India
  "new delhi":   { low: 1.5, medium: 5,   luxury: 20  },
  "delhi":       { low: 1.5, medium: 5,   luxury: 20  },
  "mumbai":      { low: 2,   medium: 6,   luxury: 25  },
  "bangalore":   { low: 1.5, medium: 5,   luxury: 22  },
  "bengaluru":   { low: 1.5, medium: 5,   luxury: 22  },
  "kolkata":     { low: 1.5, medium: 4,   luxury: 17  },
  "goa":         { low: 2,   medium: 6,   luxury: 22  },
  "jaipur":      { low: 1.5, medium: 4,   luxury: 15  },
  "agra":        { low: 1.5, medium: 4,   luxury: 14  },
  "varanasi":    { low: 1,   medium: 3,   luxury: 12  },
  "kochi":       { low: 1.5, medium: 4,   luxury: 15  },
  "hyderabad":   { low: 1.5, medium: 4,   luxury: 18  },
  // SEA
  "bali":        { low: 3,   medium: 8,   luxury: 28  },
  "bangkok":     { low: 3,   medium: 8,   luxury: 25  },
  "singapore":   { low: 6,   medium: 17,  luxury: 50  },
  "phuket":      { low: 4,   medium: 10,  luxury: 30  },
  "chiang mai":  { low: 3,   medium: 7,   luxury: 22  },
  "kuala lumpur":{ low: 3,   medium: 8,   luxury: 27  },
  "ho chi minh city": { low: 2.5, medium: 7, luxury: 22 },
  "hanoi":       { low: 2,   medium: 6,   luxury: 20  },
  "jakarta":     { low: 2.5, medium: 7,   luxury: 22  },
  "manila":      { low: 2.5, medium: 7,   luxury: 22  },
  // East Asia
  "tokyo":       { low: 7,   medium: 17,  luxury: 55  },
  "osaka":       { low: 6,   medium: 15,  luxury: 47  },
  "beijing":     { low: 4,   medium: 10,  luxury: 35  },
  "shanghai":    { low: 5,   medium: 12,  luxury: 37  },
  "hong kong":   { low: 5,   medium: 14,  luxury: 45  },
  "seoul":       { low: 5,   medium: 12,  luxury: 37  },
  "taipei":      { low: 4,   medium: 10,  luxury: 30  },
  // Middle East
  "dubai":       { low: 7,   medium: 18,  luxury: 60  },
  "istanbul":    { low: 3,   medium: 9,   luxury: 30  },
  "doha":        { low: 6,   medium: 16,  luxury: 55  },
  // Europe
  "london":      { low: 8,   medium: 22,  luxury: 67  },
  "paris":       { low: 7,   medium: 20,  luxury: 65  },
  "rome":        { low: 6,   medium: 17,  luxury: 55  },
  "barcelona":   { low: 6,   medium: 16,  luxury: 50  },
  "amsterdam":   { low: 7,   medium: 18,  luxury: 58  },
  "prague":      { low: 4,   medium: 10,  luxury: 32  },
  "budapest":    { low: 4,   medium: 9,   luxury: 30  },
  "lisbon":      { low: 5,   medium: 12,  luxury: 37  },
  "athens":      { low: 5,   medium: 12,  luxury: 37  },
  // Americas
  "new york":    { low: 8,   medium: 22,  luxury: 67  },
  "los angeles": { low: 7,   medium: 18,  luxury: 58  },
  "mexico city": { low: 3,   medium: 7,   luxury: 24  },
  // Oceania
  "sydney":      { low: 7,   medium: 18,  luxury: 58  },
  "melbourne":   { low: 6,   medium: 17,  luxury: 55  },
};

// Regional fallback meal costs USD
const REGION_MEAL_COSTS_USD: Record<string, { low: number; medium: number; luxury: number }> = {
  india:       { low: 1.5, medium: 4.5, luxury: 17  },
  south_asia:  { low: 1.5, medium: 4.5, luxury: 15  },
  sea:         { low: 3,   medium: 7.5, luxury: 24  },
  east_asia:   { low: 5,   medium: 13,  luxury: 40  },
  middle_east: { low: 5,   medium: 14,  luxury: 45  },
  europe:      { low: 6,   medium: 17,  luxury: 55  },
  americas:    { low: 5,   medium: 14,  luxury: 45  },
  oceania:     { low: 6,   medium: 17,  luxury: 55  },
  africa:      { low: 2.5, medium: 7,   luxury: 22  },
  default:     { low: 4,   medium: 10,  luxury: 32  },
};

// Typical attraction entry fee in USD per region
const ENTRY_FEE_USD: Record<string, { low: number; medium: number; luxury: number }> = {
  india:       { low: 1,  medium: 5,  luxury: 15 },
  south_asia:  { low: 1,  medium: 4,  luxury: 12 },
  sea:         { low: 3,  medium: 8,  luxury: 20 },
  east_asia:   { low: 5,  medium: 10, luxury: 25 },
  middle_east: { low: 5,  medium: 12, luxury: 30 },
  europe:      { low: 8,  medium: 18, luxury: 40 },
  americas:    { low: 8,  medium: 18, luxury: 40 },
  oceania:     { low: 8,  medium: 18, luxury: 35 },
  africa:      { low: 3,  medium: 8,  luxury: 20 },
  default:     { low: 5,  medium: 12, luxury: 30 },
};

// Hotel price ranges in USD per night per region
const HOTEL_RATES_USD: Record<string, { low: string; medium: string; luxury: string }> = {
  india:       { low: "15–35",   medium: "50–120",   luxury: "150–400"  },
  south_asia:  { low: "10–25",   medium: "40–90",    luxury: "120–350"  },
  sea:         { low: "20–45",   medium: "60–130",   luxury: "180–450"  },
  east_asia:   { low: "40–80",   medium: "100–200",  luxury: "300–700"  },
  middle_east: { low: "40–80",   medium: "100–220",  luxury: "300–800"  },
  europe:      { low: "50–90",   medium: "120–250",  luxury: "350–900"  },
  americas:    { low: "60–100",  medium: "130–250",  luxury: "350–900"  },
  oceania:     { low: "60–100",  medium: "130–250",  luxury: "350–800"  },
  africa:      { low: "25–55",   medium: "70–150",   luxury: "200–500"  },
  default:     { low: "30–70",   medium: "90–200",   luxury: "250–600"  },
};

function detectRegion(cityName: string): string {
  const city = cityName.split(",")[0].trim().toLowerCase();
  const maps: [string, string[]][] = [
    ["india",       ["delhi","mumbai","bangalore","bengaluru","kolkata","chennai","hyderabad","jaipur","goa","agra","varanasi","kochi","pune","ahmedabad","amritsar","udaipur","lucknow","srinagar"]],
    ["sea",         ["bali","bangkok","phuket","chiang mai","singapore","kuala lumpur","jakarta","ho chi minh","hanoi","manila","yangon","siem reap"]],
    ["east_asia",   ["tokyo","osaka","kyoto","beijing","shanghai","hong kong","seoul","taipei"]],
    ["south_asia",  ["kathmandu","colombo","dhaka","male","islamabad","lahore"]],
    ["middle_east", ["dubai","abu dhabi","doha","istanbul","riyadh","muscat","kuwait","bahrain"]],
    ["europe",      ["london","paris","amsterdam","rome","barcelona","madrid","frankfurt","vienna","prague","budapest","athens","lisbon","zurich","stockholm","oslo","milan","brussels","warsaw","dublin"]],
    ["americas",    ["new york","los angeles","san francisco","miami","chicago","toronto","vancouver","mexico city","sao paulo","buenos aires"]],
    ["oceania",     ["sydney","melbourne","brisbane","auckland","perth"]],
    ["africa",      ["cairo","nairobi","johannesburg","cape town","casablanca"]],
  ];
  for (const [region, keywords] of maps) {
    if (keywords.some(k => city.includes(k))) return region;
  }
  return "default";
}

function getMealCostUSD(destination: string, budgetLevel: "low" | "medium" | "luxury"): number {
  const city = destination.split(",")[0].trim().toLowerCase();
  if (MEAL_COSTS_USD[city]) return MEAL_COSTS_USD[city][budgetLevel];
  for (const [key, val] of Object.entries(MEAL_COSTS_USD)) {
    if (city.includes(key) || key.includes(city)) return val[budgetLevel];
  }
  const region = detectRegion(destination);
  return (REGION_MEAL_COSTS_USD[region] ?? REGION_MEAL_COSTS_USD.default)[budgetLevel];
}

interface DestinationPriceContext {
  mealAvg: number;        // single meal, in user's currency
  mealRange: string;      // "X–Y CURRENCY"
  entryFeeAvg: number;    // typical attraction entry fee, in user's currency
  entryFeeRange: string;  // "X–Y CURRENCY"
  hotelRanges: { low: string; medium: string; luxury: string }; // in user's currency
  region: string;
}

function buildDestinationPriceContext(
  destination: string,
  currency: string,
): DestinationPriceContext {
  const region = detectRegion(destination);
  const mealUSD = getMealCostUSD(destination, "medium");
  const entryFeeUSD = ENTRY_FEE_USD[region] ?? ENTRY_FEE_USD.default;
  const hotelUSD = HOTEL_RATES_USD[region] ?? HOTEL_RATES_USD.default;

  const conv = (usd: number) => Math.round(convertCurrencySync(usd, "USD", currency));
  const convRange = (range: string) => {
    const [lo, hi] = range.split("–").map(Number);
    return `${conv(lo)}–${conv(hi)}`;
  };

  const mealAvg = conv(mealUSD);
  const mealLow = conv(mealUSD * 0.5);
  const mealHigh = conv(mealUSD * 2.5);
  const entryAvg = conv(entryFeeUSD.medium);
  const entryLow = conv(entryFeeUSD.low);
  const entryHigh = conv(entryFeeUSD.luxury * 1.5);

  return {
    mealAvg,
    mealRange: `${mealLow}–${mealHigh}`,
    entryFeeAvg: entryAvg,
    entryFeeRange: `${entryLow}–${entryHigh}`,
    hotelRanges: {
      low:    convRange(hotelUSD.low),
      medium: convRange(hotelUSD.medium),
      luxury: convRange(hotelUSD.luxury),
    },
    region,
  };
}

// ─── JSON extractor ───────────────────────────────────────────────────────────

function extractJson(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenceMatch) return fenceMatch[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1) return text.slice(start, end + 1).trim();
  return text.trim();
}

// ─── Fallback image ───────────────────────────────────────────────────────────

function fallbackImage(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return `https://picsum.photos/seed/${hash}/800/600`;
}

// ─── Prompt builder ───────────────────────────────────────────────────────────

function generatePlacePrompt(input: PlaceInput, prices: DestinationPriceContext): string {
  const themeSection = input.tripTheme?.length
    ? `\nTrip Themes: ${input.tripTheme.join(", ")}\nPRIORITIZATION: Rank ALL recommendations by theme relevance. Theme-matching items first in each array. Highlight theme relevance in descriptions.`
    : "";

  return `You are a travel destination expert. Provide comprehensive, realistic place recommendations. OUTPUT ONLY VALID JSON — no markdown, no code fences, no extra text.

Origin: ${input.origin}
Destination: ${input.destination}
Travelers: ${input.numberOfPeople} people
Currency: ${input.currency} — ALL prices must be in ${input.currency}
Region: ${prices.region}${themeSection}

PRICE REFERENCE FOR ${input.destination} IN ${input.currency}:
- Single meal cost:     ${prices.mealRange} ${input.currency}  (avg: ~${prices.mealAvg})
- Attraction entry fee: ${prices.entryFeeRange} ${input.currency}  (avg: ~${prices.entryFeeAvg})
- Budget hotels:        ${prices.hotelRanges.low} ${input.currency}/night
- Medium hotels:        ${prices.hotelRanges.medium} ${input.currency}/night
- Luxury hotels:        ${prices.hotelRanges.luxury} ${input.currency}/night

Use the above ranges as your price reference. Do NOT use USD values or default to generic numbers.

**CRITICAL: All pricePerNight values MUST be in ${input.currency} (ISO 4217).
Set the "currency" field on every hotel object to "${input.currency}".
Do NOT use USD or any other currency unless the user's currency IS USD.**

Return ONLY this exact JSON structure:
{
  "attractions": [
    {
      "name": "Real attraction name",
      "description": "Engaging 1-2 sentence description",
      "location": "Specific neighborhood or area",
      "category": "cultural",
      "estimatedEntryFee": ${prices.entryFeeAvg},
      "rating": 4.5,
      "reviewsCount": 12000,
      "recommendedVisitDurationHours": 2
    }
  ],
  "foods": [
    {
      "name": "Real local dish name",
      "description": "What makes this dish special and where to best experience it",
      "averagePrice": ${prices.mealAvg},
      "topRestaurants": [
        {
          "name": "Real restaurant name",
          "location": "Specific area or street",
          "rating": 4.5
        }
      ]
    }
  ],
  "recommendedAreas": [
    {
      "name": "Area name",
      "description": "Why this area is recommended",
      "suitableFor": "family"
    }
  ],
  "hotelRecommendations": {
    "budget": [
      {
        "name": "Real hotel name",
        "description": "Brief accurate description",
        "location": "Neighborhood name",
        "pricePerNight": ${Math.round(convertCurrencySync(
          parseInt((HOTEL_RATES_USD[detectRegion("")] ?? HOTEL_RATES_USD.default).low.split("–")[0]) || 40,
          "USD", input.currency
        ))},
        "rating": 3.9,
        "reviewsCount": 380,
        "amenities": ["WiFi", "AC"]
      }
    ],
    "medium": [
      {
        "name": "Real hotel name",
        "description": "Brief accurate description",
        "location": "Neighborhood name",
        "pricePerNight": ${Math.round(convertCurrencySync(
          parseInt((HOTEL_RATES_USD[detectRegion("")] ?? HOTEL_RATES_USD.default).medium.split("–")[0]) || 120,
          "USD", input.currency
        ))},
        "rating": 4.3,
        "reviewsCount": 750,
        "amenities": ["WiFi", "Pool", "Breakfast"]
      }
    ],
    "luxury": [
      {
        "name": "Real hotel name",
        "description": "Brief accurate description",
        "location": "Neighborhood name",
        "pricePerNight": ${Math.round(convertCurrencySync(
          parseInt((HOTEL_RATES_USD[detectRegion("")] ?? HOTEL_RATES_USD.default).luxury.split("–")[0]) || 350,
          "USD", input.currency
        ))},
        "rating": 4.8,
        "reviewsCount": 1200,
        "amenities": ["Pool", "Spa", "Concierge", "Fine Dining"]
      }
    ]
  }
}

STRICT RULES:
1. category MUST be exactly one of: nature, historical, adventure, cultural, shopping, other
2. suitableFor MUST be exactly one of: budget, family, luxury, nightlife, couples
3. hotel location MUST be a plain string (neighborhood name), never an object
4. ALL prices MUST be in ${input.currency} using the price reference above
5. estimatedEntryFee: use 0 for free attractions, otherwise use realistic local price
6. averagePrice for food: realistic single serving/meal cost in ${input.currency}
7. Include 6-8 real attractions, 4-6 real local dishes, 3-5 areas, exactly 3 hotels per tier
8. Do NOT include images — they are fetched separately`;
}

// ─── Agent ────────────────────────────────────────────────────────────────────

export const placeAgent = {
  async run(input: PlaceInput): Promise<PlaceResult> {
    // Step 1: Build destination-specific price context
    const prices = buildDestinationPriceContext(input.destination, input.currency);
    console.log(`[Place Agent] Price context for ${input.destination}: meal ~${prices.mealAvg} ${input.currency}, entry ~${prices.entryFeeAvg} ${input.currency}, region: ${prices.region}`);

    // Step 2: Generate prompt with real price anchors and call LLM
    const prompt = generatePlacePrompt(input, prices);
    const response = await model.generateContent(prompt);
    const text = response.response.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // Step 3: Extract and parse JSON
    const jsonStr = extractJson(text);
    const parsed = JSON.parse(jsonStr);

    // Step 4: Normalise enums
    if (Array.isArray(parsed.attractions)) {
      parsed.attractions = parsed.attractions.map((a: any) => ({
        ...a,
        category: normalizeCategory(a.category ?? ""),
      }));
    }
    if (Array.isArray(parsed.recommendedAreas)) {
      parsed.recommendedAreas = parsed.recommendedAreas.map((area: any) => ({
        ...area,
        suitableFor: normalizeSuitableFor(area.suitableFor ?? ""),
      }));
    }

    // Step 5: Fetch all images in parallel
    console.log("[Place Agent] Fetching images in parallel...");

    type ImageTask = {
      query: string;
      type: "attraction" | "food" | "hotel";
      assign: (url: string) => void;
    };

    const tasks: ImageTask[] = [];

    for (const attraction of parsed.attractions ?? []) {
      tasks.push({
        query: `${attraction.name} ${input.destination}`,
        type: "attraction",
        assign: (url) => { attraction.images = [url]; },
      });
    }
    for (const food of parsed.foods ?? []) {
      tasks.push({
        query: `${food.name} ${input.destination}`,
        type: "food",
        assign: (url) => { food.images = [url]; },
      });
    }
    for (const tier of ["budget", "medium", "luxury"] as const) {
      for (const hotel of parsed.hotelRecommendations?.[tier] ?? []) {
        tasks.push({
          query: `${hotel.name} ${input.destination}`,
          type: "hotel",
          assign: (url) => { hotel.images = [url]; },
        });
      }
    }

    await Promise.all(
      tasks.map(async (task) => {
        try {
          const urls = await getMultipleImageUrls(task.query, 1, task.type);
          task.assign(urls[0] ?? fallbackImage(task.query));
        } catch {
          task.assign(fallbackImage(task.query));
        }
      })
    );

    console.log(`[Place Agent] Fetched images for ${tasks.length} items`);

    // Step 6: Stamp currency on every hotel before Zod validation.
    // This ensures budget.agent.ts convert() never sees undefined and
    // never falls back to the USD default that causes double-conversion.
    for (const tier of ["budget", "medium", "luxury"] as const) {
      for (const hotel of parsed.hotelRecommendations?.[tier] ?? []) {
        if (!hotel.currency) {
          console.warn(
            `[Place Agent] Hotel "${hotel.name}" missing currency field — stamping ${input.currency}. ` +
            `Check LLM output to ensure prices are actually in ${input.currency}.`
          );
          hotel.currency = input.currency;
        }
      }
    }

    // Step 7: Validate against Zod schema
    return PlaceResultSchema.parse(parsed);
  },
};