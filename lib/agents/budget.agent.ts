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
  origin: string;
  destination: string;
  numberOfPeople: number;
  numberOfDays: number;
  budgetLevel: "low" | "medium" | "luxury";
  currency: string;
  tripTheme?: string[];
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
  const nightsCount = input.numberOfDays - 1;
  const accommodationBase = hotelSample?.pricePerNight ?? 0;
  const accommodationTotal = accommodationBase * nightsCount;

  const themeSection = input.tripTheme && input.tripTheme.length > 0
    ? `\n- Trip Themes: ${input.tripTheme.join(", ")} — factor in theme-specific costs (e.g., adventure = equipment rental & guided tours; cultural = museum fees & guide costs; relaxation = spa & wellness upgrades)`
    : "";

  return `You are a travel budget expert. Estimate detailed, realistic trip costs. OUTPUT ONLY VALID JSON — no markdown, no code fences, no extra text.

Trip Details:
- Origin: ${input.origin}
- Destination: ${input.destination}
- Duration: ${input.numberOfDays} days, ${nightsCount} nights
- Travelers: ${input.numberOfPeople} people
- Budget Level: ${input.budgetLevel}
- Currency: ${input.currency}
- Season Impact on Cost: ${input.seasonalMultiplier}${themeSection}

Known Costs (use these as anchors):
- ${input.budgetLevel} hotel rate: ${accommodationBase} ${input.currency}/night × ${nightsCount} nights = ${accommodationTotal} ${input.currency} accommodation total per person
- Itinerary activities total per person: ${input.itinerary.totalEstimatedCostPerPerson} ${input.currency}

Flight Estimation: Research realistic round-trip airfare from ${input.origin} to ${input.destination} in ${input.currency}. Use budget/economy class for "low", economy for "medium", business class for "luxury".

Budget Multipliers to apply:
- low budget: 60-75% of standard rates
- medium budget: 90-110% of standard rates
- luxury budget: 180-250% of standard rates
- low season: × 0.7  |  medium season: × 1.0  |  high season: × 1.3

Return ONLY this exact JSON structure:
{
  "currency": "${input.currency}",
  "breakdown": {
    "flights": {"min": 0, "max": 0, "average": 0},
    "accommodation": {"min": 0, "max": 0, "average": 0},
    "food": {"min": 0, "max": 0, "average": 0},
    "localTransport": {"min": 0, "max": 0, "average": 0},
    "activities": {"min": 0, "max": 0, "average": 0},
    "visa": {"min": 0, "max": 0, "average": 0},
    "miscellaneous": {"min": 0, "max": 0, "average": 0}
  },
  "totalEstimatedCostPerPerson": {"min": 0, "max": 0, "average": 0},
  "totalEstimatedCostForGroup": {"min": 0, "max": 0, "average": 0},
  "seasonalAdjustment": {
    "season": "${input.seasonalMultiplier}",
    "multiplierApplied": 1.0,
    "reason": "Specific reason for the multiplier applied"
  },
  "dailyAverageCostPerPerson": 0,
  "budgetStatus": "within",
  "assumptions": [
    "Round-trip flights from ${input.origin} to ${input.destination} at ${input.budgetLevel} class",
    "Accommodation: ${nightsCount} nights at ${accommodationBase} ${input.currency}/night (${input.budgetLevel} tier)",
    "More specific assumptions..."
  ]
}

STRICT RULES:
- budgetStatus MUST be exactly one of: within, slightly_above, over
- ALL numeric fields must have realistic non-zero values in ${input.currency}
- totalEstimatedCostForGroup.average = totalEstimatedCostPerPerson.average × ${input.numberOfPeople}
- dailyAverageCostPerPerson = totalEstimatedCostPerPerson.average ÷ ${input.numberOfDays}
- Include 5-8 specific assumptions referencing origin, destination, budget tier, season, and group size`;
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
