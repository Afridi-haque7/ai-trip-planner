/**
 * Currency Conversion Tool
 *
 * Utility for converting costs between currencies.
 * Currently uses fixed exchange rates; can be replaced with live API.
 */

// Mock exchange rate data (based on Feb 2026 rates)
const EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  INR: 83.45,
  AUD: 1.53,
  CAD: 1.36,
  JPY: 149.5,
  SGD: 1.35,
  MXN: 17.05,
  BRL: 4.95,
};

export interface ConvertedCost {
  from: string;
  to: string;
  fromAmount: number;
  toAmount: number;
  rate: number;
}

/**
 * Convert amount from one currency to another
 * @param amount Amount to convert
 * @param fromCurrency Source currency code (e.g., "USD")
 * @param toCurrency Target currency code (e.g., "INR")
 * @returns Converted amount or original if currencies not supported
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number {
  const fromRate = EXCHANGE_RATES[fromCurrency.toUpperCase()];
  const toRate = EXCHANGE_RATES[toCurrency.toUpperCase()];

  if (!fromRate || !toRate) {
    console.warn(
      `Currency conversion: Unsupported currency. From: ${fromCurrency}, To: ${toCurrency}`
    );
    return amount; // Return as-is if unsupported
  }

  // Convert to USD, then to target
  const amountInUSD = amount / fromRate;
  return amountInUSD * toRate;
}

/**
 * Get detailed conversion info
 */
export function getCurrencyConversionDetail(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): ConvertedCost | null {
  const fromRate = EXCHANGE_RATES[fromCurrency.toUpperCase()];
  const toRate = EXCHANGE_RATES[toCurrency.toUpperCase()];

  if (!fromRate || !toRate) {
    return null;
  }

  const rate = fromRate / toRate;
  const toAmount = amount * rate;

  return {
    from: fromCurrency.toUpperCase(),
    to: toCurrency.toUpperCase(),
    fromAmount: amount,
    toAmount: parseFloat(toAmount.toFixed(2)),
    rate: parseFloat(rate.toFixed(4)),
  };
}

/**
 * Check if currency is supported
 */
export function isCurrencySupported(currencyCode: string): boolean {
  return currencyCode.toUpperCase() in EXCHANGE_RATES;
}

/**
 * Get list of supported currencies
 */
export function getSupportedCurrencies(): string[] {
  return Object.keys(EXCHANGE_RATES);
}
