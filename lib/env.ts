import { z } from "zod";

/**
 * Centralized, validated environment configuration.
 *
 * Single source of truth for every env var the app reads. Importing this module
 * validates `process.env` once and fails fast with a readable error listing the
 * exact missing/invalid keys — instead of a cryptic `undefined` crash deep in a
 * request handler.
 *
 * Required vars throw at boot. Everything optional degrades gracefully (e.g. no
 * REDIS_URL → caching disabled, no TRAVELPAYOUTS_TOKEN → fall back to estimates).
 *
 * CI/build escape hatch: set `SKIP_ENV_VALIDATION=1` to skip validation (useful
 * for `next build` / docker build steps that run without runtime secrets).
 */

const EnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error", "fatal", "silent"])
    .optional(),

  // ── Core (required at runtime) ───────────────────────────────────────────
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  BETTER_AUTH_SECRET: z.string().min(1, "BETTER_AUTH_SECRET is required"),

  // ── LLM provider (need at least one key; config.ts picks Gemini when set) ──
  LLM_PROVIDER: z.enum(["groq", "gemini"]).optional(),
  GROQ_API_KEY: z.string().optional(),
  GROQ_MODEL: z.string().optional(),
  GOOGLE_GEMINI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().optional(),

  // ── Auth / email (optional; auth still boots without Google in dev) ───────
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  BETTER_AUTH_URL: z.string().url().optional(),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM: z.string().optional(),
  CONTACT_EMAIL: z.string().optional(),

  // ── Redis (cache · job state · rate-limit) ───────────────────────────────
  // redis://localhost:6379 locally, rediss://… for Upstash. Absent → cache off.
  REDIS_URL: z.string().optional(),

  // ── Async jobs (Upstash QStash → worker) ─────────────────────────────────
  QSTASH_TOKEN: z.string().optional(),
  QSTASH_CURRENT_SIGNING_KEY: z.string().optional(),
  QSTASH_NEXT_SIGNING_KEY: z.string().optional(),
  WORKER_URL: z.string().url().optional(),
  WORKER_SHARED_SECRET: z.string().optional(),

  // ── Live pricing (Travelpayouts: Aviasales flights + Hotellook hotels) ────
  TRAVELPAYOUTS_TOKEN: z.string().optional(),
  TRAVELPAYOUTS_MARKER: z.string().optional(),

  // ── Images (free real-photo providers) ───────────────────────────────────
  PEXELS_API_KEY: z.string().optional(),
  PIXABAY_API_KEY: z.string().optional(),

  // ── Stripe billing ───────────────────────────────────────────────────────
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_STARTER: z.string().optional(),
  STRIPE_PRICE_PRO: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),

  // ── Observability ────────────────────────────────────────────────────────
  SENTRY_DSN: z.string().optional(),

  // ── Public ───────────────────────────────────────────────────────────────
  NEXT_PUBLIC_APP_URL: z.string().optional(),
  NEXT_PUBLIC_BETTER_AUTH_URL: z.string().optional(),
  NEXT_PUBLIC_GOOGLE_PLACE_API_KEY: z.string().optional(),
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: z.string().optional(),
});

export type Env = z.infer<typeof EnvSchema>;

function buildEnv(): Env {
  if (process.env.SKIP_ENV_VALIDATION === "1") {
    return process.env as unknown as Env;
  }

  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(
      `[env] Invalid environment configuration:\n${issues}\n` +
        `Set the missing keys, or export SKIP_ENV_VALIDATION=1 for build steps.`
    );
  }
  return parsed.data;
}

export const env: Env = buildEnv();

/** True when a feature's backing service is configured. */
export const features = {
  cache: () => Boolean(env.REDIS_URL),
  livePricing: () => Boolean(env.TRAVELPAYOUTS_TOKEN),
  asyncJobs: () => Boolean(env.QSTASH_TOKEN && env.WORKER_URL),
  stripe: () => Boolean(env.STRIPE_SECRET_KEY),
  pexels: () => Boolean(env.PEXELS_API_KEY),
  pixabay: () => Boolean(env.PIXABAY_API_KEY),
} as const;
