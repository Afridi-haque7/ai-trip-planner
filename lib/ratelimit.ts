import { getRedis } from "@/lib/redis";

/**
 * Redis-backed fixed-window rate limiter (burst / abuse protection).
 *
 * This sits ABOVE the monthly usage gate: the gate meters paid quota, this stops
 * a single user/IP from hammering an endpoint within a short window.
 *
 * Fail-open by design: if Redis is unconfigured or errors, requests are allowed —
 * we never block real users because the limiter itself is unavailable. Runs in
 * the Node runtime (ioredis), so call it inside route handlers, not Edge middleware.
 */

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetSeconds: number;
}

export async function rateLimit(
  identifier: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const redis = getRedis();
  if (!redis) {
    return { allowed: true, remaining: limit, limit, resetSeconds: windowSeconds };
  }

  const key = `ratelimit:${identifier}`;
  try {
    const count = await redis.incr(key);
    // Set the window TTL only on the first hit so the window doesn't slide forward.
    if (count === 1) await redis.expire(key, windowSeconds);
    const ttl = await redis.ttl(key);
    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      limit,
      resetSeconds: ttl > 0 ? ttl : windowSeconds,
    };
  } catch {
    // Never block on limiter failure.
    return { allowed: true, remaining: limit, limit, resetSeconds: windowSeconds };
  }
}

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function clientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return headers.get("x-real-ip") || "unknown";
}

/** Standard 429 JSON response with a Retry-After header. */
export function tooManyRequests(result: RateLimitResult): Response {
  return Response.json(
    {
      success: false,
      error: "Too many requests. Please slow down and try again shortly.",
      retryAfterSeconds: result.resetSeconds,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.resetSeconds),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
      },
    }
  );
}
