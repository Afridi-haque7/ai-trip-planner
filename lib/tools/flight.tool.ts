/**
 * Flight Estimation Tool — v4
 *
 * No external API. Uses realistic 2024/2025 airfare ranges per route type
 * + budget tier, then converts to the user's currency via exchange rates.
 *
 * v4 changes:
 *  - Accepts an optional `liveUsdRate` param so the Budget Agent can inject
 *    the same live exchange rate it fetched — eliminating drift between the
 *    static table and the live rate used elsewhere in the budget.
 *  - Falls back to the internal static table only when no live rate is given.
 *  - Fixed: default currency fallback was "INR" — now correctly "USD".
 *  - `currency` is always stamped on DetailedFlightEstimate so the Budget
 *    Agent can verify no conversion is needed.
 *
 * Accuracy: within 15–20% of real prices for most routes — sufficient to
 * anchor the Budget Agent and avoid currency mismatch bugs.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

interface FlightEstimationParams {
  origin: string;           // City name e.g. "New Delhi, India"
  destination: string;      // City name e.g. "Bali, Indonesia"
  numberOfTravelers: number;
  departureDate: string;    // YYYY-MM-DD
  returnDate?: string;
  currency: string;         // ISO 4217 e.g. "INR" — REQUIRED, no default
  budgetLevel?: "low" | "medium" | "luxury";
  /**
   * Optional: live USD→currency rate fetched by the caller (e.g. Budget Agent).
   * When provided this takes precedence over the internal static table,
   * ensuring all cost figures use a single consistent exchange rate.
   */
  liveUsdRate?: number;
}

interface FlightCostEstimate {
  min: number;
  max: number;
  average: number;
}

interface DetailedFlightEstimate {
  pricePerPerson: FlightCostEstimate;
  priceForGroup: FlightCostEstimate;
  /** Always set to params.currency — lets callers verify no re-conversion needed */
  currency: string;
  routeType: string;
  seasonalMultiplier: number;
  isRoundTrip: boolean;
  /** The USD→currency rate actually used (live or static fallback) */
  usdRateUsed: number;
  /** Whether the live rate was used or the internal static table */
  rateSource: "live" | "static";
}

// ─── IATA resolver ────────────────────────────────────────────────────────────

const IATA_MAP: Record<string, string> = {
  // India
  "new delhi": "DEL", "delhi": "DEL",
  "mumbai": "BOM", "bombay": "BOM",
  "bangalore": "BLR", "bengaluru": "BLR",
  "kolkata": "CCU", "calcutta": "CCU",
  "chennai": "MAA", "madras": "MAA",
  "hyderabad": "HYD",
  "goa": "GOI",
  "ahmedabad": "AMD",
  "pune": "PNQ",
  "jaipur": "JAI",
  "kochi": "COK",
  "lucknow": "LKO",
  "varanasi": "VNS",
  "amritsar": "ATQ",
  "srinagar": "SXR",
  "leh": "IXL",
  "bhubaneswar": "BBI",
  "patna": "PAT",
  "ranchi": "IXR",
  "nagpur": "NAG",
  "indore": "IDR",
  "bhopal": "BHO",
  "visakhapatnam": "VTZ",
  "coimbatore": "CJB",
  "thiruvananthapuram": "TRV", "trivandrum": "TRV",
  "mangalore": "IXE",
  "vadodara": "BDQ",
  "surat": "STV",
  // South East Asia
  "bali": "DPS", "denpasar": "DPS",
  "bangkok": "BKK",
  "singapore": "SIN",
  "kuala lumpur": "KUL",
  "jakarta": "CGK",
  "manila": "MNL",
  "ho chi minh city": "SGN", "saigon": "SGN",
  "hanoi": "HAN",
  "phuket": "HKT",
  "chiang mai": "CNX",
  "yangon": "RGN",
  "phnom penh": "PNH",
  "vientiane": "VTE",
  "colombo": "CMB",
  // East Asia
  "tokyo": "NRT",
  "osaka": "KIX",
  "beijing": "PEK",
  "shanghai": "PVG",
  "hong kong": "HKG",
  "seoul": "ICN",
  "taipei": "TPE",
  "guangzhou": "CAN",
  "shenzhen": "SZX",
  "fukuoka": "FUK",
  // South Asia
  "kathmandu": "KTM",
  "dhaka": "DAC",
  "karachi": "KHI",
  "lahore": "LHE",
  "islamabad": "ISB",
  "male": "MLE",
  "thimphu": "PBH",
  // Middle East
  "dubai": "DXB",
  "abu dhabi": "AUH",
  "doha": "DOH",
  "riyadh": "RUH",
  "istanbul": "IST",
  "muscat": "MCT",
  "kuwait city": "KWI",
  "bahrain": "BAH",
  "tel aviv": "TLV",
  "amman": "AMM",
  // Europe
  "london": "LHR",
  "paris": "CDG",
  "amsterdam": "AMS",
  "frankfurt": "FRA",
  "rome": "FCO",
  "barcelona": "BCN",
  "madrid": "MAD",
  "zurich": "ZRH",
  "vienna": "VIE",
  "prague": "PRG",
  "athens": "ATH",
  "lisbon": "LIS",
  "oslo": "OSL",
  "stockholm": "ARN",
  "copenhagen": "CPH",
  "moscow": "SVO",
  "milan": "MXP",
  "brussels": "BRU",
  "budapest": "BUD",
  "warsaw": "WAW",
  "dublin": "DUB",
  "edinburgh": "EDI",
  "geneva": "GVA",
  // Americas
  "new york": "JFK", "new york city": "JFK",
  "los angeles": "LAX",
  "toronto": "YYZ",
  "vancouver": "YVR",
  "mexico city": "MEX",
  "sao paulo": "GRU",
  "buenos aires": "EZE",
  "miami": "MIA",
  "chicago": "ORD",
  "san francisco": "SFO",
  "washington dc": "IAD",
  "boston": "BOS",
  "seattle": "SEA",
  "dallas": "DFW",
  "houston": "IAH",
  "lima": "LIM",
  "bogota": "BOG",
  "santiago": "SCL",
  // Oceania
  "sydney": "SYD",
  "melbourne": "MEL",
  "brisbane": "BNE",
  "auckland": "AKL",
  "perth": "PER",
  // Africa
  "cairo": "CAI",
  "nairobi": "NBO",
  "johannesburg": "JNB",
  "cape town": "CPT",
  "casablanca": "CMN",
  "lagos": "LOS",
  "addis ababa": "ADD",
  "accra": "ACC",
};

