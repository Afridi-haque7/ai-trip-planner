export const runtime = "nodejs";
export const dynamic = 'force-dynamic';

import dbConnect from "@/lib/dbConnect";
import Trip from "@/models/Trip";
import User from "@/models/User";
import { getAuth } from "@/lib/auth";  // ← changed
import { headers } from "next/headers";

export async function POST(req) {
  // ← await getAuth() instead of using auth directly
  const auth = await getAuth();

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id || !session?.user?.email) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { tripid } = await req.json();

  if (!tripid || typeof tripid !== "string") {
    return new Response(JSON.stringify({ error: "Invalid trip ID" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  console.log("[Get Trip] Fetching trip:", tripid);

  await dbConnect();

  try {
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const tripData = await Trip.findOne({ tripId: tripid });

    if (tripData) {
      if (tripData.userId.toString() !== user._id.toString()) {
        return new Response(JSON.stringify({ error: "Forbidden: Trip does not belong to you" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        _id: tripData._id,
        userId: tripData.userId,
        tripId: tripData.tripId,
        input: tripData.input,
        derived: tripData.derived,
        weather: tripData.weather,
        places: tripData.places,
        itinerary: tripData.itinerary,
        budget: tripData.budget,
        metadata: tripData.metadata,
        createdAt: tripData.createdAt,
        updatedAt: tripData.updatedAt,
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else {
      return new Response(JSON.stringify({ error: "Trip not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Error fetching trip data", error.message);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}