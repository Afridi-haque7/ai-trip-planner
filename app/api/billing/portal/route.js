export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { getStripe } from "@/lib/stripe";

/**
 * POST /api/billing/portal
 *
 * Returns a Stripe Customer Portal URL so the user can manage, upgrade, downgrade
 * or cancel their subscription. Plan changes made there come back as webhook
 * events and are synced by /api/webhooks/stripe.
 */
export async function POST() {
  try {
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email });
    if (!user?.stripeCustomerId) {
      return Response.json(
        { error: "No billing account yet. Subscribe to a plan first." },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const portal = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${appUrl}/dashboard`,
    });

    return Response.json({ url: portal.url }, { status: 200 });
  } catch (err) {
    console.error("[billing portal] error:", err?.message);
    return Response.json(
      { error: "Failed to open billing portal" },
      { status: 500 }
    );
  }
}
