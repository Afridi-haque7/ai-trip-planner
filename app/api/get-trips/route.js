export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import dbConnect from "@/lib/dbConnect";
import Trip from "@/models/Trip";
import User from "@/models/User";
import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * GET /api/get-trips
 *
 * Returns ALL of the signed-in user's trips in a single query — replacing the
 * old N+1 pattern (the client used to fetch /api/get-trip once per trip id in
 * the user's history, on every Navbar mount). One indexed `Trip.find({ userId })`
 * here collapses dozens of round-trips into one.
 */
export async function GET() {
  try {
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findOne(
      { email: session.user.email },
      { _id: 1 }
    ).lean();
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const trips = await Trip.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .lean();

    const mapped = trips.map((t) => ({
      _id: t._id,
      userId: t.userId,
      tripId: t.tripId,
      input: t.input,
      derived: t.derived,
      weather: t.weather,
      places: t.places,
      itinerary: t.itinerary,
      budget: t.budget,
      metadata: t.metadata,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));

    return Response.json({ trips: mapped }, { status: 200 });
  } catch (error) {
    console.error("[Get Trips] error:", error?.message);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
