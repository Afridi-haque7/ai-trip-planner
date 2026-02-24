import { z } from "zod";

/**
 * Retry Wrapper for ADK Agents
 *
 * Implements exponential backoff retry logic with schema validation.
 * Retries on:
 * - Network errors
 * - JSON parse errors
 * - Schema validation failures
 *
 * Does NOT retry on:
 * - Invalid API key
 * - Malformed input (doesn't match prompt schema)
 * - Final validation failure (max attempts exceeded)
 */

interface RetryConfig {
  maxAttempts: number;
  initialBackoffMs: number;
  maxBackoffMs: number;
}

interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  attempts: number;
  lastError?: string;
}

/**
 * Calculate exponential backoff with jitter
 * Formula: min(maxBackoff, initialBackoff * 2^attempt) + random(0-1000ms)
 */
function calculateBackoff(
  attempt: number,
  config: RetryConfig
): number {
  const exponential = config.initialBackoffMs * Math.pow(2, attempt);
  const capped = Math.min(exponential, config.maxBackoffMs);
  const jitter = Math.random() * 1000;
  return capped + jitter;
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry wrapper for async agent functions
 *
 * @param agentFn - The agent function to call
 * @param schema - Zod schema to validate output
 * @param config - Retry configuration
 * @param context - Optional context for logging
 * @returns Retry result with success flag, data, and attempts
 */
export async function withRetry<T>(
  agentFn: () => Promise<T>,
  schema: z.ZodSchema,
  config: RetryConfig,
  context?: { agentName?: string }
): Promise<RetryResult<T>> {
  const agentName = context?.agentName || "Agent";
  let lastError: string = "";

  for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
    try {
      console.log(
        `[${agentName}] Attempt ${attempt + 1}/${config.maxAttempts}`
      );

      // Execute agent function
      const result = await agentFn();

      // Validate against schema
      const validated = schema.parse(result);

      console.log(`[${agentName}] Success on attempt ${attempt + 1}`);
      return {
        success: true,
        data: validated as T,
        attempts: attempt + 1,
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);

      // Determine if error is retryable
      const isRetryable =
        error instanceof z.ZodError || // Schema validation failed
        (error instanceof Error && error.message.includes("fetch")) || // Network error
        (error instanceof Error && error.message.includes("JSON")); // JSON parse error

      if (!isRetryable) {
        console.error(
          `[${agentName}] Non-retryable error: ${lastError}`
        );
        return {
          success: false,
          error: lastError,
          attempts: attempt + 1,
          lastError,
        };
      }

      // Log attempt failure
      if (error instanceof z.ZodError) {
        console.warn(
          `[${agentName}] Validation failed on attempt ${
            attempt + 1
          }: ${error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ")}`
        );
      } else {
        console.warn(
          `[${agentName}] Attempt ${attempt + 1} failed: ${lastError}`
        );
      }

      // If not last attempt, sleep before retry
      if (attempt < config.maxAttempts - 1) {
        const backoff = calculateBackoff(attempt, config);
        console.log(
          `[${agentName}] Retrying in ${Math.round(backoff)}ms...`
        );
        await sleep(backoff);
      }
    }
  }

  // All attempts exhausted
  console.error(
    `[${agentName}] Failed after ${config.maxAttempts} attempts. Last error: ${lastError}`
  );
  return {
    success: false,
    error: `Failed after ${config.maxAttempts} attempts: ${lastError}`,
    attempts: config.maxAttempts,
    lastError,
  };
}

/**
 * Batch retry wrapper for multiple independent async operations
 * Useful for running Weather and Place agents in parallel
 *
 * @param operations - Array of { name, fn, schema }
 * @param config - Retry configuration
 * @returns Object with each operation's result
 */
export async function withBatchRetry<T extends Record<string, unknown>>(
  operations: Array<{
    name: string;
    fn: () => Promise<unknown>;
    schema: z.ZodSchema;
  }>,
  config: RetryConfig
): Promise<Record<string, RetryResult<unknown>>> {
  const results: Record<string, RetryResult<unknown>> = {};

  // Run all operations in parallel
  const promises = operations.map((op) =>
    withRetry(op.fn, op.schema, config, { agentName: op.name })
  );

  const outcomes = await Promise.all(promises);

  // Map results back to operation names
  operations.forEach((op, index) => {
    results[op.name] = outcomes[index];
  });

  return results;
}
