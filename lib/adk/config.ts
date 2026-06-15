import Groq from "groq-sdk";
import { GoogleGenAI } from "@google/genai";

/**
 * Centralized ADK / LLM configuration.
 *
 * Provider-agnostic adapter: agents call `model.generateContent(prompt, opts?)`
 * and get back a Gemini-shaped response regardless of the underlying provider.
 *
 * Provider selection (LLM_PROVIDER env):
 *   - "groq"   → llama-3.1-8b-instant (fast, but free tier = 6,000 TPM, which is
 *                too low to run the full 4-agent pipeline — needs a paid tier).
 *   - "gemini" → gemini-2.0-flash (free tier ~1M TPM — comfortably runs the
 *                pipeline). Auto-selected when GOOGLE_GEMINI_API_KEY is present.
 * Override the model per provider with GROQ_MODEL / GEMINI_MODEL.
 */

const groqKey = process.env.GROQ_API_KEY;
const geminiKey =
  process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

// Default to Gemini when its key is configured (free + high limits); else Groq.
export const LLM_PROVIDER = (
  process.env.LLM_PROVIDER || (geminiKey ? "gemini" : "groq")
).toLowerCase();

export const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
// gemini-2.5-flash: free-tier, generous limits, strong JSON. (gemini-2.0-flash
// has a 0 free-tier quota on some projects → use 2.5-flash by default.)
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
export const MODEL = LLM_PROVIDER === "gemini" ? GEMINI_MODEL : GROQ_MODEL;

export const groq = groqKey ? new Groq({ apiKey: groqKey }) : null;
const genAI = geminiKey ? new GoogleGenAI({ apiKey: geminiKey }) : null;

// Agent generation defaults.
// maxOutputTokens dropped from 20000 → 8000: the old value was billed against
// Groq's per-minute token limit on every call, instantly tripping the 6,000 TPM
// free-tier cap. 8000 covers a multi-day itinerary and fits paid Groq / Gemini.
export const AGENT_CONFIG = {
  temperature: 0.7,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8000,
} as const;

export interface GenerateOptions {
  /** Override max completion tokens for this call (e.g. weather needs far fewer). */
  maxTokens?: number;
  temperature?: number;
}

// Normalize any provider's text output to the Gemini-like shape agents expect.
function wrap(text: string) {
  return {
    response: {
      candidates: [{ content: { parts: [{ text }] } }],
    },
  };
}

async function generateGroq(prompt: string, opts: GenerateOptions) {
  if (!groq) throw new Error("GROQ_API_KEY is not set");
  const response = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: opts.temperature ?? AGENT_CONFIG.temperature,
    top_p: AGENT_CONFIG.topP,
    max_tokens: opts.maxTokens ?? AGENT_CONFIG.maxOutputTokens,
  });
  return wrap(response.choices[0]?.message?.content || "");
}

async function generateGemini(prompt: string, opts: GenerateOptions) {
  if (!genAI) throw new Error("GOOGLE_GEMINI_API_KEY is not set");
  // gemini-2.5-flash is a *thinking* model — its hidden reasoning tokens count
  // against maxOutputTokens and were truncating large JSON (itinerary/budget).
  // thinkingBudget:0 disables that; responseMimeType forces clean, fence-free JSON.
  const result = await genAI.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      temperature: opts.temperature ?? AGENT_CONFIG.temperature,
      topP: AGENT_CONFIG.topP,
      maxOutputTokens: opts.maxTokens ?? AGENT_CONFIG.maxOutputTokens,
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 0 },
    },
  });
  return wrap(result.text ?? "");
}

// LLM provider adapter — drop-in for every agent.
export const model = {
  generateContent: async (prompt: string, opts: GenerateOptions = {}) => {
    if (LLM_PROVIDER === "gemini") return generateGemini(prompt, opts);
    return generateGroq(prompt, opts);
  },
};

// ADK Retry Configuration
export const RETRY_CONFIG = {
  maxAttempts: 3,
  initialBackoffMs: 1000,
  maxBackoffMs: 10000,
} as const;
