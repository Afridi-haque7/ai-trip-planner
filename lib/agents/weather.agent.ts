import { model } from "@/lib/adk/config";
import { WeatherResultSchema, type WeatherResult } from "@/lib/adk/schemas";

/**
 * Weather Agent
 *
 * Responsibilities:
 * - Research current/upcoming weather at destination
 * - Identify peak season and avoid period
 * - Provide temperature range expectations
 * - Assess seasonal cost impact
 *
 * Input: destination, startDate, endDate
 * Output: WeatherResult (strict schema)
 */

interface WeatherInput {
  destination: string;
  startDate: string; // ISO format
  endDate: string; // ISO format
}

/**
 * Post-process to extract correct enum value for seasonalImpactOnCost
 */
function normalizeSeasonalImpact(value: string): "low" | "medium" | "high" {
  const lower = value.toLowerCase();
  if (lower.includes("low")) return "low";
  if (lower.includes("high")) return "high";
  if (lower.includes("medium")) return "medium";
  if (lower.includes("peak")) return "high";
  if (lower.includes("off-season")) return "low";
  if (lower.includes("shoulder")) return "medium";
  return "medium"; // Default
}

async function generateWeatherPrompt(input: WeatherInput): Promise<string> {
  return `You are a travel weather expert. Provide weather information for the destination. OUTPUT ONLY VALID JSON.

Destination: ${input.destination}
Travel Dates: ${input.startDate} to ${input.endDate}

CRITICAL: Return ONLY this JSON structure with NO extra text:
{
  "currentSeason": "Name of the season (Spring/Summer/Autumn/Winter)",
  "bestSeasonToVisit": "Best season name for this destination (Spring/Summer/Autumn/Winter)",
  "avoidSeason": "Season to avoid (Spring/Summer/Autumn/Winter)",
  "temperatureRange": "Expected temperature range during travel dates (e.g., '25-35°C')",
  "seasonalImpactOnCost": "ONE WORD ONLY: low OR medium OR high"
}

ENUM VALUES MUST BE EXACT:
- seasonalImpactOnCost: ONLY "low" OR "medium" OR "high" (no description, just the word)

Example valid response:
{
  "currentSeason": "Summer",
  "bestSeasonToVisit": "Autumn",
  "avoidSeason": "Winter",
  "temperatureRange": "28-35°C",
  "seasonalImpactOnCost": "medium"
}`;
}

export const weatherAgent = {
  async run(input: WeatherInput): Promise<WeatherResult> {
    const prompt = await generateWeatherPrompt(input);

    const response = await model.generateContent(prompt);

    const text =
      response.response.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const parsed = JSON.parse(jsonStr);
    
    // Normalize enum values
    if (parsed.seasonalImpactOnCost) {
      parsed.seasonalImpactOnCost = normalizeSeasonalImpact(
        parsed.seasonalImpactOnCost
      );
    }

    return WeatherResultSchema.parse(parsed);
  },
};
