/*
 * This file defines the TypeScript interfaces for the trip planning application.
 */

// Defines the structure of the input data for trip planning
export interface TripInput {
  destination: string;
  numberOfPeople: number;
  startDate: string; // ISO format (YYYY-MM-DD)
  endDate: string; // ISO format (YYYY-MM-DD)
  budgetLevel: "low" | "medium" | "luxury";
  currency: string;
}

// Defines the structure of the weather information for the destination
export interface WeatherResult {
  currentSeason: string;
  bestSeasonToVisit: string;
  avoidSeason: string;
  temperatureRange: string;
  seasonalImpactOnCost: "low" | "medium" | "high";
}

export interface Attraction {
  name: string;
  description: string;
  location: string;
  category:
    | "nature"
    | "historical"
    | "adventure"
    | "cultural"
    | "shopping"
    | "other";
  estimatedEntryFee: number;
  rating: number;
  reviewsCount: number;
  images: string[];
  recommendedVisitDurationHours: number;
}

export interface FoodItem {
  name: string;
  description: string;
  averagePrice: number;
  images: string[];
  topRestaurants: {
    name: string;
    location: string;
    rating: number;
  }[];
}

export interface Hotel {
  name: string;
  description: string;
  location: string;
  pricePerNight: number;
  rating: number;
  reviewsCount: number;
  amenities: string[];
  images: string[];
  bookingLink?: string;
}

export interface AreaRecommendation {
  name: string;
  description: string;
  suitableFor: "budget" | "family" | "luxury" | "nightlife" | "couples";
}

// Defines the structure of the place recommendations for the destination
export interface PlaceResult {
  attractions: Attraction[];
  foods: FoodItem[];
  recommendedAreas: AreaRecommendation[];
  hotelRecommendations: {
    budget: Hotel[];
    medium: Hotel[];
    luxury: Hotel[];
  };
}

export interface ItineraryActivity {
  id: string;
  name: string;
  description: string;

  type: "attraction" | "food" | "hotel" | "travel" | "leisure";

  startTime: string; // "09:00"
  endTime: string; // "11:30"
  estimatedDurationMinutes: number;

  location: {
    name: string;
    address: string;
    latitude?: number;
    longitude?: number;
  };

  estimatedCostPerPerson?: number;

  relatedPlaceId?: string; // reference to Attraction/Hotel/Food object
  notes?: string;
}

export interface TravelSegment {
  fromActivityId: string;
  toActivityId: string;
  travelMode: "walk" | "car" | "bike" | "public_transport" | "flight";
  estimatedTravelTimeMinutes: number;
  estimatedCost?: number;
}

export interface StayInfo {
  hotelId: string;
  checkInDate: string;
  checkOutDate: string;
  pricePerNight: number;
}

export interface ItineraryDay {
  date: string; // "2026-05-12"
  theme: string;
  weatherNote?: string;

  activities: ItineraryActivity[];
  travelSegments: TravelSegment[];

  mealsIncluded: {
    breakfast?: boolean;
    lunch?: boolean;
    dinner?: boolean;
  };

  dailyEstimatedCostPerPerson: number;
}

export interface ItineraryResult {
  startDate: string;
  endDate: string;
  totalDays: number;

  days: ItineraryDay[];

  totalEstimatedCostPerPerson: number;
}

export interface CostEstimate {
  min: number;
  max: number;
  average: number;
}

export interface BudgetBreakdown {
  flights: CostEstimate;
  accommodation: CostEstimate;
  food: CostEstimate;
  localTransport: CostEstimate;
  activities: CostEstimate;
  visa: CostEstimate;
  miscellaneous: CostEstimate;
}

export interface SeasonalAdjustment {
  season: string;
  multiplierApplied: number;
  reason: string;
}

export interface BudgetResult {
  currency: string;

  breakdown: BudgetBreakdown;

  totalEstimatedCostPerPerson: CostEstimate;
  totalEstimatedCostForGroup: CostEstimate;

  seasonalAdjustment?: SeasonalAdjustment;

  dailyAverageCostPerPerson: number;

  budgetStatus: "within" | "slightly_above" | "over";

  assumptions: string[];
}

export interface DerivedTripMetadata {
  numberOfDays: number;
  startMonth: string;
  endMonth: string;
  season?: string;
}

export interface TripContext {
  input: TripInput;
  derived: DerivedTripMetadata;

  weather?: WeatherResult;
  places?: PlaceResult;
  itinerary?: ItineraryResult;
  budget?: BudgetResult;
}
