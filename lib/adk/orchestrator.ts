import {
  TripInputSchema,
  TripContextSchema,
  DerivedTripMetadataSchema,
  WeatherResultSchema,
  PlaceResultSchema,
  ItineraryResultSchema,
  BudgetResultSchema,
  type TripInput,
  type TripContext,
} from "@/lib/adk/schemas";
import { withBatchRetry, withRetry } from "@/lib/adk/retry.wrapper";
import { RETRY_CONFIG } from "@/lib/adk/config";
import { weatherAgent } from "@/lib/agents/weather.agent";
import { placeAgent } from "@/lib/agents/place.agent";
import { itineraryAgent } from "@/lib/agents/itinerary.agent";
import { budgetAgent } from "@/lib/agents/budget.agent";

/**
 * ADK Trip Orchestrator
 *
 * Coordinates the multi-agent sequential pipeline:
 * 1. Parallel: Weather Agent + Place Agent (independent inputs)
 * 2. Sequential: Itinerary Agent (depends on weather + places)
 * 3. Sequential: Budget Agent (depends on itinerary + weather)
 *
 * Returns complete TripContext with all agent outputs.
 */

interface ExecutionMetadata {
  completedStages: string[];
  failedStages: string[];
  totalAttempts: number;
}

/**
 * Derive metadata from trip input
 * Calculates numberOfDays, startMonth, endMonth, season
 */
function deriveTripMetadata(input: TripInput): TripContext["derived"] {
  const startDate = new Date(input.startDate);
  const endDate = new Date(input.endDate);

  const timeDiff = endDate.getTime() - startDate.getTime();
  const numberOfDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1;

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const startMonth = months[startDate.getMonth()];
  const endMonth = months[endDate.getMonth()];

  // Simple season mapping (Northern Hemisphere)
  const getSeasonForMonth = (date: Date): string => {
    const month = date.getMonth();
    if (month >= 2 && month <= 4) return "Spring";
    if (month >= 5 && month <= 7) return "Summer";
    if (month >= 8 && month <= 10) return "Autumn";
    return "Winter";
  };

  const season = getSeasonForMonth(startDate);

  return {
    numberOfDays,
    startMonth,
    endMonth,
    season,
  };
}

/**
 * Main orchestrator function
 * Executes the full multi-agent pipeline
 */