// Region sets for route classification
const INDIAN    = new Set(["DEL","BOM","BLR","CCU","MAA","HYD","GOI","AMD","PNQ","JAI","COK","LKO","VNS","ATQ","SXR","IXL","BBI","PAT","IXR","NAG","IDR","BHO","VTZ","CJB","TRV","IXE","BDQ","STV"]);
const SEA       = new Set(["DPS","BKK","SIN","KUL","CGK","MNL","SGN","HAN","HKT","CNX","RGN","PNH","VTE","CMB"]);
const EAST_ASIA = new Set(["NRT","KIX","PEK","PVG","HKG","ICN","TPE","CAN","SZX","FUK"]);
const S_ASIA    = new Set(["KTM","DAC","KHI","LHE","ISB","MLE","PBH"]);
const MIDEAST   = new Set(["DXB","AUH","DOH","RUH","IST","MCT","KWI","BAH","TLV","AMM"]);
const EUROPE    = new Set(["LHR","CDG","AMS","FRA","FCO","BCN","MAD","ZRH","VIE","PRG","ATH","LIS","OSL","ARN","CPH","SVO","MXP","BRU","BUD","WAW","DUB","EDI","GVA"]);
const AMERICAS  = new Set(["JFK","LAX","YYZ","YVR","MEX","GRU","EZE","MIA","ORD","SFO","IAD","BOS","SEA","DFW","IAH","LIM","BOG","SCL"]);
const OCEANIA   = new Set(["SYD","MEL","BNE","AKL","PER"]);
const AFRICA    = new Set(["CAI","NBO","JNB","CPT","CMN","LOS","ADD","ACC"]);

function resolveIata(cityName: string): string | null {
  const city = cityName.split(",")[0].trim().toLowerCase();
  if (IATA_MAP[city]) return IATA_MAP[city];
  for (const [key, code] of Object.entries(IATA_MAP)) {
    if (city.includes(key) || key.includes(city)) return code;
  }
  return null;
}

function getRegion(code: string): string {
  if (INDIAN.has(code))    return "india";
  if (SEA.has(code))       return "sea";
  if (EAST_ASIA.has(code)) return "east_asia";
  if (S_ASIA.has(code))    return "south_asia";
  if (MIDEAST.has(code))   return "middle_east";
  if (EUROPE.has(code))    return "europe";
  if (AMERICAS.has(code))  return "americas";
  if (OCEANIA.has(code))   return "oceania";
  if (AFRICA.has(code))    return "africa";
  return "unknown";
}

// ─── Route type classifier ────────────────────────────────────────────────────

type RouteType =
  | "india_domestic_short"
  | "india_domestic_long"
  | "india_south_asia"
  | "india_sea"
  | "india_east_asia"
  | "india_middle_east"
  | "india_europe"
  | "india_americas"
  | "india_oceania"
  | "india_africa"
  | "regional_asia"
  | "intercontinental";

