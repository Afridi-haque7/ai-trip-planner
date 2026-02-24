import { model } from "@/lib/adk/config";
import { PlaceResultSchema, type PlaceResult } from "@/lib/adk/schemas";

/**
 * Place Agent
 *
 * Responsibilities:
 * - Generate list of top attractions
 * - Identify must-try local dishes
 * - Recommend areas/neighborhoods to stay
 * - Provide hotel options across budget tiers
 *
 * Input: destination, numberOfPeople
 * Output: PlaceResult (strict schema)
 */

interface PlaceInput {
  destination: string;
  numberOfPeople: number;
}

/**
 * Extract first valid category from comma/pipe-separated or complex text
 */
function normalizeCategory(
  value: string
): "nature" | "historical" | "adventure" | "cultural" | "shopping" | "other" {
  const lower = value.toLowerCase();
  const validCategories = [
    "nature",
    "historical",
    "adventure",
    "cultural",
    "shopping",
    "other",
  ];

  for (const cat of validCategories) {
    if (lower.includes(cat)) return cat as any;
  }

  return "other";
}

/**
 * Extract first valid suitableFor from comma/pipe-separated or complex text
 */
function normalizeSuitableFor(
  value: string
): "budget" | "family" | "luxury" | "nightlife" | "couples" {
  const lower = value.toLowerCase();
  const validOptions = [
    "budget",
    "family",
    "luxury",
    "nightlife",
    "couples",
  ];

  for (const opt of validOptions) {
    if (lower.includes(opt)) return opt as any;
  }

  return "family";
}

async function generatePlacePrompt(input: PlaceInput): Promise<string> {
  return `You are a travel destination expert. Provide comprehensive place recommendations. OUTPUT ONLY VALID JSON.

Destination: ${input.destination}
Travelers: ${input.numberOfPeople}

CRITICAL: Return ONLY this JSON structure with NO extra text:
{
  "attractions": [
    {
      "name": "Attraction name",
      "description": "Brief description",
      "location": "City/area",
      "category": "SINGLE VALUE: nature OR historical OR adventure OR cultural OR shopping OR other",
      "estimatedEntryFee": 20,
      "rating": 4.5,
      "reviewsCount": 1000,
      "images": ["url1", "url2"],
      "recommendedVisitDurationHours": 2
    }
  ],
  "foods": [
    {
      "name": "Dish name",
      "description": "Brief",
      "averagePrice": 10,
      "images": ["url"],
      "topRestaurants": [
        {
          "name": "Restaurant",
          "location": "Location",
          "rating": 4.5
        }
      ]
    }
  ],
  "recommendedAreas": [
    {
      "name": "Area",
      "description": "Why good",
      "suitableFor": "SINGLE VALUE: budget OR family OR luxury OR nightlife OR couples"
    }
  ],
  "hotelRecommendations": {
    "budget": [
      {"name": "H1", "description": "D", "location": "Area", "pricePerNight": 50, "rating": 4.0, "reviewsCount": 500, "amenities": ["WiFi"], "images": ["url1"]},
      {"name": "H2", "description": "D", "location": "Area", "pricePerNight": 55, "rating": 4.1, "reviewsCount": 450, "amenities": ["WiFi"], "images": ["url1"]},
      {"name": "H3", "description": "D", "location": "Area", "pricePerNight": 48, "rating": 3.9, "reviewsCount": 380, "amenities": ["WiFi"], "images": ["url1"]}
    ],
    "medium": [
      {"name": "M1", "description": "D", "location": "Area", "pricePerNight": 120, "rating": 4.5, "reviewsCount": 800, "amenities": ["WiFi", "Pool"], "images": ["url1"]},
      {"name": "M2", "description": "D", "location": "Area", "pricePerNight": 130, "rating": 4.4, "reviewsCount": 750, "amenities": ["WiFi", "Pool"], "images": ["url1"]},
      {"name": "M3", "description": "D", "location": "Area", "pricePerNight": 115, "rating": 4.3, "reviewsCount": 680, "amenities": ["WiFi"], "images": ["url1"]}
    ],
    "luxury": [
      {"name": "L1", "description": "D", "location": "Area", "pricePerNight": 300, "rating": 4.8, "reviewsCount": 1200, "amenities": ["Pool", "Spa"], "images": ["url1"]},
      {"name": "L2", "description": "D", "location": "Area", "pricePerNight": 320, "rating": 4.9, "reviewsCount": 1500, "amenities": ["Pool", "Spa"], "images": ["url1"]},
      {"name": "L3", "description": "D", "location": "Area", "pricePerNight": 280, "rating": 4.7, "reviewsCount": 1100, "amenities": ["WiFi"], "images": ["url1"]}
    ]
  }
}

ENUM RULES (CRITICAL):
- category: ONLY ONE of: nature, historical, adventure, cultural, shopping, other
- suitableFor: ONLY ONE of: budget, family, luxury, nightlife, couples
- NO pipe characters (|), NO commas between values, NO descriptions for enum fields
- HOTEL LOCATION: Must be a string (neighborhood/area name), NOT an object with lat/long

Include 5+ attractions, 3-5 dishes, 3-5 areas, 2-3 hotels per tier with location, pricePerNight, rating, reviewsCount, amenities, images.`;
}

export const placeAgent = {
  async run(input: PlaceInput): Promise<PlaceResult> {
    const prompt = await generatePlacePrompt(input);

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
    if (parsed.attractions && Array.isArray(parsed.attractions)) {
      parsed.attractions = parsed.attractions.map((attr: any) => ({
        ...attr,
        category: normalizeCategory(attr.category),
      }));
    }

    if (parsed.recommendedAreas && Array.isArray(parsed.recommendedAreas)) {
      parsed.recommendedAreas = parsed.recommendedAreas.map((area: any) => ({
        ...area,
        suitableFor: normalizeSuitableFor(area.suitableFor),
      }));
    }

    return PlaceResultSchema.parse(parsed);
  },
};
