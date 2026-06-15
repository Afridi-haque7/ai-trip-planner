export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { headers } from "next/headers";
import { getStripe, planForPriceId } from "@/lib/stripe";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

/**
 * POST /api/webhooks/stripe
 *
 * The single source of truth for subscription state. Stripe calls this after
 * payment events; we verify the signature against the raw body, then sync the
 * user's plan. The internal plan (free|basic|premium) flows straight into the
 * existing usage gate — no other code needs to change when a user upgrades.
 *
 * Test locally:
 *   stripe listen --forward-to localhost:3000/api/webhooks/stripe
 *   stripe trigger checkout.session.completed
 */
export async function POST(request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[stripe webhook] STRIPE_WEBHOOK_SECRET not set");
    return Response.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const stripe = getStripe();
  const sig = (await headers()).get("stripe-signature");
  const rawBody = await request.text(); // raw body is required for verification

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch (err) {
    console.error("[stripe webhook] signature verification failed:", err.message);
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    await dbConnect();

    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object;
        if (s.subscription) {
          const sub = await stripe.subscriptions.retrieve(s.subscription);
          // Ensure metadata.userId is present even if it was only on the session.
          if (!sub.metadata?.userId && (s.metadata?.userId || s.client_reference_id)) {
            sub.metadata = {
              ...sub.metadata,
              userId: s.metadata?.userId || s.client_reference_id,
            };
          }
          await applySubscription(sub);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        await applySubscription(event.data.object);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object;
        const user = await resolveUser(sub);
        if (user) {
          user.subscriptionPlan = "free";
          user.subscriptionStatus = "canceled";
          user.subscriptionEndDate = null;
          user.stripeSubscriptionId = null;
          await user.save();
        }
        break;
      }

      case "invoice.payment_failed": {
        const inv = event.data.object;
        await User.findOneAndUpdate(
          { stripeCustomerId: inv.customer },
          { subscriptionStatus: "past_due" }
        );
        break;
      }

      default:
        break;
    }

    return Response.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error("[stripe webhook] handler error:", err.message);
    return Response.json({ error: "Handler error" }, { status: 500 });
  }
}

/** Resolve the app user from a Stripe subscription (metadata first, then customer). */
async function resolveUser(sub) {
  if (sub?.metadata?.userId) {
    const byId = await User.findById(sub.metadata.userId);
    if (byId) return byId;
  }
  if (sub?.customer) {
    return User.findOne({ stripeCustomerId: sub.customer });
  }
  return null;
}

/** Sync a subscription's tier + status onto the user record. */
async function applySubscription(sub) {
  const user = await resolveUser(sub);
  if (!user) {
    console.warn("[stripe webhook] no user for subscription", sub?.id);
    return;
  }

  const priceId = sub.items?.data?.[0]?.price?.id;
  const plan = planForPriceId(priceId) || "free";
  const active = ["active", "trialing"].includes(sub.status);

  user.subscriptionPlan = active ? plan : "free";
  user.subscriptionStatus = sub.status;
  user.subscriptionEndDate = sub.current_period_end
    ? new Date(sub.current_period_end * 1000)
    : null;
  user.stripeCustomerId = sub.customer || user.stripeCustomerId;
  user.stripeSubscriptionId = sub.id;
  await user.save();

  console.log(
    `[stripe webhook] user ${user._id} → ${user.subscriptionPlan} (${sub.status})`
  );
}
