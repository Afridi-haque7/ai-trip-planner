/**
 * Currency Conversion Tool — v2
 *
 * Primary:  Frankfurt Open Data API (free, no key, no rate limits)
 *           https://frankfurter.dev
 * Fallback: Hardcoded mid-2024 rates (covers 30+ currencies)
 *
 * Rates are cached in memory for 6 hours to avoid redundant fetches
 * across multiple agent calls within the same pipeline run.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ConvertedCost {
  from: string;
  to: string;
  fromAmount: number;
  toAmount: number;
  rate: number;
  source: "live" | "fallback";
}

// ─── Fallback rates (USD base, mid-2024) ─────────────────────────────────────

const FALLBACK_RATES_FROM_USD: Record<string, number> = {
  USD: 1,       EUR: 0.92,   GBP: 0.79,   INR: 83.5,
  JPY: 157,     AED: 3.67,   THB: 36,     SGD: 1.35,
  AUD: 1.53,    CAD: 1.36,   MYR: 4.72,   IDR: 16100,
  SAR: 3.75,    QAR: 3.64,   KWD: 0.31,   BHD: 0.38,
  MXN: 17.2,    BRL: 5.1,    ARS: 900,    CLP: 960,
  ZAR: 18.5,    KES: 130,    EGP: 47,     NGN: 1500,
  NZD: 1.62,    PKR: 278,    BDT: 110,    LKR: 305,
  NPR: 133,     CNY: 7.25,   KRW: 1360,   TWD: 32.5,
  HKD: 7.82,    VND: 25400,  PHP: 58,     MMK: 2100,
  CHF: 0.9,     SEK: 10.6,   NOK: 10.7,   DKK: 6.88,
  PLN: 3.95,    CZK: 23.2,   HUF: 360,    RON: 4.57,
  TRY: 32.5,    ILS: 3.72,   MAD: 10.0,   UAH: 39.5,
};

// ─── In-memory cache ──────────────────────────────────────────────────────────

interface RateCache {
  rates: Record<string, number>; // All rates relative to EUR (Frankfurter base)
  fetchedAt: number;
}

let rateCache: RateCache | null = null;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

// ─── Live rate fetcher ────────────────────────────────────────────────────────

/**
 * Frankfurter returns rates relative to EUR.
 * We normalise to USD base internally for consistency with fallback.
 */
async function fetchLiveRates(): Promise<Record<string, number> | null> {
  // Return cached if still fresh
  if (rateCache && Date.now() - rateCache.fetchedAt < CACHE_TTL_MS) {
    return rateCache.rates;
  }

  try {
    const res = await fetch("https://api.frankfurter.dev/v1/latest?base=USD", {
      signal: AbortSignal.timeout(4000), // 4s timeout
    });

    if (!res.ok) {
      console.warn(`[Currency Tool] Frankfurter returned ${res.status}`);
      return null;
    }

    const data = await res.json();
    const rates: Record<string, number> = { USD: 1, ...data.rates };

    rateCache = { rates, fetchedAt: Date.now() };
    console.log(`[Currency Tool] Live rates fetched (${Object.keys(rates).length} currencies)`);
    return rates;
  } catch (err) {
    console.warn("[Currency Tool] Live fetch failed:", err);
    return null;
  }
}

// ─── Rate resolver ────────────────────────────────────────────────────────────

/**
 * Returns the exchange rate for a currency vs USD.
 * Tries live rates first, falls back to hardcoded table.
 */
async function getUsdRate(
  currency: string
): Promise<{ rate: number; source: "live" | "fallback" }> {
  const code = currency.toUpperCase();

  const live = await fetchLiveRates();
  if (live?.[code] !== undefined) {
    return { rate: live[code], source: "live" };
  }

  const fallback = FALLBACK_RATES_FROM_USD[code];
  if (fallback !== undefined) {
    return { rate: fallback, source: "fallback" };
  }

  console.warn(`[Currency Tool] Unknown currency: ${code}, defaulting to USD`);
  return { rate: 1, source: "fallback" };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Convert amount from one currency to another.
 * Uses live rates when available, falls back to hardcoded table.
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();

  if (from === to) return amount;

  const [fromData, toData] = await Promise.all([
    getUsdRate(from),
    getUsdRate(to),
  ]);

  // Convert: amount → USD → target
  const amountInUSD = amount / fromData.rate;
  const result = amountInUSD * toData.rate;

  return parseFloat(result.toFixed(2));
}

/**
 * Get detailed conversion info including rate and source.
 */
export async function getCurrencyConversionDetail(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<ConvertedCost | null> {
  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();

  const [fromData, toData] = await Promise.all([
    getUsdRate(from),
    getUsdRate(to),
  ]);

  // Direct cross rate: from → USD → to
  const crossRate = toData.rate / fromData.rate;
  const toAmount = amount * crossRate;

  return {
    from,
    to,
    fromAmount: amount,
    toAmount: parseFloat(toAmount.toFixed(2)),
    rate: parseFloat(crossRate.toFixed(6)),
    source: fromData.source === "live" && toData.source === "live" ? "live" : "fallback",
  };
}

/**
 * Pre-warm the cache. Call this at pipeline startup to avoid
 * cold-fetch latency inside individual agents.
 */
export async function warmRateCache(): Promise<void> {
  await fetchLiveRates();
}

/**
 * Check if a currency is supported (live or fallback).
 */
export async function isCurrencySupported(currencyCode: string): Promise<boolean> {
  const code = currencyCode.toUpperCase();
  const live = await fetchLiveRates();
  return !!(live?.[code] ?? FALLBACK_RATES_FROM_USD[code]);
}

/**
 * Synchronous version using only fallback rates — use when async isn't possible.
 */
export function convertCurrencySync(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number {
  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();
  if (from === to) return amount;

  const fromRate = FALLBACK_RATES_FROM_USD[from] ?? 1;
  const toRate = FALLBACK_RATES_FROM_USD[to] ?? 1;

  return parseFloat(((amount / fromRate) * toRate).toFixed(2));
}

/**
 * Get all supported currency codes (fallback list — live may have more).
 */
export function getSupportedCurrencies(): string[] {
  return Object.keys(FALLBACK_RATES_FROM_USD).sort();
}