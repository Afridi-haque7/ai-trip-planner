export const dynamic = 'force-dynamic';

import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(request) {
  try {
    const auth = await getAuth();
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    // Verify user is authenticated
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { email } = await request.json();

    // Validate email
    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify user can only request their own details
    if (session.user.email !== email) {
      return new Response(JSON.stringify({ error: "Forbidden - can only access own details" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    await dbConnect();

    // Fetch user from your existing User model
    const authenticatedUser = await User.findOne({ email: session.user.email });

    if (!authenticatedUser) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      _id: authenticatedUser._id,
      name: authenticatedUser.name,
      email: authenticatedUser.email,
      history: authenticatedUser.history || [],
      subscriptionPlan: authenticatedUser.subscriptionPlan || "free",
      subscriptionEndDate: authenticatedUser.subscriptionEndDate || null,
      monthlyTripCount: authenticatedUser.monthlyTripCount ?? 0,
      usageResetMonth: authenticatedUser.usageResetMonth ?? "",
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}