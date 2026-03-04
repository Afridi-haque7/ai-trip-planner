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
  origin: string;
  destination: string;
  numberOfPeople: number;
  tripTheme?: string[];
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
  const themeSection = input.tripTheme && input.tripTheme.length > 0
    ? `\nTrip Themes: ${input.tripTheme.join(", ")}\nPRIORITIZATION: Rank ALL recommendations (attractions, foods, areas, hotels) by relevance to the selected themes. Theme-matching items must appear first in each array. In each description, highlight why the item suits the chosen theme(s).`
    : "";

  return `You are a travel destination expert. Provide comprehensive, realistic place recommendations. OUTPUT ONLY VALID JSON — no markdown, no code fences, no extra text.

Origin: ${input.origin}
Destination: ${input.destination}
Travelers: ${input.numberOfPeople} people${themeSection}

Context: Traveler is coming from ${input.origin}. Factor in the origin when recommending areas (e.g., note transport hubs, arrival points, areas convenient from the main airport/station).

Return ONLY this exact JSON structure with NO extra text:
{
  "attractions": [
    {
      "name": "Real attraction name",
      "description": "Engaging 1-2 sentence description highlighting why it is worth visiting",
      "location": "Specific neighborhood or area within the destination",
      "category": "nature",
      "estimatedEntryFee": 20,
      "rating": 4.5,
      "reviewsCount": 1000,
      "recommendedVisitDurationHours": 2
    }
  ],
  "foods": [
    {
      "name": "Real local dish name",
      "description": "What makes this dish special and where to best experience it",
      "averagePrice": 10,
      "topRestaurants": [
        {
          "name": "Real restaurant name",
          "location": "Specific area or street",
          "rating": 4.5
        }
      ]
    }
  ],
  "recommendedAreas": [
    {
      "name": "Area name",
      "description": "Why this area is recommended, what it offers travelers",
      "suitableFor": "budget"
    }
  ],
  "hotelRecommendations": {
    "budget": [
      {"name": "Real hotel name", "description": "Brief accurate description", "location": "Neighborhood name", "pricePerNight": 50, "rating": 4.0, "reviewsCount": 500, "amenities": ["WiFi"]},
      {"name": "Real hotel name", "description": "Brief accurate description", "location": "Neighborhood name", "pricePerNight": 55, "rating": 4.1, "reviewsCount": 450, "amenities": ["WiFi"]},
      {"name": "Real hotel name", "description": "Brief accurate description", "location": "Neighborhood name", "pricePerNight": 48, "rating": 3.9, "reviewsCount": 380, "amenities": ["WiFi"]}
    ],
    "medium": [
      {"name": "Real hotel name", "description": "Brief accurate description", "location": "Neighborhood name", "pricePerNight": 120, "rating": 4.5, "reviewsCount": 800, "amenities": ["WiFi", "Pool"]},
      {"name": "Real hotel name", "description": "Brief accurate description", "location": "Neighborhood name", "pricePerNight": 130, "rating": 4.4, "reviewsCount": 750, "amenities": ["WiFi", "Pool"]},
      {"name": "Real hotel name", "description": "Brief accurate description", "location": "Neighborhood name", "pricePerNight": 115, "rating": 4.3, "reviewsCount": 680, "amenities": ["WiFi"]}
    ],
    "luxury": [
      {"name": "Real hotel name", "description": "Brief accurate description", "location": "Neighborhood name", "pricePerNight": 300, "rating": 4.8, "reviewsCount": 1200, "amenities": ["Pool", "Spa"]},
      {"name": "Real hotel name", "description": "Brief accurate description", "location": "Neighborhood name", "pricePerNight": 320, "rating": 4.9, "reviewsCount": 1500, "amenities": ["Pool", "Spa"]},
      {"name": "Real hotel name", "description": "Brief accurate description", "location": "Neighborhood name", "pricePerNight": 280, "rating": 4.7, "reviewsCount": 1100, "amenities": ["WiFi"]}
    ]
  }
}

STRICT RULES:
- category MUST be exactly one of: nature, historical, adventure, cultural, shopping, other
- suitableFor MUST be exactly one of: budget, family, luxury, nightlife, couples
- hotel location MUST be a plain string (area name), NEVER an object or coordinates
- Include 6-8 real attractions, 4-6 real local dishes, 3-5 areas, exactly 3 hotels per tier
- Use realistic local prices — reflect actual costs in the destination's currency context
- Do NOT include images — they are fetched separately`;
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
