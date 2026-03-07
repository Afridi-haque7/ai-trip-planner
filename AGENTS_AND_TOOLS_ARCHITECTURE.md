# Agents & Tools Architecture

> Complete technical reference for the AI Trip Planner multi-agent pipeline.  
> Covers high-level design, agent contracts, data schemas, tools, and infrastructure.

---

## Table of Contents

1. [High-Level Design](#1-high-level-design)
2. [Pipeline Execution Flow](#2-pipeline-execution-flow)
3. [LLM & Model Configuration](#3-llm--model-configuration)
4. [Retry & Error Handling Infrastructure](#4-retry--error-handling-infrastructure)
5. [Agent Deep Dives](#5-agent-deep-dives)
   - [Weather Agent](#51-weather-agent)
   - [Place Agent](#52-place-agent)
   - [Itinerary Agent](#53-itinerary-agent)
   - [Budget Agent](#54-budget-agent)
6. [Tools Deep Dive](#6-tools-deep-dive)
   - [Image Tool](#61-image-tool)
7. [Schema Reference](#7-schema-reference)
   - [TripInput](#71-tripinput-pipeline-entry-point)
   - [WeatherResult](#72-weatherresult)
   - [PlaceResult](#73-placeresult)
   - [ItineraryResult](#74-itineraryresult)
   - [BudgetResult](#75-budgetresult)
   - [TripContext](#76-tripcontext-final-output)
8. [Orchestrator Deep Dive](#8-orchestrator-deep-dive)
9. [Data Flow Summary](#9-data-flow-summary)

---

## 1. High-Level Design

The system is a **sequential multi-agent pipeline** where each agent is a specialized LLM call that produces a strictly typed JSON output. The agents are coordinated by a central **Orchestrator** which manages execution order, data passing, and fault tolerance.

```
                        ┌──────────────────────────────────┐
                        │          Orchestrator             │
                        │      (runTripPipeline)            │
                        └──────────────┬───────────────────┘
                                       │ TripInput
                         ┌─────────────▼─────────────┐
                         │         STAGE 1            │ (Parallel)
                         │  ┌──────────┐ ┌─────────┐ │
                         │  │ Weather  │ │  Place  │ │
                         │  │  Agent   │ │  Agent  │ │
                         │  └────┬─────┘ └────┬────┘ │
                         └───────┼────────────┼──────┘
                                 │            │
                         ┌───────▼────────────▼──────┐
                         │         STAGE 2            │ (Sequential)
                         │      Itinerary Agent        │
                         │  (needs weather + places)  │
                         └──────────────┬─────────────┘
                                        │
                         ┌──────────────▼─────────────┐
                         │         STAGE 3            │ (Sequential)
                         │       Budget Agent          │
                         │  (needs itinerary + places)│
                         └──────────────┬─────────────┘
                                        │
                         ┌──────────────▼─────────────┐
                         │       TripContext            │
                         │    (Final validated output) │
                         └────────────────────────────┘
```

### Key Design Principles

| Principle | Implementation |
|---|---|
| **Schema-first** | All agent outputs validated against Zod schemas before use |
| **LLM-agnostic adaptor** | A `model` wrapper normalizes LLM responses to a common interface |
| **Retry on failure** | Zod validation failures, network errors, and JSON parse errors trigger exponential backoff retry |
| **Graceful degradation** | If Stage 1 partially fails, the pipeline continues with available data |
| **Image enrichment** | Place agent fetches real images for attractions, foods, and hotels via the Image Tool |

---

## 2. Pipeline Execution Flow

```
API Route: POST /api/generate-trip
        │
        ▼
  runTripPipeline(TripInput)
        │
        ├─► deriveTripMetadata()
        │       numberOfDays, startMonth, endMonth, season
        │
        ├─► STAGE 1 — withBatchRetry([WeatherAgent, PlaceAgent])
        │     Both run in parallel via Promise.all
        │     Each has up to 3 retry attempts
        │
        ├─► STAGE 2 — withRetry(ItineraryAgent)
        │     Only runs if both weather AND places succeeded
        │     Up to 3 retry attempts
        │
        ├─► STAGE 3 — withRetry(BudgetAgent)
        │     Only runs if both itinerary AND places succeeded
        │     Up to 3 retry attempts
        │
        └─► TripContextSchema.parse(context)  ← final full validation
                │
                ▼
          { success: true, context: TripContext, metadata }
```

### Stage Dependencies

| Stage | Agent | Requires | Skipped If |
|---|---|---|---|
| 1a | WeatherAgent | `TripInput` | — |
| 1b | PlaceAgent | `TripInput` | — |
| 2 | ItineraryAgent | `weather` + `places` | Either Stage 1 agent failed |
| 3 | BudgetAgent | `itinerary` + `places` | Stage 2 failed |

---

## 3. LLM & Model Configuration

**File:** `lib/adk/config.ts`

### Provider

| Setting | Value |
|---|---|
| Provider | **Groq** |
| Model | `llama-3.1-8b-instant` |
| Auth | `GROQ_API_KEY` (env var) |

### LLM Parameters

| Parameter | Value | Purpose |
|---|---|---|
| `temperature` | `0.7` | Balanced creativity + determinism |
| `topP` | `0.95` | Nucleus sampling |
| `maxOutputTokens` | `8000` | Sufficient for large itineraries |

### Model Adaptor Pattern

The `model` object wraps the Groq API and returns responses in a Gemini-compatible format. This means agents are **LLM-provider agnostic** — swapping the provider only requires changing `config.ts`.

```ts
// What agents call:
const response = await model.generateContent(prompt);
const text = response.response.candidates?.[0]?.content?.parts?.[0]?.text;

// What config.ts normalizes Groq into:
{
  response: {
    candidates: [{ content: { parts: [{ text: "..." }] } }]
  }
}
```

### Retry Configuration

```ts
RETRY_CONFIG = {
  maxAttempts: 3,
  initialBackoffMs: 1000,   // 1 second
  maxBackoffMs: 10000,       // 10 seconds cap
}
```

---

## 4. Retry & Error Handling Infrastructure

**File:** `lib/adk/retry.wrapper.ts`

### `withRetry<T>(agentFn, schema, config, context)`

Single agent retry with exponential backoff + jitter.

**Retryable errors:**
- `ZodError` — schema validation failed (LLM gave bad output)
- Network errors (message includes `"fetch"`)
- JSON parse errors (message includes `"JSON"`)

**Non-retryable errors:**
- Invalid API key
- Any other error type

**Backoff formula:**
```
delay = min(maxBackoff, initialBackoff × 2^attempt) + random(0–1000ms)
```

**Return type:**
```ts
{
  success: boolean;
  data?: T;           // Present only if success=true
  error?: string;     // Present only if success=false
  attempts: number;   // How many attempts were made
  lastError?: string;
}
```

### `withBatchRetry(operations[], config)`

Runs multiple agents in **parallel** via `Promise.all`, each wrapped in `withRetry`.

```ts
// Used in Stage 1:
const results = await withBatchRetry([
  { name: "WeatherAgent", fn: () => weatherAgent.run(...), schema: WeatherResultSchema },
  { name: "PlaceAgent",   fn: () => placeAgent.run(...),   schema: PlaceResultSchema },
], RETRY_CONFIG);

// Returns:
{
  WeatherAgent: { success: true, data: WeatherResult, attempts: 1 },
  PlaceAgent:   { success: true, data: PlaceResult,   attempts: 2 }
}
```

---

## 5. Agent Deep Dives

### 5.1 Weather Agent

**File:** `lib/agents/weather.agent.ts`

#### Purpose
Determines the climatic context for the trip — season, temperature, timing quality, and cost impact. Its output feeds directly into the **Itinerary Agent** and **Budget Agent**.

#### Input

```ts
interface WeatherInput {
  origin: string;           // e.g., "New Delhi, India"
  destination: string;      // e.g., "Bali, Indonesia"
  startDate: string;        // ISO: "2025-06-15"
  endDate: string;          // ISO: "2025-06-20"
}
```

#### LLM Prompt Strategy
- Provides full context including origin (for climate contrast awareness)
- Instructs the model to assess peak/shoulder/off-season for pricing context
- Demands strict JSON — no markdown, no code fences
- Enforces `seasonalImpactOnCost` must be exactly `low | medium | high`

#### Post-processing
Enum normalization via `normalizeSeasonalImpact()` — handles edge cases like "peak season" → `"high"`, "shoulder" → `"medium"`, "off-season" → `"low"`.

#### Output

```ts
// WeatherResult
{
  currentSeason: string;                         // "Monsoon"
  bestSeasonToVisit: string;                     // "April–May (Dry Season)"
  avoidSeason: string;                           // "July–August (Heavy Rains)"
  temperatureRange: string;                      // "26–34°C"
  seasonalImpactOnCost: "low" | "medium" | "high"; // Affects budget multiplier
}
```

---

### 5.2 Place Agent

**File:** `lib/agents/place.agent.ts`

#### Purpose
The most data-rich agent. Generates all POI data — attractions, local foods, recommended neighborhoods, and tiered hotel options. Also enriches results with real images via the **Image Tool**.

#### Input

```ts
interface PlaceInput {
  origin: string;            // Used for context (arrival logistics)
  destination: string;
  numberOfPeople: number;
  tripTheme?: string[];      // e.g., ["adventure", "cultural"]
}
```

#### LLM Prompt Strategy
- If `tripTheme` is provided, the prompt instructs the LLM to rank all recommendations by theme relevance and explain theme connections in descriptions
- Hotel price data is scoped to realistic local rates per destination
- Explicitly tells the LLM **not to include images** (fetched separately)
- Enforces exactly `3 hotels per tier` and `6–8 attractions`

#### Post-processing & Image Enrichment
After parsing the LLM JSON:
1. Normalizes `category` enum for each attraction via `normalizeCategory()`
2. Normalizes `suitableFor` enum for each area via `normalizeSuitableFor()`
3. For every **attraction**: calls `getMultipleImageUrls(name + destination + category, 1, "attraction")`
4. For every **food item**: calls `getMultipleImageUrls(name + destination + "food", 1, "food")`
5. For every **hotel** across all 3 tiers: calls `getMultipleImageUrls(name + destination + "hotel", 1, "hotel")`
6. Falls back to placeholder URL if image fetch fails

#### Output

```ts
// PlaceResult
{
  attractions: Attraction[];          // 6–8 items
  foods: FoodItem[];                  // 4–6 items
  recommendedAreas: AreaRecommendation[];  // 3–5 items
  hotelRecommendations: {
    budget:  Hotel[];   // exactly 3
    medium:  Hotel[];   // exactly 3
    luxury:  Hotel[];   // exactly 3
  }
}
```

#### Attraction Shape

```ts
{
  name: string;
  description: string;
  location: string;                 // Neighborhood
  category: "nature" | "historical" | "adventure" | "cultural" | "shopping" | "other";
  estimatedEntryFee: number;        // In destination's currency context
  rating: number;                   // 0–5
  reviewsCount: number;
  images: string[];                 // Populated by Image Tool
  recommendedVisitDurationHours: number;
}
```

#### FoodItem Shape

```ts
{
  name: string;
  description: string;
  averagePrice: number;
  images: string[];                 // Populated by Image Tool
  topRestaurants: {
    name: string;
    location: string;
    rating: number;                 // 0–5
  }[];
}
```

#### Hotel Shape

```ts
{
  name: string;
  description: string;
  location: string;                 // Plain string, neighborhood name
  pricePerNight: number;
  rating: number;                   // 0–5
  reviewsCount: number;
  amenities: string[];
  images: string[];                 // Populated by Image Tool
  bookingLink?: string;             // Optional
}
```

---

### 5.3 Itinerary Agent

**File:** `lib/agents/itinerary.agent.ts`

#### Purpose
Generates the full day-by-day travel plan. Consumes `WeatherResult` and `PlaceResult` to create structured, time-boxed itineraries with travel segments between activities.

#### Input

```ts
interface ItineraryInput {
  origin: string;
  destination: string;
  numberOfDays: number;             // Derived by orchestrator
  numberOfPeople: number;
  startDate: string;                // "2025-06-15"
  endDate: string;                  // "2025-06-20"
  weather: WeatherResult;           // From Stage 1
  places: PlaceResult;              // From Stage 1
  tripTheme?: string[];
}
```

#### LLM Prompt Strategy

The prompt injects the full places list and applies strict day-planning rules:

| Rule | Detail |
|---|---|
| **Day 1** | Always starts with airport arrival + hotel check-in |
| **Last Day** | Always ends with hotel checkout + airport transfer |
| **Short trips (≤3 days)** | 2–3 activities after arrival, 2–3 before departure |
| **Long trips (>3 days)** | 1–2 activities on arrival/departure days |
| **Middle days** | Minimum 3 activities, ideally 4 |
| **Activity IDs** | Globally unique across all days (`activity_1`, `activity_2`, ...) |
| **Cost accuracy** | Entry fees and meal costs must be realistic, not zero |
| **Travel segments** | Reference activity IDs within same day only |
| **GPS coordinates** | Required for all activity locations |

#### Post-processing
- Normalizes `type` enum for each activity via `normalizeActivityType()`
- Normalizes `travelMode` enum for each segment via `normalizeTravelMode()`

#### Output

```ts
// ItineraryResult
{
  startDate: string;                // "2025-06-15"
  endDate: string;                  // "2025-06-20"
  totalDays: number;
  days: ItineraryDay[];
  totalEstimatedCostPerPerson: number;
}
```

#### ItineraryDay Shape

```ts
{
  date: string;                     // "YYYY-MM-DD"
  theme: string;                    // "Cultural Immersion & Street Food"
  weatherNote?: string;             // "Expect afternoon rain, carry umbrella"
  activities: ItineraryActivity[];
  travelSegments: TravelSegment[];
  mealsIncluded: {
    breakfast?: boolean;
    lunch?: boolean;
    dinner?: boolean;
  };
  dailyEstimatedCostPerPerson: number;  // Sum of activity + travel costs
}
```

#### ItineraryActivity Shape

```ts
{
  id: string;                       // "activity_1" — globally unique
  name: string;
  description: string;
  type: "attraction" | "food" | "hotel" | "travel" | "leisure";
  startTime: string;                // "HH:MM" 24-hour
  endTime: string;                  // "HH:MM" 24-hour
  estimatedDurationMinutes: number;
  location: {
    name: string;
    address: string;
    latitude?: number;
    longitude?: number;
  };
  estimatedCostPerPerson?: number;
  relatedPlaceId?: string;
  notes?: string;                   // Practical tip
}
```

#### TravelSegment Shape

```ts
{
  fromActivityId: string;           // References activity.id
  toActivityId: string;             // References activity.id
  travelMode: "walk" | "car" | "bike" | "public_transport" | "flight";
  estimatedTravelTimeMinutes: number;
  estimatedCost?: number;           // 0 for walks
}
```

---

### 5.4 Budget Agent

**File:** `lib/agents/budget.agent.ts`

#### Purpose
Estimates realistic trip costs across all categories — flights, accommodation, food, transport, activities, visa, and miscellaneous. Applies budget tier multipliers and seasonal adjustments.

#### Input

```ts
interface BudgetInput {
  origin: string;
  destination: string;
  numberOfPeople: number;
  numberOfDays: number;
  budgetLevel: "low" | "medium" | "luxury";
  currency: string;                 // ISO 4217, e.g., "INR"
  tripTheme?: string[];
  itinerary: ItineraryResult;       // From Stage 2
  places: PlaceResult;              // From Stage 1
  seasonalMultiplier: "low" | "medium" | "high";  // From weather.seasonalImpactOnCost
}
```

#### LLM Prompt Strategy

The prompt anchors the LLM to **known data** to ensure consistency:

| Anchor | Source |
|---|---|
| Hotel rate per night | `places.hotelRecommendations[budgetLevel][0].pricePerNight` |
| Activity costs total | `itinerary.totalEstimatedCostPerPerson` |
| Flight class | Derived from `budgetLevel` (economy → low/medium, business → luxury) |

Budget multipliers injected into prompt:
- `low budget`: 60–75% of standard rates
- `medium budget`: 90–110% of standard rates
- `luxury budget`: 180–250% of standard rates
- `low season`: × 0.7 | `medium season`: × 1.0 | `high season`: × 1.3

Theme-specific cost adjustments included in prompt when themes present (e.g., adventure = equipment rental).

#### Post-processing
Normalizes `budgetStatus` via `normalizeBudgetStatus()` — handles "exceeds" → `"over"`, "higher" → `"slightly_above"`.

#### Output

```ts
// BudgetResult
{
  currency: string;                    // "INR"
  breakdown: {
    flights:        CostEstimate;
    accommodation:  CostEstimate;
    food:           CostEstimate;
    localTransport: CostEstimate;
    activities:     CostEstimate;
    visa?:          CostEstimate;
    miscellaneous:  CostEstimate;
  };
  totalEstimatedCostPerPerson: CostEstimate;
  totalEstimatedCostForGroup:  CostEstimate;   // = perPerson × numberOfPeople
  seasonalAdjustment?: {
    season: string;
    multiplierApplied: number;
    reason: string;
  };
  dailyAverageCostPerPerson: number;            // = total / numberOfDays
  budgetStatus: "within" | "slightly_above" | "over";
  assumptions: string[];                        // 5–8 specific statements
}

// CostEstimate shape:
{ min: number; max: number; average: number }
```

---

## 6. Tools Deep Dive

### 6.1 Image Tool

**File:** `lib/tools/image.tool.ts`

#### Purpose
Fetches real image URLs for attractions, food items, and hotels. Used exclusively by the **Place Agent** after parsing LLM output.

#### Exported Functions

**`getImageUrl(query: string, type?: string): Promise<string>`**
Returns a single image URL for a given search query.

**`getMultipleImageUrls(query: string, count: number, type?: string): Promise<string[]>`**
Returns `count` image URLs. Used by Place Agent with `count = 1` for each item.

#### Source Priority Chain

```
1. Unsplash Source API
   https://source.unsplash.com/400x300/?{query}
   → Public redirect, no auth required
   → Tested with HEAD request before use

2. Pixabay fallback
   → Deterministic selection from curated Unsplash direct URLs
   → Uses query character hash for determinism

3. Public placeholder services
   → https://picsum.photos/400/300?random={hash}
   → https://dummyimage.com/400x300/...
   → https://via.placeholder.com/400x300?text=...
```

#### Query Transformation by Type

| Type | Query suffix |
|---|---|
| `attraction` | `{name} {destination} landmark` |
| `food` | `{name} {destination} food` |
| `hotel` | `{name} {destination} hotel` |
| `destination` | `{name} travel` |

#### Error Handling
Each image fetch in Place Agent is wrapped in try/catch. On failure:
```
attraction.images = [`https://via.placeholder.com/400x300?text={encoded name}`]
```

---

## 7. Schema Reference

All schemas are in `lib/adk/schemas.ts` and defined using **Zod**.

### 7.1 TripInput (Pipeline Entry Point)

```ts
{
  origin: string;                          // min length 1
  destination: string;                     // min length 1
  numberOfPeople: number;                  // positive integer
  startDate: string;                       // "YYYY-MM-DD"
  endDate: string;                         // "YYYY-MM-DD"
  budgetLevel: "low" | "medium" | "luxury";
  currency: string;                        // ISO 4217, length 3, uppercase
  tripTheme: string[];                     // default: []
}
```

### 7.2 WeatherResult

```ts
{
  currentSeason: string;
  bestSeasonToVisit: string;
  avoidSeason: string;
  temperatureRange: string;                // e.g., "25–35°C"
  seasonalImpactOnCost: "low" | "medium" | "high";
}
```

### 7.3 PlaceResult

```ts
{
  attractions: {
    name, description, location,
    category: "nature"|"historical"|"adventure"|"cultural"|"shopping"|"other",
    estimatedEntryFee: number,
    rating: 0–5, reviewsCount, images: string[],
    recommendedVisitDurationHours: number
  }[];

  foods: {
    name, description, averagePrice,
    images: string[],
    topRestaurants: { name, location, rating: 0–5 }[]
  }[];

  recommendedAreas: {
    name, description,
    suitableFor: "budget"|"family"|"luxury"|"nightlife"|"couples"
  }[];

  hotelRecommendations: {
    budget:  Hotel[];   // 3 items
    medium:  Hotel[];   // 3 items
    luxury:  Hotel[];   // 3 items
  }
}
```

### 7.4 ItineraryResult

```ts
{
  startDate: string;       // "YYYY-MM-DD"
  endDate: string;         // "YYYY-MM-DD"
  totalDays: number;
  days: {
    date: string,
    theme: string,
    weatherNote?: string,
    activities: {
      id: string,           // globally unique
      name, description,
      type: "attraction"|"food"|"hotel"|"travel"|"leisure",
      startTime: "HH:MM", endTime: "HH:MM",
      estimatedDurationMinutes: number,
      location: { name, address, latitude?, longitude? },
      estimatedCostPerPerson?: number,
      relatedPlaceId?: string,
      notes?: string
    }[],
    travelSegments: {
      fromActivityId, toActivityId,
      travelMode: "walk"|"car"|"bike"|"public_transport"|"flight",
      estimatedTravelTimeMinutes: number,
      estimatedCost?: number
    }[],
    mealsIncluded: { breakfast?, lunch?, dinner? },
    dailyEstimatedCostPerPerson: number
  }[];
  totalEstimatedCostPerPerson: number;
}
```

### 7.5 BudgetResult

```ts
{
  currency: string;
  breakdown: {
    flights, accommodation, food,
    localTransport, activities,
    visa?,              // optional
    miscellaneous
    // each: { min, max, average }
  };
  totalEstimatedCostPerPerson: { min, max, average };
  totalEstimatedCostForGroup:  { min, max, average };
  seasonalAdjustment?: { season, multiplierApplied, reason };
  dailyAverageCostPerPerson: number;
  budgetStatus: "within" | "slightly_above" | "over";
  assumptions: string[];   // 5–8 items
}
```

### 7.6 TripContext (Final Output)

The single object returned by the orchestrator. Stored in the database and served to the frontend.

```ts
{
  input: TripInput;              // Raw user input
  derived: {
    numberOfDays: number;
    startMonth: string;
    endMonth: string;
    season?: string;             // "Spring" | "Summer" | "Autumn" | "Winter"
  };
  weather?: WeatherResult;       // Optional — may be missing if agent failed
  places?: PlaceResult;          // Optional — may be missing if agent failed
  itinerary?: ItineraryResult;   // Optional — requires weather + places
  budget?: BudgetResult;         // Optional — requires itinerary + places
}
```

---

## 8. Orchestrator Deep Dive

**File:** `lib/adk/orchestrator.ts`

### `deriveTripMetadata(input: TripInput)`

Computes derived values without LLM:

```ts
// numberOfDays = ceil((endDate - startDate) / ms_per_day) + 1
// season = Northern Hemisphere mapping:
//   March–May   → "Spring"
//   June–Aug    → "Summer"
//   Sep–Nov     → "Autumn"
//   Dec–Feb     → "Winter"
```

### `runTripPipeline(input: TripInput)`

**Return type:**
```ts
{
  success: boolean;
  context?: TripContext;    // Present if success=true
  error?: string;           // Present if success=false
  metadata?: {
    completedStages: string[];   // e.g., ["weather", "places", "itinerary", "budget"]
    failedStages: string[];
    totalAttempts: number;       // sum of all retry attempts across all agents
  }
}
```

### `getPipelineStatus(metadata)`

Utility returning a human-readable string:
```
"Completed: [weather, places, itinerary, budget] | Failed: [none] | Total Attempts: 4"
```

---

## 9. Data Flow Summary

```
User Input (form)
  │
  ▼
POST /api/generate-trip
  │
  ▼
TripInput {
  origin, destination, numberOfPeople,
  startDate, endDate, budgetLevel,
  currency, tripTheme[]
}
  │
  ▼
Orchestrator → deriveTripMetadata()
  ├── numberOfDays
  ├── startMonth / endMonth
  └── season
  │
  ├──────────────────────────────────────────────┐
  │  PARALLEL                                    │
  ├─► WeatherAgent(origin, dest, dates)          │
  │     └── Output: currentSeason, bestSeason,   │
  │           avoidSeason, tempRange, costImpact  │
  │                                              │
  └─► PlaceAgent(origin, dest, people, theme)    │
        └── Output: attractions[], foods[],       │
              areas[], hotels{budget,med,luxury}  │
              + images fetched via Image Tool     │
  ──────────────────────────────────────────────┘
  │
  ▼ (if both succeeded)
ItineraryAgent(origin, dest, days, people, dates, weather, places, theme)
  └── Output: days[] with activities, segments, costs

  │ (if itinerary succeeded)
  ▼
BudgetAgent(origin, dest, people, days, budgetLevel,
            currency, theme, itinerary, places, seasonalMultiplier)
  └── Output: breakdown{}, totals, status, assumptions[]

  │
  ▼
TripContext (full validated object)
  │
  ▼
Stored in MongoDB → Served to /view-trip/[tripid]
```
