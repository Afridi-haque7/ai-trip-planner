import { model } from "@/lib/adk/config";
import {
  BudgetResultSchema,
  type BudgetResult,
  type ItineraryResult,
  type PlaceResult,
} from "@/lib/adk/schemas";

/**
 * Budget Agent
 *
 * Responsibilities:
 * - Estimate costs across all categories
 * - Apply budget tier multipliers
 * - Apply seasonal cost adjustments
 * - Calculate per-person and group costs
 * - Generate assumptions and budget status
 *
 * Input: destination, numberOfPeople, numberOfDays, budgetLevel, currency, itinerary, places, seasonalMultiplier
 * Output: BudgetResult (strict schema)
 */

interface BudgetInput {
  destination: string;
  numberOfPeople: number;
  numberOfDays: number;
  budgetLevel: "low" | "medium" | "luxury";
  currency: string;
  itinerary: ItineraryResult;
  places: PlaceResult;
  seasonalMultiplier: "low" | "medium" | "high";
}

/**
 * Extract budget status from text
 */
function normalizeBudgetStatus(
  value: string
): "within" | "slightly_above" | "over" {
  const lower = value.toLowerCase();
  if (lower.includes("over") || lower.includes("exceed")) return "over";
  if (
    lower.includes("slightly") ||
    lower.includes("above") ||
    lower.includes("higher")
  )
    return "slightly_above";
  return "within";
}

async function generateBudgetPrompt(input: BudgetInput): Promise<string> {
  const hotelSample =
    input.places.hotelRecommendations[input.budgetLevel][0] ||
    input.places.hotelRecommendations.medium[0];

  return `You are a travel budget expert. Estimate trip costs. OUTPUT ONLY VALID JSON.

Trip Details:
- Destination: ${input.destination}
- Duration: ${input.numberOfDays} days
- Travelers: ${input.numberOfPeople} people
- Budget Level: ${input.budgetLevel}
- Currency: ${input.currency}
- Season: ${input.seasonalMultiplier}
- Sample hotel: ${hotelSample?.pricePerNight || "unknown"} per night

CRITICAL: Return ONLY valid JSON with this structure:
{
  "currency": "${input.currency}",
  "breakdown": {
    "flights": {"min": 300, "max": 800, "average": 550},
    "accommodation": {"min": 1500, "max": 3000, "average": 2250},
    "food": {"min": 600, "max": 1500, "average": 1050},
    "localTransport": {"min": 100, "max": 300, "average": 200},
    "activities": {"min": 200, "max": 500, "average": 350},
    "visa": {"min": 0, "max": 200, "average": 100},
    "miscellaneous": {"min": 100, "max": 300, "average": 200}
  },
  "totalEstimatedCostPerPerson": {"min": 2900, "max": 6600, "average": 4750},
  "totalEstimatedCostForGroup": {"min": 5800, "max": 13200, "average": 9500},
  "seasonalAdjustment": {
    "season": "${input.seasonalMultiplier}",
    "multiplierApplied": 1.0,
    "reason": "Reason for multiplier"
  },
  "dailyAverageCostPerPerson": 1583,
  "budgetStatus": "SINGLE: within OR slightly_above OR over",
  "assumptions": ["Assumption 1", "Assumption 2"]
}

ENUM RULES (CRITICAL):
- budgetStatus: ONLY ONE of: within, slightly_above, over
- NO descriptions, NO multiple values, JUST the enum value
- NO pipe characters (|), NO commas between enum values

For ${input.budgetLevel} budget: apply 70% (low), 100% (medium), or 150-200% (luxury) multipliers
For ${input.seasonalMultiplier} season: apply 0.7x (low), 1.0x (medium), or 1.3x (high) multipliers
Include realistic ranges and 5-7 clear assumptions.`;
}

export const budgetAgent = {
  async run(input: BudgetInput): Promise<BudgetResult> {
    const prompt = await generateBudgetPrompt(input);

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

    // Normalize enums before validation
    if (parsed.budgetStatus) {
      parsed.budgetStatus = normalizeBudgetStatus(parsed.budgetStatus);
    }

    return BudgetResultSchema.parse(parsed);
  },
};
