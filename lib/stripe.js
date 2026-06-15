import Stripe from "stripe";

/**
 * Stripe server client + plan/price mapping.
 *
 * The app's internal plan names (free | basic | premium) drive the monthly
 * usage limits in lib/usageGate.js. Stripe holds the same tiers as Prices:
 *   STRIPE_PRICE_STARTER → "basic"   (10 trips/mo)
 *   STRIPE_PRICE_PRO     → "premium" (30 trips/mo)
 * This module is the single source of truth for translating between the two,
 * so a webhook never has to guess which tier a price belongs to.
 */

let stripe = null;

export function getStripe() {
  if (stripe) return stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  // apiVersion omitted on purpose → SDK uses the version pinned to this release,
  // avoiding "invalid API version" drift between environments.
  stripe = new Stripe(key);
  return stripe;
}

/** internal plan name → Stripe price id (read lazily so env is loaded). */
export function planToPriceId(plan) {
  return {
    basic: process.env.STRIPE_PRICE_STARTER || "",
    premium: process.env.STRIPE_PRICE_PRO || "",
  }[plan];
}

/** Stripe price id → internal plan name (or null if unknown). */
export function planForPriceId(priceId) {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_STARTER) return "basic";
  if (priceId === process.env.STRIPE_PRICE_PRO) return "premium";
  return null;
}
