export const dynamic = 'force-dynamic';

import dbConnect from "@/lib/dbConnect";
import Trip from "@/models/Trip";
import User from "@/models/User";
import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";
import crypto from "crypto";

export async function POST(request) {
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

  const { userId, tripContext } = await request.json();

  // Verify the authenticated user matches the userId in request
  if (userId !== session.user.id) {
    return new Response(JSON.stringify({ error: "Forbidden: Cannot store trip for another user" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Validate input
  if (!tripContext || typeof tripContext !== "object") {
    return new Response(JSON.stringify({ error: "Invalid trip context" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    await dbConnect();

    console.log("[Store Trip] Request received:", {
      userId,
      tripContextInput: tripContext?.input,
      hasExistingTripId: !!tripContext?.tripId,
    });

    // Verify user exists — look up by email since Better Auth user IDs
    // won't match your existing Mongoose User model's _id values
    const userExists = await User.findOne({ email: session.user.email });
    if (!userExists) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Generate trip ID if not present
    const tripId = tripContext.tripId || crypto.randomUUID();

    console.log("[Store Trip] Generated/using tripId:", tripId);

    // Check for duplicate trips
    const existingTrip = await Trip.findOne({ tripId });
    if (existingTrip) {
      console.warn("[Store Trip] Trip with this ID already exists:", tripId);
      return new Response(JSON.stringify({
        success: true,
        tripId: existingTrip.tripId,
        _id: existingTrip._id,
        message: "Trip already exists"
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create new trip
    console.log("[Store Trip] Creating new trip document with tripId:", tripId);
    const newTrip = new Trip({
      tripId,
      userId: userExists._id, // use Mongoose _id, not Better Auth user ID
      ...tripContext,
    });

    const savedTrip = await newTrip.save();
    console.log("[Store Trip] Trip saved with _id:", savedTrip._id);

    // Store tripId in user history
    const updatedUser = await User.findByIdAndUpdate(
      userExists._id,
      { $push: { history: newTrip.tripId } },
      { new: true }
    );
    console.log("[Store Trip] User history updated. User now has", updatedUser.history.length, "trips");

    console.log("[Store Trip] Trip saved successfully:", {
      tripId,
      destination: tripContext.input?.destination,
      userId: userExists._id,
      mongoId: newTrip._id,
      timestamp: new Date().toISOString(),
    });

    return new Response(JSON.stringify({
      success: true,
      tripId: newTrip.tripId,
      _id: newTrip._id,
      message: "Trip saved successfully"
    }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[Store Trip] Error storing trip:", {
      message: error.message,
      code: error.code,
      timestamp: new Date().toISOString(),
    });

    if (error.code === 11000) {
      console.error("[Store Trip] Duplicate tripId detected");
      return new Response(JSON.stringify({ error: "Trip with this ID already exists" }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Internal Server Error", details: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}