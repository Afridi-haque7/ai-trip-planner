import { model } from "@/lib/adk/config";
import { PlaceResultSchema, type PlaceResult } from "@/lib/adk/schemas";
import { getMultipleImageUrls, getImageUrl } from "@/lib/tools/image.tool";

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
      "recommendedVisitDurationHours": 2
    }
  ],
  "foods": [
    {
      "name": "Dish name",
      "description": "Brief",
      "averagePrice": 10,
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
      {"name": "H1", "description": "D", "location": "Area", "pricePerNight": 50, "rating": 4.0, "reviewsCount": 500, "amenities": ["WiFi"]},
      {"name": "H2", "description": "D", "location": "Area", "pricePerNight": 55, "rating": 4.1, "reviewsCount": 450, "amenities": ["WiFi"]},
      {"name": "H3", "description": "D", "location": "Area", "pricePerNight": 48, "rating": 3.9, "reviewsCount": 380, "amenities": ["WiFi"]}
    ],
    "medium": [
      {"name": "M1", "description": "D", "location": "Area", "pricePerNight": 120, "rating": 4.5, "reviewsCount": 800, "amenities": ["WiFi", "Pool"]},
      {"name": "M2", "description": "D", "location": "Area", "pricePerNight": 130, "rating": 4.4, "reviewsCount": 750, "amenities": ["WiFi", "Pool"]},
      {"name": "M3", "description": "D", "location": "Area", "pricePerNight": 115, "rating": 4.3, "reviewsCount": 680, "amenities": ["WiFi"]}
    ],
    "luxury": [
      {"name": "L1", "description": "D", "location": "Area", "pricePerNight": 300, "rating": 4.8, "reviewsCount": 1200, "amenities": ["Pool", "Spa"]},
      {"name": "L2", "description": "D", "location": "Area", "pricePerNight": 320, "rating": 4.9, "reviewsCount": 1500, "amenities": ["Pool", "Spa"]},
      {"name": "L3", "description": "D", "location": "Area", "pricePerNight": 280, "rating": 4.7, "reviewsCount": 1100, "amenities": ["WiFi"]}
    ]
  }
}

ENUM RULES (CRITICAL):
- category: ONLY ONE of: nature, historical, adventure, cultural, shopping, other
- suitableFor: ONLY ONE of: budget, family, luxury, nightlife, couples
- NO pipe characters (|), NO commas between values, NO descriptions for enum fields
- HOTEL LOCATION: Must be a string (neighborhood/area name), NOT an object with lat/long

Include 5+ attractions, 3-5 dishes, 3-5 areas, 2-3 hotels per tier with location, pricePerNight, rating, reviewsCount, amenities.

NOTE: Do NOT include images in your response. Images will be fetched separately using image search.`;
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

    // Fetch real images for attractions, foods, and hotels
    console.log("[Place Agent] Fetching real images for attractions, foods, and hotels...");

    // Fetch images for attractions
    if (parsed.attractions && Array.isArray(parsed.attractions)) {
      for (const attraction of parsed.attractions) {
        try {
          const imageUrls = await getMultipleImageUrls(
            `${attraction.name} ${input.destination} ${attraction.category}`,
            1,
            "attraction"
          );
          attraction.images = imageUrls;
        } catch (error) {
          console.warn(
            `[Place Agent] Failed to fetch images for ${attraction.name}:`,
            error
          );
          attraction.images = [
            `https://via.placeholder.com/400x300?text=${encodeURIComponent(attraction.name)}`,
          ];
        }
      }
    }

    // Fetch images for foods
    if (parsed.foods && Array.isArray(parsed.foods)) {
      for (const food of parsed.foods) {
        try {
          const imageUrls = await getMultipleImageUrls(
            `${food.name} ${input.destination} food`,
            1,
            "food"
          );
          food.images = imageUrls;
        } catch (error) {
          console.warn(
            `[Place Agent] Failed to fetch images for food ${food.name}:`,
            error
          );
          food.images = [
            `https://via.placeholder.com/400x300?text=${encodeURIComponent(food.name)}`,
          ];
        }
      }
    }

    // Fetch images for hotels (all tiers)
    if (parsed.hotelRecommendations) {
      for (const tierKey of ["budget", "medium", "luxury"]) {
        const tier = parsed.hotelRecommendations[tierKey as keyof typeof parsed.hotelRecommendations];
        if (tier && Array.isArray(tier)) {
          for (const hotel of tier) {
            try {
              const imageUrls = await getMultipleImageUrls(
                `${hotel.name} ${input.destination} hotel`,
                1,
                "hotel"
              );
              hotel.images = imageUrls;
            } catch (error) {
              console.warn(
                `[Place Agent] Failed to fetch images for hotel ${hotel.name}:`,
                error
              );
              hotel.images = [
                `https://via.placeholder.com/400x300?text=${encodeURIComponent(hotel.name)}`,
              ];
            }
          }
        }
      }
    }

    return PlaceResultSchema.parse(parsed);
  },
};