export async function runTripPipeline(input: TripInput): Promise<{
  success: boolean;
  context?: TripContext;
  error?: string;
  metadata?: ExecutionMetadata;
}> {
  console.log("[Orchestrator] Starting trip pipeline for:", input.destination);

  const metadata: ExecutionMetadata = {
    completedStages: [],
    failedStages: [],
    totalAttempts: 0,
  };

  try {
    // Validate input
    const validatedInput = TripInputSchema.parse(input);

    // Initialize context
    let context: TripContext = {
      input: validatedInput,
      derived: deriveTripMetadata(validatedInput),
    };

    console.log("[Orchestrator] Derived metadata:", context.derived);

    // ============ STAGE 1: PARALLEL (Weather + Place) ============
    console.log("[Orchestrator] Stage 1: Running Weather & Place agents in parallel...");

    const parallelResults = await withBatchRetry(
      [
        {
          name: "WeatherAgent",
          fn: () =>
            weatherAgent.run({
              destination: validatedInput.destination,
              startDate: validatedInput.startDate,
              endDate: validatedInput.endDate,
            }),
          schema: WeatherResultSchema,
        },
        {
          name: "PlaceAgent",
          fn: () =>
            placeAgent.run({
              destination: validatedInput.destination,
              numberOfPeople: validatedInput.numberOfPeople,
            }),
          schema: PlaceResultSchema,
        },
      ],
      RETRY_CONFIG
    );

    // Process parallel results
    if (parallelResults.WeatherAgent.success) {
      context.weather = parallelResults.WeatherAgent.data as TripContext["weather"];
      metadata.completedStages.push("weather");
      console.log("[Orchestrator] Weather stage completed");
    } else {
      metadata.failedStages.push("weather");
      console.error(
        "[Orchestrator] Weather stage failed:",
        parallelResults.WeatherAgent.error
      );
    }

    if (parallelResults.PlaceAgent.success) {
      context.places = parallelResults.PlaceAgent.data as TripContext["places"];
      metadata.completedStages.push("places");
      console.log("[Orchestrator] Places stage completed");
    } else {
      metadata.failedStages.push("places");
      console.error(
        "[Orchestrator] Places stage failed:",
        parallelResults.PlaceAgent.error
      );
    }

    metadata.totalAttempts +=
      parallelResults.WeatherAgent.attempts +
      parallelResults.PlaceAgent.attempts;

    // ============ STAGE 2: ITINERARY (Sequential) ============
    if (context.weather && context.places) {
      console.log("[Orchestrator] Stage 2: Running Itinerary agent...");

      const itineraryResult = await withRetry(
        () =>
          itineraryAgent.run({
            destination: validatedInput.destination,
            numberOfDays: context.derived.numberOfDays,
            numberOfPeople: validatedInput.numberOfPeople,
            startDate: validatedInput.startDate,
            endDate: validatedInput.endDate,
            weather: context.weather!,
            places: context.places!,
          }),
        ItineraryResultSchema,
        RETRY_CONFIG,
        { agentName: "ItineraryAgent" }
      );

      if (itineraryResult.success) {
        context.itinerary = itineraryResult.data as TripContext["itinerary"];
        metadata.completedStages.push("itinerary");
        console.log("[Orchestrator] Itinerary stage completed");
      } else {
        metadata.failedStages.push("itinerary");
        console.error("[Orchestrator] Itinerary stage failed:", itineraryResult.error);
      }

      metadata.totalAttempts += itineraryResult.attempts;
    } else {
      console.warn(
        "[Orchestrator] Skipping itinerary stage: weather or places data missing"
      );
      metadata.failedStages.push("itinerary");
    }

    // ============ STAGE 3: BUDGET (Sequential) ============
    if (context.itinerary && context.places) {
      console.log("[Orchestrator] Stage 3: Running Budget agent...");

      const budgetResult = await withRetry(
        () =>
          budgetAgent.run({
            destination: validatedInput.destination,
            numberOfPeople: validatedInput.numberOfPeople,
            numberOfDays: context.derived.numberOfDays,
            budgetLevel: validatedInput.budgetLevel,
            currency: validatedInput.currency,
            itinerary: context.itinerary!,
            places: context.places!,
            seasonalMultiplier: context.weather?.seasonalImpactOnCost || "medium",
          }),
        BudgetResultSchema,
        RETRY_CONFIG,
        { agentName: "BudgetAgent" }
      );

      if (budgetResult.success) {
        context.budget = budgetResult.data as TripContext["budget"];
        metadata.completedStages.push("budget");
        console.log("[Orchestrator] Budget stage completed");
      } else {
        metadata.failedStages.push("budget");
        console.error("[Orchestrator] Budget stage failed:", budgetResult.error);
      }

      metadata.totalAttempts += budgetResult.attempts;
    } else {
      console.warn(
        "[Orchestrator] Skipping budget stage: itinerary or places data missing"
      );
      metadata.failedStages.push("budget");
    }

    // ============ FINAL VALIDATION ============
    console.log("[Orchestrator] Validating final context...");
    const finalContext = TripContextSchema.parse(context);

    console.log(
      "[Orchestrator] Pipeline completed successfully. Stages:",
      metadata.completedStages
    );

    return {
      success: true,
      context: finalContext,
      metadata,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    console.error("[Orchestrator] Pipeline failed:", errorMessage);

    return {
      success: false,
      error: errorMessage,
      metadata,
    };
  }
}

/**
 * Helper to get human-readable pipeline status
 */
export function getPipelineStatus(metadata: ExecutionMetadata): string {
  const completed = metadata.completedStages.join(", ");
  const failed = metadata.failedStages.length > 0 ? metadata.failedStages.join(", ") : "none";
  return `Completed: [${completed}] | Failed: [${failed}] | Total Attempts: ${metadata.totalAttempts}`;
}
