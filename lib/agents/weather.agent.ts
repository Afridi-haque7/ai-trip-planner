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
  origin: string;
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
  return `You are a travel weather expert. Provide accurate weather and season information. OUTPUT ONLY VALID JSON — no markdown, no code fences, no extra text.

Origin: ${input.origin}
Destination: ${input.destination}
Travel Dates: ${input.startDate} to ${input.endDate}

Context: The traveler is flying from ${input.origin} to ${input.destination}. Consider the climate contrast between origin and destination. Assess whether the travel dates fall during peak tourist season, shoulder season, or off-season for this destination, as this affects pricing.

Return ONLY this exact JSON structure:
{
  "currentSeason": "Season name at destination during travel dates (e.g. Winter, Monsoon, Dry Season)",
  "bestSeasonToVisit": "Single best season for this destination",
  "avoidSeason": "Worst season to visit this destination",
  "temperatureRange": "Realistic temperature range during the specified travel dates (e.g., '15-25°C')",
  "seasonalImpactOnCost": "low"
}

STRICT RULES:
- seasonalImpactOnCost MUST be exactly one of: low, medium, high — nothing else
- temperatureRange must reflect the actual destination climate for the given travel dates
- All 5 fields are required`;
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
