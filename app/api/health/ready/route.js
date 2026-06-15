export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import { redisPing } from "@/lib/redis";
import { features } from "@/lib/env";

/**
 * GET /api/health/ready — readiness probe.
 *
 * Checks the core infrastructure this app needs to serve real traffic: MongoDB
 * (required) and Redis (required only when configured). Returns 503 if a required
 * dependency is down so deploys/monitors don't route traffic to a broken instance.
 *
 * Third-party pricing/image providers are intentionally NOT gated here — their
 * outages degrade results gracefully (fallbacks) but don't make us "not ready".
 */
export async function GET() {
  const checks = { mongo: "down", redis: "disabled" };

  // ── MongoDB (required) ──────────────────────────────────────────────────
  let mongoOk = false;
  try {
    await dbConnect();
    mongoOk = mongoose.connection.readyState === 1; // 1 = connected
  } catch {
    mongoOk = false;
  }
  checks.mongo = mongoOk ? "ok" : "down";

  // ── Redis (required only when configured) ───────────────────────────────
  let redisOk = true;
  if (features.cache()) {
    redisOk = await redisPing();
    checks.redis = redisOk ? "ok" : "down";
  }

  const healthy = mongoOk && redisOk;

  return Response.json(
    {
      status: healthy ? "ok" : "degraded",
      service: "web",
      checks,
      time: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503, headers: { "Cache-Control": "no-store" } }
  );
}
