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
  origin: string;
  destination: string;
  numberOfDays: number;
  numberOfPeople: number;
  startDate: string; // ISO format
  endDate: string; // ISO format
  weather: WeatherResult;
  places: PlaceResult;
  tripTheme?: string[];
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
  const attractionsList = input.places.attractions
    .map((a) => `${a.name} (${a.category}, ~${a.recommendedVisitDurationHours}h, fee: ${a.estimatedEntryFee})`)
    .join(", ");
  const foodsList = input.places.foods.map((f) => f.name).join(", ");
  const areasList = input.places.recommendedAreas.map((a) => a.name).join(", ");

  const themeSection = input.tripTheme && input.tripTheme.length > 0
    ? `\nTrip Themes: ${input.tripTheme.join(", ")}\nTHEME INSTRUCTIONS:\n- Each day theme must reflect the trip themes\n- Prioritize attractions from the list that match the selected themes\n- In every activity description, explicitly note how it connects to the trip theme(s)\n- Structure days so theme-relevant experiences get prime time slots`
    : "";

  return `You are an expert travel itinerary planner. Create a detailed, realistic day-by-day itinerary. OUTPUT ONLY VALID JSON — no markdown, no code fences, no extra text.

Trip Details:
- Origin: ${input.origin}
- Destination: ${input.destination}
- Start Date: ${input.startDate}
- End Date: ${input.endDate}
- Total Days: ${input.numberOfDays}
- Travelers: ${input.numberOfPeople} ${input.numberOfPeople === 1 ? "person" : "people"}
- Season at Destination: ${input.weather.currentSeason} (${input.weather.temperatureRange})
- Weather Note: ${input.weather.bestSeasonToVisit} is best season; ${input.weather.avoidSeason} is worst${themeSection}

Available Attractions: ${attractionsList}
Local Foods to Experience: ${foodsList}
Recommended Areas: ${areasList}

DAY PLANNING RULES (follow strictly):
1. Day 1 (${input.startDate}): Arrival day from ${input.origin}. First activity = airport/station arrival & hotel check-in.
   - SHORT TRIP (${input.numberOfDays} <= 3 days): Add 2-3 real activities after check-in — every hour counts on a short trip.
   - LONGER TRIP (${input.numberOfDays} > 3 days): Keep it light, 1-2 activities after check-in since travelers need to settle in.
2. Last Day (${input.endDate}): Departure day back to ${input.origin}. End with hotel checkout & airport/station transfer.
   - SHORT TRIP (${input.numberOfDays} <= 3 days): Add 2-3 activities before departure — maximize the limited time.
   - LONGER TRIP (${input.numberOfDays} > 3 days): 1-2 light morning activities before heading to the airport/station.
3. Middle Days: MINIMUM 3 activities per day, ideally 4. Include at least 1 meal/food activity and 2 distinct attractions each day.
4. ABSOLUTE MINIMUM: Every single day MUST have at least 2 activities. A day with 0 or 1 activity is INVALID and will be rejected.
5. Space activities realistically — respect travel time between locations and recommended visit durations.
6. Activity IDs must be globally unique across ALL days (activity_1, activity_2, activity_3 ... never reuse an ID).
7. travelSegments reference activity IDs within the SAME day only.
8. Use accurate GPS coordinates for all locations at the destination.
9. COST ACCURACY — estimatedCostPerPerson for each activity MUST reflect the real entry fee, ticket price, or average meal cost. Use 0 ONLY if genuinely free.
10. TRAVEL COST ACCURACY — travelSegments estimatedCost must be a realistic fare for that transport mode (e.g., taxi ride, auto-rickshaw, bus ticket cost). Use 0 only for walking segments.
11. dailyEstimatedCostPerPerson = sum of ALL activity estimatedCostPerPerson + sum of ALL travelSegment estimatedCost for that day.
12. totalEstimatedCostPerPerson = sum of ALL dailyEstimatedCostPerPerson values across every day.

Return ONLY this exact JSON structure:
{
  "startDate": "${input.startDate}",
  "endDate": "${input.endDate}",
  "totalDays": ${input.numberOfDays},
  "days": [
    {
      "date": "YYYY-MM-DD",
      "theme": "Descriptive theme name for the day",
      "weatherNote": "Specific weather note for this day and any gear/preparation advice",
      "activities": [
        {
          "id": "activity_1",
          "name": "Activity name",
          "description": "Engaging description of the experience and why it's worthwhile",
          "type": "attraction",
          "startTime": "09:00",
          "endTime": "11:30",
          "estimatedDurationMinutes": 150,
          "location": {
            "name": "Specific venue or place name",
            "address": "Full street address at the destination",
            "latitude": 0.0000,
            "longitude": 0.0000
          },
          "estimatedCostPerPerson": 20,
          "notes": "Practical tip (best time to visit, what to bring, booking advice, etc.)"
        }
      ],
      "travelSegments": [
        {
          "fromActivityId": "activity_1",
          "toActivityId": "activity_2",
          "travelMode": "car",
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

STRICT ENUM RULES — violations will cause a parse error:
- type MUST be exactly one of: attraction, food, hotel, travel, leisure
- travelMode MUST be exactly one of: walk, car, bike, public_transport, flight
- Dates MUST be in YYYY-MM-DD format and match the trip date range
- Times MUST be in HH:MM 24-hour format`;
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
