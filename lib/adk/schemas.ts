import { z } from "zod";

/**
 * ADK Execution Schemas
 *
 * Strict Zod schemas for LLM agent outputs.
 * Used for:
 * 1. LLM function calling validation
 * 2. Runtime type checking before storing results
 * 3. Retry logic (if schema validation fails, retry agent)
 */

// ============ WEATHER AGENT OUTPUT ============

export const WeatherResultSchema = z.object({
  currentSeason: z.string().describe("Current season at the destination"),
  bestSeasonToVisit: z
    .string()
    .describe("Best season to visit for optimal experience"),
  avoidSeason: z
    .string()
    .describe("Season to avoid due to weather/crowds/costs"),
  temperatureRange: z
    .string()
    .describe(
      "Expected temperature range during travel dates (e.g., '25-35°C')"
    ),
  seasonalImpactOnCost: z
    .enum(["low", "medium", "high"])
    .describe("How much does season affect travel costs"),
});

export type WeatherResult = z.infer<typeof WeatherResultSchema>;

// ============ PLACE AGENT OUTPUT ============

const AttractionSchema = z.object({
  name: z.string(),
  description: z.string(),
  location: z.string(),
  category: z.enum([
    "nature",
    "historical",
    "adventure",
    "cultural",
    "shopping",
    "other",
  ]),
  estimatedEntryFee: z.number().nonnegative(),
  rating: z.number().min(0).max(5),
  reviewsCount: z.number().nonnegative(),
  images: z.array(z.string().url()),
  recommendedVisitDurationHours: z.number().positive(),
  currency: z.string().length(3).optional().default("USD"),
});

const FoodItemSchema = z.object({
  name: z.string(),
  description: z.string(),
  averagePrice: z.number().nonnegative(),
  images: z.array(z.string().url()),
  topRestaurants: z.array(
    z.object({
      name: z.string(),
      location: z.string(),
      rating: z.number().min(0).max(5),
    })
  ),
  currency: z.string().length(3).optional().default("USD"),
});

const HotelSchema = z.object({
  name: z.string(),
  description: z.string(),
  location: z.string(),
  pricePerNight: z.number().positive(),
  // NO default — absence means the agent forgot to stamp it, which is caught
  // in place.agent.ts post-parse and budget.agent.ts convert() warns on it.
  currency: z.string().length(3).optional(),
  rating: z.number().min(0).max(5),
  reviewsCount: z.number().nonnegative(),
  amenities: z.array(z.string()),
  images: z.array(z.string().url()),
  bookingLink: z.string().url().optional(),
});

const AreaRecommendationSchema = z.object({
  name: z.string(),
  description: z.string(),
  suitableFor: z.enum(["budget", "family", "luxury", "nightlife", "couples"]),
});

export const PlaceResultSchema = z.object({
  attractions: z.array(AttractionSchema),
  foods: z.array(FoodItemSchema),
  recommendedAreas: z.array(AreaRecommendationSchema),
  hotelRecommendations: z.object({
    budget: z.array(HotelSchema),
    medium: z.array(HotelSchema),
    luxury: z.array(HotelSchema),
  }),
});

export type PlaceResult = z.infer<typeof PlaceResultSchema>;

// ============ ITINERARY AGENT OUTPUT ============

const ItineraryActivitySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: z.enum(["attraction", "food", "hotel", "travel", "leisure"]),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  estimatedDurationMinutes: z.number().positive(),
  location: z.object({
    name: z.string(),
    address: z.string(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }),
  estimatedCostPerPerson: z.number().nonnegative().optional(),
  relatedPlaceId: z.string().optional(),
  notes: z.string().optional(),
  // NO default — absence is detected and stamped by itinerary.agent.ts post-parse
  currency: z.string().length(3).optional(),
});

const TravelSegmentSchema = z.object({
  fromActivityId: z.string(),
  toActivityId: z.string(),
  travelMode: z.enum([
    "walk",
    "car",
    "bike",
    "public_transport",
    "flight",
  ]),
  estimatedTravelTimeMinutes: z.number().positive(),
  estimatedCost: z.number().nonnegative().optional(),
  currency: z.string().length(3).optional(),
});

const ItineraryDaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  theme: z.string(),
  weatherNote: z.string().optional(),
  activities: z.array(ItineraryActivitySchema),
  travelSegments: z.array(TravelSegmentSchema),
  mealsIncluded: z.object({
    breakfast: z.boolean().optional(),
    lunch: z.boolean().optional(),
    dinner: z.boolean().optional(),
  }),
  dailyEstimatedCostPerPerson: z.number().nonnegative(),
  currency: z.string().length(3).optional(),
});

export const ItineraryResultSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  totalDays: z.number().positive(),
  days: z.array(ItineraryDaySchema),
  totalEstimatedCostPerPerson: z.number().nonnegative(),
  // Stamped explicitly by itinerary.agent.ts — no default here
  currency: z.string().length(3).optional(),
});

export type ItineraryResult = z.infer<typeof ItineraryResultSchema>;

// ============ BUDGET AGENT OUTPUT ============

const CostEstimateSchema = z.object({
  min: z.number().nonnegative(),
  max: z.number().nonnegative(),
  average: z.number().nonnegative(),
});

const BudgetBreakdownSchema = z.object({
  flights: CostEstimateSchema,
  accommodation: CostEstimateSchema,
  food: CostEstimateSchema,
  localTransport: CostEstimateSchema,
  activities: CostEstimateSchema,
  visa: CostEstimateSchema.optional(),
  miscellaneous: CostEstimateSchema,
});

const SeasonalAdjustmentSchema = z.object({
  season: z.string(),
  multiplierApplied: z.number().positive(),
  reason: z.string(),
});

export const BudgetResultSchema = z.object({
  currency: z.string(),
  breakdown: BudgetBreakdownSchema,
  totalEstimatedCostPerPerson: CostEstimateSchema,
  totalEstimatedCostForGroup: CostEstimateSchema,
  seasonalAdjustment: SeasonalAdjustmentSchema.optional(),
  dailyAverageCostPerPerson: z.number().nonnegative(),
  budgetStatus: z.enum(["within", "slightly_above", "over"]),
  assumptions: z.array(z.string()),
});

export type BudgetResult = z.infer<typeof BudgetResultSchema>;

// ============ DERIVED METADATA ============

export const DerivedTripMetadataSchema = z.object({
  numberOfDays: z.number().positive(),
  startMonth: z.string(),
  endMonth: z.string(),
  season: z.string().optional(),
});

export type DerivedTripMetadata = z.infer<typeof DerivedTripMetadataSchema>;

// ============ TRIP INPUT ============

export const TripInputSchema = z.object({
  origin: z.string().min(1),
  destination: z.string().min(1),
  numberOfPeople: z.number().int().positive(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  budgetLevel: z.enum(["low", "medium", "luxury"]),
  currency: z.string().length(3).toUpperCase(), // ISO 4217 currency code
  tripTheme: z.array(z.string()).optional().default([]),
});

export type TripInput = z.infer<typeof TripInputSchema>;

// ============ TRIP CONTEXT (FINAL OUTPUT) ============

export const TripContextSchema = z.object({
  input: TripInputSchema,
  derived: DerivedTripMetadataSchema,
  weather: WeatherResultSchema.optional(),
  places: PlaceResultSchema.optional(),
  itinerary: ItineraryResultSchema.optional(),
  budget: BudgetResultSchema.optional(),
});

export type TripContext = z.infer<typeof TripContextSchema>;