import crypto from "crypto";
import { cacheGetJson, cacheSetJson } from "@/lib/redis";

/**
 * Trip result cache.
 *
 * Popular searches (same route, dates, party, budget, currency, theme) produce
 * an identical plan — so we key the fully-generated TripContext by a normalized
 * "signature" and serve repeats from Redis instead of re-running the whole
 * multi-agent pipeline. This is the "frequently searched trips" optimization.
 *
 * Caching is global (not per-user): a TripContext holds only trip-planning data,
 * no PII, so sharing across users is intended and safe.
 */

const TRIP_TTL_SECONDS = 60 * 60 * 12; // 12h — long enough to absorb popular repeats

export interface TripSignatureInput {
  origin: string;
  destination: string;
  startDate: string;
  endDate: string;
  numberOfPeople: number;
  budgetLevel: string;
  currency: string;
  tripTheme?: string[];
}

/** Deterministic, collision-resistant cache key for a trip request. */
export function tripSignature(input: TripSignatureInput): string {
  const norm = (s: string) => String(s ?? "").trim().toLowerCase();
  const theme = (input.tripTheme ?? []).map(norm).sort().join(",");
  const raw = [
    norm(input.origin),
    norm(input.destination),
    input.startDate,
    input.endDate,
    input.numberOfPeople,
    norm(input.budgetLevel),
    norm(input.currency),
    theme,
  ].join("|");
  const hash = crypto.createHash("sha1").update(raw).digest("hex").slice(0, 16);
  return `trip:v1:${hash}`;
}

export async function getCachedTrip<T = unknown>(
  input: TripSignatureInput
): Promise<T | null> {
  return cacheGetJson<T>(tripSignature(input));
}

export async function setCachedTrip(
  input: TripSignatureInput,
  context: unknown,
  ttlSeconds: number = TRIP_TTL_SECONDS
): Promise<void> {
  await cacheSetJson(tripSignature(input), context, ttlSeconds);
}