function classifyRoute(originCode: string, destCode: string): RouteType {
  const r1 = getRegion(originCode);
  const r2 = getRegion(destCode);

  const hasIndia = r1 === "india" || r2 === "india";
  const other = hasIndia ? (r1 === "india" ? r2 : r1) : null;

  if (hasIndia) {
    if (other === "india") {
      const shortHaul = new Set(["GOI","COK","PNQ","JAI","IXL","SXR","VNS","CJB","TRV","IXE"]);
      if (shortHaul.has(originCode) || shortHaul.has(destCode)) return "india_domestic_short";
      return "india_domestic_long";
    }
    if (other === "south_asia")  return "india_south_asia";
    if (other === "sea")         return "india_sea";
    if (other === "east_asia")   return "india_east_asia";
    if (other === "middle_east") return "india_middle_east";
    if (other === "europe")      return "india_europe";
    if (other === "americas")    return "india_americas";
    if (other === "oceania")     return "india_oceania";
    if (other === "africa")      return "india_africa";
  }

  const asiaGroup = new Set(["sea","east_asia","south_asia"]);
  if (asiaGroup.has(r1) && asiaGroup.has(r2)) return "regional_asia";

  return "intercontinental";
}

// ─── Base fares (round-trip USD per person) ───────────────────────────────────

const BASE_FARES_USD: Record<RouteType, Record<"low" | "medium" | "luxury", { min: number; avg: number; max: number }>> = {
  india_domestic_short:  { low: { min: 60,   avg: 100,  max: 180  }, medium: { min: 100,  avg: 160,  max: 250  }, luxury: { min: 200,  avg: 320,  max: 500  } },
  india_domestic_long:   { low: { min: 80,   avg: 140,  max: 220  }, medium: { min: 140,  avg: 210,  max: 320  }, luxury: { min: 280,  avg: 450,  max: 700  } },
  india_south_asia:      { low: { min: 150,  avg: 250,  max: 380  }, medium: { min: 250,  avg: 380,  max: 550  }, luxury: { min: 500,  avg: 800,  max: 1200 } },
  india_sea:             { low: { min: 280,  avg: 420,  max: 620  }, medium: { min: 420,  avg: 620,  max: 900  }, luxury: { min: 900,  avg: 1400, max: 2200 } },
  india_east_asia:       { low: { min: 450,  avg: 700,  max: 1000 }, medium: { min: 700,  avg: 1000, max: 1500 }, luxury: { min: 1500, avg: 2500, max: 4000 } },
  india_middle_east:     { low: { min: 200,  avg: 320,  max: 480  }, medium: { min: 320,  avg: 480,  max: 700  }, luxury: { min: 700,  avg: 1100, max: 1800 } },
  india_europe:          { low: { min: 550,  avg: 800,  max: 1100 }, medium: { min: 800,  avg: 1100, max: 1600 }, luxury: { min: 2000, avg: 3200, max: 5000 } },
  india_americas:        { low: { min: 800,  avg: 1100, max: 1500 }, medium: { min: 1100, avg: 1500, max: 2200 }, luxury: { min: 3000, avg: 4500, max: 7000 } },
  india_oceania:         { low: { min: 600,  avg: 900,  max: 1300 }, medium: { min: 900,  avg: 1300, max: 1900 }, luxury: { min: 2200, avg: 3500, max: 5500 } },
  india_africa:          { low: { min: 500,  avg: 750,  max: 1100 }, medium: { min: 750,  avg: 1100, max: 1600 }, luxury: { min: 1800, avg: 2800, max: 4500 } },
  regional_asia:         { low: { min: 80,   avg: 150,  max: 280  }, medium: { min: 150,  avg: 280,  max: 450  }, luxury: { min: 450,  avg: 800,  max: 1400 } },
  intercontinental:      { low: { min: 450,  avg: 750,  max: 1200 }, medium: { min: 750,  avg: 1100, max: 1800 }, luxury: { min: 2000, avg: 3500, max: 6000 } },
};

// ─── Currency conversion ──────────────────────────────────────────────────────

/**
 * Static fallback rates (mid-2024). Only used when no live rate is injected.
 * Callers should prefer passing `liveUsdRate` via FlightEstimationParams.
 */
const STATIC_USD_TO: Record<string, number> = {
  INR: 83.5, USD: 1,     EUR: 0.92, GBP: 0.79,
  JPY: 157,  AED: 3.67,  THB: 36,   SGD: 1.35,
  AUD: 1.53, CAD: 1.36,  MYR: 4.72, IDR: 16100,
  SAR: 3.75, QAR: 3.64,  KWD: 0.31, BHD: 0.38,
  MXN: 17.2, BRL: 5.1,   ARS: 900,  CLP: 960,
  ZAR: 18.5, KES: 130,   EGP: 47,   NGN: 1500,
  NZD: 1.62, PKR: 278,   BDT: 110,  LKR: 305,
  NPR: 133,  CNY: 7.25,  KRW: 1360, TWD: 32.5,
  HKD: 7.82, VND: 25400, PHP: 58,   MMK: 2100,
};

