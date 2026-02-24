import { runTripPipeline, getPipelineStatus } from "@/lib/adk/orchestrator";
import { TripInputSchema } from "@/lib/adk/schemas";
import dbConnect from "@/lib/dbConnect";

/**
 * POST /api/generate-trip
 *
 * Generates a complete trip plan using the multi-agent ADK pipeline.
 *
 * Request body:
 * {
 *   destination: string,
 *   numberOfPeople: number,
 *   startDate: string (YYYY-MM-DD),
 *   endDate: string (YYYY-MM-DD),
 *   budgetLevel: "low" | "medium" | "luxury",
 *   currency: string (ISO 4217 code, e.g., "USD")
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   context?: TripContext,
 *   error?: string,
 *   metadata?: ExecutionMetadata
 * }
 */

export async function POST(request) {
  try {
    const body = await request.json();

    // Validate request body
    if (!body || typeof body !== "object") {
      return Response.json(
        { success: false, error: "Invalid request body" },
        { status: 400 }
      );
    }

    // Parse and validate input against schema
    let tripInput;
    try {
      tripInput = TripInputSchema.parse({
        destination: body.destination,
        numberOfPeople: body.numberOfPeople,
        startDate: body.startDate,
        endDate: body.endDate,
        budgetLevel: body.budgetLevel,
        currency: body.currency,
      });
    } catch (validationError) {
      const errors = validationError.errors
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join(", ");

      console.error("[API] Input validation failed:", errors);

      return Response.json(
        {
          success: false,
          error: "Invalid input",
          details: errors,
        },
        { status: 400 }
      );
    }

    console.log("[API] Generate trip request:", {
      destination: tripInput.destination,
      numberOfPeople: tripInput.numberOfPeople,
      duration: `${tripInput.startDate} to ${tripInput.endDate}`,
      budget: tripInput.budgetLevel,
      currency: tripInput.currency,
    });

    // Run the orchestrator pipeline
    const result = await runTripPipeline(tripInput);

    if (!result.success) {
      console.error("[API] Pipeline failed:", result.error);

      return Response.json(
        {
          success: false,
          error: result.error || "Failed to generate trip",
          pipelineStatus: getPipelineStatus(result.metadata || {}),
        },
        { status: 500 }
      );
    }

    console.log(
      "[API] Pipeline succeeded:",
      getPipelineStatus(result.metadata || {})
    );

    // Return successful result
    return Response.json(
      {
        success: true,
        context: result.context,
        metadata: result.metadata,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);

    console.error("[API] Unexpected error:", errorMessage);

    return Response.json(
      {
        success: false,
        error: "Internal server error",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
