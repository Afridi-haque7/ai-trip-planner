import Groq from "groq-sdk";

// Centralized ADK Configuration
// Ensures all agents use same model, rate limiting, and retry policies

const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) {
  throw new Error("GROQ_API_KEY environment variable is not set");
}

export const groq = new Groq({
  apiKey,
});

export const MODEL = "llama-3.1-8b-instant";

// LLM provider adapter - wraps Groq API to match agent interface
export const model = {
  generateContent: async (prompt: string) => {
    const response = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: AGENT_CONFIG.temperature,
      top_p: AGENT_CONFIG.topP,
      max_tokens: AGENT_CONFIG.maxOutputTokens,
    });

    // Return in Gemini-like format for compatibility
    return {
      response: {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: response.choices[0]?.message?.content || "",
                },
              ],
            },
          },
        ],
      },
    };
  },
};

// ADK Retry Configuration
export const RETRY_CONFIG = {
  maxAttempts: 3,
  initialBackoffMs: 1000, // 1 second base backoff
  maxBackoffMs: 10000, // 10 second max
} as const;

// Agent Configuration
export const AGENT_CONFIG = {
  temperature: 0.7, // Balanced creativity + determinism
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 20000,
} as const;