export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/health — liveness probe.
 *
 * Intentionally cheap: no DB or Redis calls. Returns 200 as long as the process
 * is up and serving. Used by uptime monitors (UptimeRobot) and load balancers to
 * decide "is this instance alive". For dependency checks use /api/health/ready.
 */
export async function GET() {
  return Response.json(
    {
      status: "ok",
      service: "web",
      uptime: Math.round(process.uptime()),
      time: new Date().toISOString(),
    },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}
