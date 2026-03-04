import { model } from "@/lib/adk/config";
import {
  ItineraryResultSchema,
  type ItineraryResult,
  type WeatherResult,
  type PlaceResult,
} from "@/lib/adk/schemas";

/**
 * Itinerary Agent — v3
 *
 * Fixes over v2:
 *  1. sanitizeNulls() — drops travelSegments with null IDs, strips null
 *     optional fields before Zod validation (was causing Attempt 1 failure)
 *  2. Prompt trimmed to reduce token usage — descriptions shortened,
 *     example JSON made minimal (was causing JSON truncation at ~11k chars)
 *  3. maxOutputTokens should be raised to 16000 in config.ts (see note below)
 */

// ─── Types ────────────────────────────────────────────────────────────────────

interface ItineraryInput {
  origin: string;
  destination: string;
  numberOfDays: number;
  numberOfPeople: number;
  startDate: string;
  endDate: string;
  currency: string;
  weather: WeatherResult;
  places: PlaceResult;
  tripTheme?: string[];
}

// ─── Enum normalisers ─────────────────────────────────────────────────────────

function normalizeActivityType(
  value: string
): "attraction" | "food" | "hotel" | "travel" | "leisure" {
  const lower = (value ?? "").toLowerCase();
  const valid = ["attraction", "food", "hotel", "travel", "leisure"];
  return (valid.find((t) => lower.includes(t)) ?? "leisure") as any;
}

function normalizeTravelMode(
  value: string
): "walk" | "car" | "bike" | "public_transport" | "flight" {
  const lower = (value ?? "").toLowerCase();
  if (lower.includes("walk")) return "walk";
  if (lower.includes("flight") || lower.includes("fly")) return "flight";
  if (lower.includes("bike") || lower.includes("bicycle")) return "bike";
  if (lower.includes("public") || lower.includes("bus") || lower.includes("metro") || lower.includes("train")) return "public_transport";
  if (lower.includes("car") || lower.includes("taxi") || lower.includes("cab") || lower.includes("drive")) return "car";
  return "walk";
}

// ─── JSON extractor ───────────────────────────────────────────────────────────

function extractJson(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenceMatch) return fenceMatch[1].trim();

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1) return text.slice(start, end + 1).trim();

  return text.trim();
}

// ─── Null sanitizer ───────────────────────────────────────────────────────────

/**
 * Called BEFORE Zod validation.
 * - Drops travelSegments where fromActivityId or toActivityId is null/empty
 *   (LLM sometimes outputs null for the last segment of a day)
 * - Strips null optional fields (notes, relatedPlaceId) so Zod doesn't reject
 * - Ensures numeric fields are never null
 */
function sanitizeNulls(parsed: any): any {
  if (!Array.isArray(parsed.days)) return parsed;

  parsed.days = parsed.days.map((day: any) => {
    // Drop segments with null/missing IDs
    day.travelSegments = (day.travelSegments ?? []).filter(
      (s: any) =>
        s?.fromActivityId &&
        typeof s.fromActivityId === "string" &&
        s?.toActivityId &&
        typeof s.toActivityId === "string"
    );

    // Clean activity optional fields
    day.activities = (day.activities ?? []).map((a: any) => {
      const c: any = { ...a };
      if (c.notes == null) delete c.notes;
      if (c.relatedPlaceId == null) delete c.relatedPlaceId;
      if (c.estimatedCostPerPerson == null) c.estimatedCostPerPerson = 0;
      if (c.location) {
        if (c.location.latitude == null) c.location.latitude = 0;
        if (c.location.longitude == null) c.location.longitude = 0;
      }
      return c;
    });

    // Clean segment optional fields
    day.travelSegments = day.travelSegments.map((s: any) => ({
      ...s,
      estimatedCost: s.estimatedCost == null ? 0 : Number(s.estimatedCost),
    }));

    // Clean mealsIncluded nulls
    if (day.mealsIncluded) {
      const m = day.mealsIncluded;
      if (m.breakfast == null) delete m.breakfast;
      if (m.lunch == null) delete m.lunch;
      if (m.dinner == null) delete m.dinner;
    }

    return day;
  });

  return parsed;
}

// ─── Math corrector ───────────────────────────────────────────────────────────

function correctCostMath(parsed: any): any {
  if (!Array.isArray(parsed.days)) return parsed;

  let runningTotal = 0;

  parsed.days = parsed.days.map((day: any) => {
    const activityCosts = (day.activities ?? []).reduce(
      (sum: number, a: any) => sum + (Number(a.estimatedCostPerPerson) || 0),
      0
    );
    const segmentCosts = (day.travelSegments ?? []).reduce(
      (sum: number, s: any) => sum + (Number(s.estimatedCost) || 0),
      0
    );
    const dailyTotal = Math.round(activityCosts + segmentCosts);
    runningTotal += dailyTotal;
    return { ...day, dailyEstimatedCostPerPerson: dailyTotal };
  });

  parsed.totalEstimatedCostPerPerson = runningTotal;
  return parsed;
}

// ─── Activity ID enforcer ─────────────────────────────────────────────────────

function enforceUniqueActivityIds(parsed: any): any {
  if (!Array.isArray(parsed.days)) return parsed;

  const seenIds = new Set<string>();
  let counter = 1;

  parsed.days = parsed.days.map((day: any) => {
    const idMap: Record<string, string> = {};

    day.activities = (day.activities ?? []).map((activity: any) => {
      let id = activity.id;
      if (!id || seenIds.has(id)) {
        id = `activity_${counter++}`;
      }
      seenIds.add(id);
      idMap[activity.id] = id;
      return { ...activity, id };
    });

    day.travelSegments = (day.travelSegments ?? []).map((seg: any) => ({
      ...seg,
      fromActivityId: idMap[seg.fromActivityId] ?? seg.fromActivityId,
      toActivityId: idMap[seg.toActivityId] ?? seg.toActivityId,
    }));

    return day;
  });

  return parsed;
}

