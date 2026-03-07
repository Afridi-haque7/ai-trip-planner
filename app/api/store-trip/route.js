export const dynamic = "force-dynamic";

import dbConnect from "@/lib/dbConnect";
import Trip from "@/models/Trip";
import User from "@/models/User";
import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";
import crypto from "crypto";

export async function POST(request) {
  const auth = await getAuth();
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { tripContext } = await request.json(); // ← removed userId from destructure

  if (!tripContext || typeof tripContext !== "object") {
    return new Response(JSON.stringify({ error: "Invalid trip context" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    await dbConnect();

    // Session email is the source of truth — no need to trust client-sent userId
    const userExists = await User.findOne({ email: session.user.email });
    if (!userExists) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const tripId = tripContext.tripId || crypto.randomUUID();

    const existingTrip = await Trip.findOne({ tripId });
    if (existingTrip) {
      return new Response(
        JSON.stringify({
          success: true,
          tripId: existingTrip.tripId,
          _id: existingTrip._id,
          message: "Trip already exists",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const newTrip = new Trip({
      tripId,
      userId: userExists._id,
      ...tripContext,
    });

    const savedTrip = await newTrip.save();

    await User.findByIdAndUpdate(
      userExists._id,
      { $push: { history: newTrip.tripId } },
      { new: true },
    );

    return new Response(
      JSON.stringify({
        success: true,
        tripId: newTrip.tripId,
        _id: savedTrip._id,
        message: "Trip saved successfully",
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("[Store Trip] Error:", error.message);

    if (error.code === 11000) {
      return new Response(
        JSON.stringify({ error: "Trip with this ID already exists" }),
        {
          status: 409,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
