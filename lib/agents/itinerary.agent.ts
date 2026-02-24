import { model } from "@/lib/adk/config";
import {
  ItineraryResultSchema,
  type ItineraryResult,
  type WeatherResult,
  type PlaceResult,
} from "@/lib/adk/schemas";

/**
 * Itinerary Agent
 *
 * Responsibilities:
 * - Generate day-by-day itinerary
 * - Distribute attractions intelligently
 * - Consider weather patterns and constraints
 * - Plan travel segments between activities
 * - Include meals and leisure time
 *
 * Input: destination, numberOfDays, numberOfPeople, startDate, endDate, weather, places
 * Output: ItineraryResult (strict schema)
 */

interface ItineraryInput {
  destination: string;
  numberOfDays: number;
  numberOfPeople: number;
  startDate: string; // ISO format
  endDate: string; // ISO format
  weather: WeatherResult;
  places: PlaceResult;
}

/**
 * Extract first valid activity type
 */
function normalizeActivityType(
  value: string
): "attraction" | "food" | "hotel" | "travel" | "leisure" {
  const lower = value.toLowerCase();
  const validTypes = [
    "attraction",
    "food",
    "hotel",
    "travel",
    "leisure",
  ];

  for (const type of validTypes) {
    if (lower.includes(type)) return type as any;
  }

  return "leisure";
}

/**
 * Extract first valid travel mode
 */
function normalizeTravelMode(
  value: string
): "walk" | "car" | "bike" | "public_transport" | "flight" {
  const lower = value.toLowerCase();
  if (lower.includes("walk")) return "walk";
  if (lower.includes("flight") || lower.includes("fly")) return "flight";
  if (lower.includes("bike") || lower.includes("bicycle")) return "bike";
  if (lower.includes("public") || lower.includes("bus") || lower.includes("metro")) return "public_transport";
  if (lower.includes("car") || lower.includes("taxi") || lower.includes("drive")) return "car";
  return "walk";
}

async function generateItineraryPrompt(input: ItineraryInput): Promise<string> {
  const placesSummary = `
Attractions available: ${input.places.attractions.map((a) => a.name).join(", ")}
Recommended areas: ${input.places.recommendedAreas.map((a) => a.name).join(", ")}
Key dishes to try: ${input.places.foods.map((f) => f.name).join(", ")}
  `.trim();

  return `You are an expert travel itinerary planner. Create a day-by-day itinerary. OUTPUT ONLY VALID JSON.

Destination: ${input.destination}
Duration: ${input.numberOfDays} days
Travelers: ${input.numberOfPeople}
Season: ${input.weather.currentSeason}

CRITICAL: Return ONLY valid JSON with this structure:
{
  "startDate": "2026-05-12",
  "endDate": "2026-05-14",
  "totalDays": 3,
  "days": [
    {
      "date": "2026-05-12",
      "theme": "Day theme",
      "weatherNote": "Weather impact",
      "activities": [
        {
          "id": "activity_1",
          "name": "Activity name",
          "description": "What to do",
          "type": "SINGLE: attraction OR food OR hotel OR travel OR leisure",
          "startTime": "09:00",
          "endTime": "11:30",
          "estimatedDurationMinutes": 150,
          "location": {
            "name": "Location name",
            "address": "Address",
            "latitude": 0.0,
            "longitude": 0.0
          },
          "estimatedCostPerPerson": 20,
          "notes": "Optional"
        }
      ],
      "travelSegments": [
        {
          "fromActivityId": "activity_1",
          "toActivityId": "activity_2",
          "travelMode": "SINGLE: walk OR car OR bike OR public_transport OR flight",
          "estimatedTravelTimeMinutes": 30,
          "estimatedCost": 0
        }
      ],
      "mealsIncluded": {
        "breakfast": true,
        "lunch": true,
        "dinner": false
      },
      "dailyEstimatedCostPerPerson": 100
    }
  ],
  "totalEstimatedCostPerPerson": 300
}

ENUM RULES (CRITICAL):
- type: ONLY ONE of: attraction, food, hotel, travel, leisure
- travelMode: ONLY ONE of: walk, car, bike, public_transport, flight
- NO descriptions, NO multiple values, JUST the enum value
- NO pipe characters (|), NO commas between enum values

Available Places:
${placesSummary}

Create immersive experience for ${input.numberOfPeople} ${input.numberOfPeople === 1 ? "traveler" : "travelers"}.`;
}

export const itineraryAgent = {
  async run(input: ItineraryInput): Promise<ItineraryResult> {
    const prompt = await generateItineraryPrompt(input);

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
    if (parsed.days && Array.isArray(parsed.days)) {
      parsed.days = parsed.days.map((day: any) => {
        if (day.activities && Array.isArray(day.activities)) {
          day.activities = day.activities.map((activity: any) => ({
            ...activity,
            type: normalizeActivityType(activity.type),
          }));
        }
        if (day.travelSegments && Array.isArray(day.travelSegments)) {
          day.travelSegments = day.travelSegments.map((segment: any) => ({
            ...segment,
            travelMode: normalizeTravelMode(segment.travelMode),
          }));
        }
        return day;
      });
    }

    return ItineraryResultSchema.parse(parsed);
  },
};