// ─── Prompt builder ───────────────────────────────────────────────────────────

/**
 * IMPORTANT — token budget:
 *   llama-3.1-8b-instant context = 128k tokens, but maxOutputTokens in
 *   config.ts is set to 8000 which is NOT enough for a 7-day itinerary.
 *
 *   In lib/adk/config.ts, change:
 *     maxOutputTokens: 8000  →  maxOutputTokens: 16000
 *
 *   This prompt is kept lean (no verbose example JSON) to leave headroom
 *   for the actual content.
 */
function generateItineraryPrompt(input: ItineraryInput): string {
  // Keep attraction list concise to save prompt tokens
  const attractionsList = input.places.attractions
    .map((a) => `${a.name}(${a.category},${a.recommendedVisitDurationHours}h,${a.estimatedEntryFee}${input.currency})`)
    .join("|");

  const foodsList = input.places.foods
    .map((f) => `${f.name}(${f.averagePrice}${input.currency})`)
    .join("|");

  const areasList = input.places.recommendedAreas.map((a) => a.name).join("|");

  const themeSection =
    input.tripTheme && input.tripTheme.length > 0
      ? `\nThemes: ${input.tripTheme.join(", ")} — prioritize theme-matching attractions, note theme relevance in descriptions.`
      : "";

  const isShortTrip = input.numberOfDays <= 3;

  return `You are a travel itinerary planner. OUTPUT ONLY VALID JSON. No markdown, no code fences, no extra text.

Trip: ${input.origin} → ${input.destination} | ${input.startDate} to ${input.endDate} | ${input.numberOfDays} days | ${input.numberOfPeople} people | ${input.currency}
Season: ${input.weather.currentSeason} ${input.weather.temperatureRange}${themeSection}

Attractions: ${attractionsList}
Foods: ${foodsList}
Areas: ${areasList}

RULES:
- Day 1 (${input.startDate}): Start with airport arrival + hotel check-in. Then ${isShortTrip ? "2-3 activities (short trip)" : "1-2 light activities"}.
- Last day (${input.endDate}): End with checkout + airport transfer. Before that: ${isShortTrip ? "2-3 activities" : "1-2 morning activities"}.
- Middle days: min 3 activities (ideally 4), at least 1 meal + 2 attractions.
- Every day must have ≥2 activities.
- Activity IDs globally unique across all days: activity_1, activity_2, activity_3...
- travelSegments only reference IDs from the SAME day.
- NEVER output null for fromActivityId or toActivityId — omit the segment instead.
- All costs in ${input.currency}. estimatedCostPerPerson = real price (0 only if free).
- travelSegment estimatedCost = realistic local fare (0 only for walking).
- dailyEstimatedCostPerPerson = sum of activity costs + segment costs for that day.
- totalEstimatedCostPerPerson = sum of all daily costs.

JSON SCHEMA (return exactly this structure for all ${input.numberOfDays} days):
{
  "startDate": "${input.startDate}",
  "endDate": "${input.endDate}",
  "totalDays": ${input.numberOfDays},
  "days": [{
    "date": "YYYY-MM-DD",
    "theme": "string",
    "weatherNote": "string",
    "activities": [{
      "id": "activity_N",
      "name": "string",
      "description": "string",
      "type": "attraction|food|hotel|travel|leisure",
      "startTime": "HH:MM",
      "endTime": "HH:MM",
      "estimatedDurationMinutes": 90,
      "location": {"name": "string", "address": "string", "latitude": 0.0, "longitude": 0.0},
      "estimatedCostPerPerson": 0,
      "notes": "string"
    }],
    "travelSegments": [{
      "fromActivityId": "activity_N",
      "toActivityId": "activity_M",
      "travelMode": "walk|car|bike|public_transport|flight",
      "estimatedTravelTimeMinutes": 20,
      "estimatedCost": 0
    }],
    "mealsIncluded": {"breakfast": true, "lunch": true, "dinner": false},
    "dailyEstimatedCostPerPerson": 0
  }],
  "totalEstimatedCostPerPerson": 0
}`;
}

// ─── Agent ────────────────────────────────────────────────────────────────────

export const itineraryAgent = {
  async run(input: ItineraryInput): Promise<ItineraryResult> {
    const prompt = generateItineraryPrompt(input);
    const response = await model.generateContent(prompt);
    const text = response.response.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    const jsonStr = extractJson(text);
    let parsed = JSON.parse(jsonStr);

    // Normalise enums
    if (Array.isArray(parsed.days)) {
      parsed.days = parsed.days.map((day: any) => ({
        ...day,
        activities: (day.activities ?? []).map((a: any) => ({
          ...a,
          type: normalizeActivityType(a.type ?? ""),
        })),
        travelSegments: (day.travelSegments ?? []).map((s: any) => ({
          ...s,
          travelMode: normalizeTravelMode(s.travelMode ?? ""),
        })),
      }));
    }

    // Sanitize nulls BEFORE ID enforcement and Zod validation
    parsed = sanitizeNulls(parsed);

    // Enforce unique IDs
    parsed = enforceUniqueActivityIds(parsed);

    // Recalculate costs
    parsed = correctCostMath(parsed);

    return ItineraryResultSchema.parse(parsed);
  },
};