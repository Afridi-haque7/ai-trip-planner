import User from "@/models/User";

/**
 * Per-plan monthly trip generation limits.
 * Changing a value here automatically applies everywhere.
 */
export const PLAN_LIMITS = Object.freeze({
  free: 2,
  basic: 10,
  premium: 20,
});

/**
 * Returns the current calendar month as "YYYY-MM".
 * Comparisons are done in UTC so they are timezone-independent.
 */
function currentMonthKey() {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/**
 * Atomically checks whether the user is allowed to generate a trip this month,
 * and if so, increments their counter in a single MongoDB round-trip.
 *
 * Race-condition safety: Because both the limit check and the increment happen
 * inside a single findOneAndUpdate call, two simultaneous requests from the same
 * user cannot both "see" a count below the limit and both succeed. MongoDB
 * serialises document-level writes, so exactly one of them will find the
 * document and increment it; the other will see the filter fail and get null.
 *
 * Month reset: If usageResetMonth !== currentMonth the update pipeline resets
 * monthlyTripCount to 1 and writes the new month key. No cron job needed.
 *
 * @param {import('mongoose').Types.ObjectId} userMongoId  Mongoose _id of the user
 * @returns {{ allowed: boolean, used: number, limit: number }}
 */
export async function checkAndIncrementUsage(userMongoId) {
  const month = currentMonthKey();

  // Read plan first so we know the limit to embed in the filter.
  // This one extra read is cheap and avoids embedding plan logic in the
  // aggregation pipeline, keeping the update simple and auditable.
  const user = await User.findById(userMongoId, {
    subscriptionPlan: 1,
    monthlyTripCount: 1,
    usageResetMonth: 1,
  }).lean();

  if (!user) {
    return { allowed: false, used: 0, limit: 0 };
  }

  const plan = user.subscriptionPlan ?? "free";
  const limit = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
  const currentCount = user.monthlyTripCount ?? 0;
  const currentMonth = user.usageResetMonth ?? "";

  // The filter accepts the document only if:
  //   (a) it is a new month  →  we will reset the counter regardless of count, OR
  //   (b) same month but still under the limit
  // If neither is true (same month, count >= limit) findOneAndUpdate returns null.
  const filter = {
    _id: userMongoId,
    $or: [
      { usageResetMonth: { $ne: month } },                 // new month
      { usageResetMonth: month, monthlyTripCount: { $lt: limit } }, // same month, under limit
    ],
  };

  // Aggregation-pipeline update: branch on whether we are in the same month.
  const update = [
    {
      $set: {
        usageResetMonth: month,
        monthlyTripCount: {
          $cond: {
            if: { $eq: ["$usageResetMonth", month] },
            // Same month → just increment
            then: { $add: ["$monthlyTripCount", 1] },
            // New month → reset to 1
            else: 1,
          },
        },
      },
    },
  ];

  const updated = await User.findOneAndUpdate(filter, update, {
    new: true,
    select: { monthlyTripCount: 1, usageResetMonth: 1 },
  });

  if (!updated) {
    // Document was not matched → limit already reached for this month
    return { allowed: false, used: currentCount, limit };
  }

  return { allowed: true, used: updated.monthlyTripCount, limit };
}
