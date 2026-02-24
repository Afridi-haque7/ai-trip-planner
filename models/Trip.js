import mongoose from "mongoose";

/**
 * Trip Schema - Aligned with ADK TripContext Structure
 *
 * Structure:
 * {
 *   _id: MongoDB ObjectId
 *   tripId: Unique UUID for sharing/queries
 *   userId: Reference to User
 *   input: Original user request
 *   derived: Computed metadata
 *   weather: Weather agent output
 *   places: Place agent output
 *   itinerary: Itinerary agent output
 *   budget: Budget agent output
 *   metadata: Pipeline + debug info
 *   timestamps: createdAt, updatedAt
 * }
 */

// ============ INPUT SCHEMA ============
const TripInputSchema = new mongoose.Schema(
  {
    destination: { type: String, required: true },
    numberOfPeople: { type: Number, required: true },
    startDate: { type: String, required: true }, // ISO format (YYYY-MM-DD)
    endDate: { type: String, required: true }, // ISO format (YYYY-MM-DD)
    budgetLevel: {
      type: String,
      enum: ["low", "medium", "luxury"],
      required: true,
    },
    currency: { type: String, required: true }, // ISO 4217 code (e.g., "USD", "INR")
  },
  { _id: false }
);

// ============ DERIVED METADATA SCHEMA ============
const DerivedMetadataSchema = new mongoose.Schema(
  {
    numberOfDays: { type: Number, required: true },
    startMonth: { type: String, required: true },
    endMonth: { type: String, required: true },
    season: { type: String },
  },
  { _id: false }
);

// ============ WEATHER SCHEMA ============
const WeatherSchema = new mongoose.Schema(
  {
    currentSeason: { type: String },
    bestSeasonToVisit: { type: String },
    avoidSeason: { type: String },
    temperatureRange: { type: String },
    seasonalImpactOnCost: { type: String, enum: ["low", "medium", "high"] },
  },
  { _id: false }
);

// ============ PLACE SCHEMAS ============
const AttractionSchema = new mongoose.Schema(
  {
    name: { type: String },
    description: { type: String },
    location: { type: String },
    category: {
      type: String,
      enum: ["nature", "historical", "adventure", "cultural", "shopping", "other"],
    },
    estimatedEntryFee: { type: Number, default: 0 },
    rating: { type: Number, min: 0, max: 5 },
    reviewsCount: { type: Number, default: 0 },
    images: [String],
    recommendedVisitDurationHours: { type: Number },
  },
  { _id: false }
);

const FoodItemSchema = new mongoose.Schema(
  {
    name: { type: String },
    description: { type: String },
    averagePrice: { type: Number },
    images: [String],
    topRestaurants: [
      {
        name: { type: String },
        location: { type: String },
        rating: { type: Number, min: 0, max: 5 },
        _id: false,
      },
    ],
  },
  { _id: false }
);

const HotelSchema = new mongoose.Schema(
  {
    name: { type: String },
    description: { type: String },
    location: { type: String },
    pricePerNight: { type: Number },
    rating: { type: Number, min: 0, max: 5 },
    reviewsCount: { type: Number, default: 0 },
    amenities: [String],
    images: [String],
    bookingLink: { type: String },
  },
  { _id: false }
);

const AreaRecommendationSchema = new mongoose.Schema(
  {
    name: { type: String },
    description: { type: String },
    suitableFor: {
      type: String,
      enum: ["budget", "family", "luxury", "nightlife", "couples"],
    },
  },
  { _id: false }
);

const PlaceSchema = new mongoose.Schema(
  {
    attractions: [AttractionSchema],
    foods: [FoodItemSchema],
    recommendedAreas: [AreaRecommendationSchema],
    hotelRecommendations: {
      budget: [HotelSchema],
      medium: [HotelSchema],
      luxury: [HotelSchema],
      _id: false,
    },
  },
  { _id: false }
);

// ============ ITINERARY SCHEMAS ============
const LocationSchema = new mongoose.Schema(
  {
    name: { type: String },
    address: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
  },
  { _id: false }
);