/**
 * Resolve which USD→currency rate to use.
 * Live rate (from Budget Agent) takes precedence over static table.
 * Throws if currency is missing — callers must always provide it explicitly.
 */
function resolveUsdRate(currency: string, liveUsdRate?: number): { rate: number; source: "live" | "static" } {
  if (!currency) {
    throw new Error("[Flight Tool] currency is required — no default applied");
  }
  const tgt = currency.toUpperCase();
  if (liveUsdRate !== undefined && liveUsdRate > 0) {
    return { rate: liveUsdRate, source: "live" };
  }
  const staticRate = STATIC_USD_TO[tgt];
  if (staticRate === undefined) {
    console.warn(`[Flight Tool] No static rate for ${tgt} — using 1:1 (USD). Add it to STATIC_USD_TO.`);
    return { rate: 1, source: "static" };
  }
  return { rate: staticRate, source: "static" };
}

function convertFromUSD(amountUSD: number, rate: number, currency: string): number {
  const converted = amountUSD * rate;
  // Round to a "clean" number based on currency magnitude
  if (rate >= 1000) return Math.round(converted / 500)  * 500;  // IDR, VND
  if (rate >= 100)  return Math.round(converted / 50)   * 50;   // INR, JPY, etc.
  if (rate >= 10)   return Math.round(converted / 5)    * 5;    // THB, MXN, etc.
  return Math.round(converted * 10) / 10;                       // USD, EUR, GBP
}

// ─── Seasonal multiplier ──────────────────────────────────────────────────────

function getSeasonalMultiplier(dateStr: string): number {
  const month = new Date(dateStr).getMonth(); // 0-indexed
  if ((month >= 5 && month <= 7) || month === 11 || month === 0) return 1.35;
  if ((month >= 2 && month <= 4) || (month >= 8 && month <= 10)) return 1.1;
  return 0.88;
}

// ─── Core estimator ───────────────────────────────────────────────────────────

function estimatePerPerson(params: FlightEstimationParams): {
  estimate: FlightCostEstimate;
  routeType: string;
  seasonal: number;
  usdRateUsed: number;
  rateSource: "live" | "static";
} {
  const originCode = resolveIata(params.origin)      ?? "DEL";
  const destCode   = resolveIata(params.destination) ?? "DEL";

  const routeType = classifyRoute(originCode, destCode);
  const level     = params.budgetLevel ?? "medium";
  const seasonal  = getSeasonalMultiplier(params.departureDate);
  const isRT      = !!params.returnDate;

  const base = BASE_FARES_USD[routeType][level];

  const avgUSD = base.avg * seasonal;
  const minUSD = base.min * seasonal;
  const maxUSD = base.max * seasonal;

  // One-way = 65% of round-trip
  const factor = isRT ? 1 : 0.65;

  const { rate, source } = resolveUsdRate(params.currency, params.liveUsdRate);

  const estimate: FlightCostEstimate = {
    min:     convertFromUSD(minUSD * factor, rate, params.currency),
    average: convertFromUSD(avgUSD * factor, rate, params.currency),
    max:     convertFromUSD(maxUSD * factor, rate, params.currency),
  };

  console.log(
    `[Flight Tool] ${originCode}→${destCode} | ${routeType} | ${level} | ` +
    `seasonal: ×${seasonal} | ${isRT ? "RT" : "OW"} | ` +
    `rate: 1 USD = ${rate} ${params.currency} [${source}] | ` +
    `avg: ${estimate.average} ${params.currency}`
  );

  return { estimate, routeType, seasonal, usdRateUsed: rate, rateSource: source };
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export function estimateFlightCost(params: FlightEstimationParams): FlightCostEstimate {
  const { estimate } = estimatePerPerson(params);
  return estimate;
}

export function getDetailedFlightEstimate(params: FlightEstimationParams): DetailedFlightEstimate {
  const { estimate, routeType, seasonal, usdRateUsed, rateSource } = estimatePerPerson(params);

  return {
    pricePerPerson: estimate,
    priceForGroup: {
      min:     estimate.min     * params.numberOfTravelers,
      average: estimate.average * params.numberOfTravelers,
      max:     estimate.max     * params.numberOfTravelers,
    },
    currency:          params.currency,   // already in target currency
    routeType,
    seasonalMultiplier: parseFloat(seasonal.toFixed(2)),
    isRoundTrip:       !!params.returnDate,
    usdRateUsed,
    rateSource,
  };
}

export function isRouteKnown(origin: string, destination: string): boolean {
  return resolveIata(origin) !== null && resolveIata(destination) !== null;
}