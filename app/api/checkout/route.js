export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { getStripe, planToPriceId } from "@/lib/stripe";
import { rateLimit, tooManyRequests } from "@/lib/ratelimit";

const VALID_PLANS = ["basic", "premium"];

/**
 * POST /api/checkout  { plan: "basic" | "premium" }
 *
 * Creates (or reuses) a Stripe customer for the logged-in user and returns a
 * Checkout Session URL for a subscription to the requested plan. The actual plan
 * upgrade happens later, in the webhook, only after payment succeeds.
 */
export async function POST(request) {
  try {
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Burst limit: max 10 checkout attempts/min per user.
    const rl = await rateLimit(`checkout:${session.user.email}`, 10, 60);
    if (!rl.allowed) return tooManyRequests(rl);

    const body = await request.json().catch(() => ({}));
    const plan = body?.plan;
    if (!VALID_PLANS.includes(plan)) {
      return Response.json({ error: "Invalid plan" }, { status: 400 });
    }

    const priceId = planToPriceId(plan);
    if (!priceId) {
      return Response.json(
        { error: "Plan price not configured" },
        { status: 500 }
      );
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const stripe = getStripe();

    // Reuse a Stripe customer across checkouts so billing history stays unified.
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: String(user._id) },
      });
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: String(user._id),
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${appUrl}/dashboard?checkout=success`,
      cancel_url: `${appUrl}/pricing?checkout=cancelled`,
      metadata: { userId: String(user._id), plan },
      // Persist userId/plan on the subscription so later webhook events
      // (renewals, plan changes, cancellations) can resolve the user.
      subscription_data: { metadata: { userId: String(user._id), plan } },
    });

    return Response.json({ url: checkout.url }, { status: 200 });
  } catch (err) {
    console.error("[checkout] error:", err?.message);
    return Response.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