const ItineraryActivitySchema = new mongoose.Schema(
  {
    id: { type: String },
    name: { type: String },
    description: { type: String },
    type: {
      type: String,
      enum: ["attraction", "food", "hotel", "travel", "leisure"],
    },
    startTime: { type: String }, // "09:00"
    endTime: { type: String }, // "11:30"
    estimatedDurationMinutes: { type: Number },
    location: LocationSchema,
    estimatedCostPerPerson: { type: Number, default: 0 },
    relatedPlaceId: { type: String },
    notes: { type: String },
  },
  { _id: false }
);

const TravelSegmentSchema = new mongoose.Schema(
  {
    fromActivityId: { type: String },
    toActivityId: { type: String },
    travelMode: {
      type: String,
      enum: ["walk", "car", "bike", "public_transport", "flight"],
    },
    estimatedTravelTimeMinutes: { type: Number },
    estimatedCost: { type: Number, default: 0 },
  },
  { _id: false }
);

const MealsIncludedSchema = new mongoose.Schema(
  {
    breakfast: { type: Boolean, default: false },
    lunch: { type: Boolean, default: false },
    dinner: { type: Boolean, default: false },
  },
  { _id: false }
);

const ItineraryDaySchema = new mongoose.Schema(
  {
    date: { type: String }, // "2026-05-12"
    theme: { type: String },
    weatherNote: { type: String },
    activities: [ItineraryActivitySchema],
    travelSegments: [TravelSegmentSchema],
    mealsIncluded: MealsIncludedSchema,
    dailyEstimatedCostPerPerson: { type: Number, default: 0 },
  },
  { _id: false }
);

const ItinerarySchema = new mongoose.Schema(
  {
    startDate: { type: String },
    endDate: { type: String },
    totalDays: { type: Number },
    days: [ItineraryDaySchema],
    totalEstimatedCostPerPerson: { type: Number, default: 0 },
  },
  { _id: false }
);

// ============ BUDGET SCHEMAS ============
const CostEstimateSchema = new mongoose.Schema(
  {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 0 },
    average: { type: Number, default: 0 },
  },
  { _id: false }
);

const BudgetBreakdownSchema = new mongoose.Schema(
  {
    flights: CostEstimateSchema,
    accommodation: CostEstimateSchema,
    food: CostEstimateSchema,
    localTransport: CostEstimateSchema,
    activities: CostEstimateSchema,
    visa: CostEstimateSchema,
    miscellaneous: CostEstimateSchema,
  },
  { _id: false }
);

const SeasonalAdjustmentSchema = new mongoose.Schema(
  {
    season: { type: String },
    multiplierApplied: { type: Number },
    reason: { type: String },
  },
  { _id: false }
);

const BudgetSchema = new mongoose.Schema(
  {
    currency: { type: String },
    breakdown: BudgetBreakdownSchema,
    totalEstimatedCostPerPerson: CostEstimateSchema,
    totalEstimatedCostForGroup: CostEstimateSchema,
    seasonalAdjustment: SeasonalAdjustmentSchema,
    dailyAverageCostPerPerson: { type: Number, default: 0 },
    budgetStatus: {
      type: String,
      enum: ["within", "slightly_above", "over"],
    },
    assumptions: [String],
  },
  { _id: false }
);

// ============ PIPELINE METADATA ============
const PipelineMetadataSchema = new mongoose.Schema(
  {
    version: { type: String, default: "1.0" },
    source: { type: String, default: "ai-agent" },
    completedStages: [String], // ["weather", "places", "itinerary", "budget"]
    failedStages: [String], // If any stage failed
  },
  { _id: false }
);

// ============ MAIN TRIP SCHEMA ============
const TripSchema = new mongoose.Schema(
  {
    tripId: { type: String, unique: true, required: true },
    userId: { type: String, required: true }, // Reference to User._id
    input: TripInputSchema,
    derived: DerivedMetadataSchema,
    weather: WeatherSchema,
    places: PlaceSchema,
    itinerary: ItinerarySchema,
    budget: BudgetSchema,
    metadata: { type: PipelineMetadataSchema, default: () => ({}) },
  },
  {
    timestamps: true,
  }
);

// ============ INDEXES ============
TripSchema.index({ tripId: 1 }, { unique: true });
TripSchema.index({ userId: 1 });
TripSchema.index({ "input.destination": 1 });
TripSchema.index({ createdAt: -1 });
TripSchema.index({ "budget.totalEstimatedCostPerPerson.average": 1 });

const Trip = mongoose.models.Trip || mongoose.model("Trip", TripSchema);
export default Trip;