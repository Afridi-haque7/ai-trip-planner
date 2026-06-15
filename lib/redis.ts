import Redis from "ioredis";
import { env } from "@/lib/env";

/**
 * Shared Redis client (ioredis).
 *
 * One lazily-connected singleton, reused across warm serverless invocations and
 * the worker process. Works with both a local `redis://localhost:6379` and an
 * Upstash `rediss://…` URL (TLS auto-enabled for the `rediss://` scheme).
 *
 * If REDIS_URL is unset, `getRedis()` returns null so callers degrade gracefully
 * (cache misses, health check reports "disabled") instead of crashing.
 */

declare global {
  // eslint-disable-next-line no-var
  var __redisClient: Redis | null | undefined;
}

function createClient(): Redis | null {
  if (!env.REDIS_URL) return null;

  const client = new Redis(env.REDIS_URL, {
    lazyConnect: true,
    connectTimeout: 3000,
    maxRetriesPerRequest: 2,
    enableReadyCheck: true,
    tls: env.REDIS_URL.startsWith("rediss://") ? {} : undefined,
    // Give up reconnecting after a few tries so a dead Redis never hangs a request.
    retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 1000)),
  });

  // Never let a transient socket error crash the Node process.
  client.on("error", (err: Error) => {
    console.error("[redis] error:", err.message);
  });

  return client;
}

/** Returns the shared client, or null when Redis is not configured. */
export function getRedis(): Redis | null {
  if (global.__redisClient !== undefined) return global.__redisClient;
  global.__redisClient = createClient();
  return global.__redisClient;
}

/** Liveness probe for the readiness health check. */
export async function redisPing(): Promise<boolean> {
  const client = getRedis();
  if (!client) return false;
  try {
    const res = await client.ping();
    return res === "PONG";
  } catch (err) {
    console.error("[redis] ping failed:", (err as Error).message);
    return false;
  }
}

/**
 * JSON get/set helpers with a guard so every caller works whether or not Redis
 * is configured. A failed Redis op never throws into the request path.
 */
export async function cacheGetJson<T>(key: string): Promise<T | null> {
  const client = getRedis();
  if (!client) return null;
  try {
    const raw = await client.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch (err) {
    console.error("[redis] get failed:", (err as Error).message);
    return null;
  }
}

export async function cacheSetJson(
  key: string,
  value: unknown,
  ttlSeconds: number
): Promise<void> {
  const client = getRedis();
  if (!client) return;
  try {
    await client.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch (err) {
    console.error("[redis] set failed:", (err as Error).message);
  }
}
