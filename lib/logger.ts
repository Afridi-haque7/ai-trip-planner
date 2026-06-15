import pino from "pino";
import { env } from "@/lib/env";

/**
 * Structured logger (pino).
 *
 * Emits JSON logs (bundler-safe — no worker-thread transport, which breaks under
 * Next's serverless bundling). In local dev, pipe through pino-pretty if desired:
 *   `next dev | pino-pretty`. The always-on worker can attach its own transport.
 *
 * Secrets are redacted defensively so tokens/cookies never reach the log sink.
 */

const isProd = env.NODE_ENV === "production";

export const logger = pino({
  level: env.LOG_LEVEL ?? (isProd ? "info" : "debug"),
  base: { service: "trip-planner" },
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "*.password",
      "*.token",
      "*.apiKey",
      "*.secret",
    ],
    censor: "[redacted]",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

/**
 * Per-request child logger. Pass a requestId (generate one per inbound request)
 * so every line for a request is correlatable.
 */
export function requestLogger(bindings: Record<string, unknown>) {
  return logger.child(bindings);
}
