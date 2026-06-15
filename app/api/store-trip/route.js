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
  let tripId = "";
  let ownerUserId = "";

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

    // Session email is the source of truth
    const userExists = await User.findOne(
      { email: session.user.email },
      { _id: 1 },
    ).lean();
    if (!userExists) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    ownerUserId = String(userExists._id);
    tripId = tripContext.tripId || crypto.randomUUID();

    // Safe upsert logic:
    const resultTrip = await Trip.findOneAndUpdate(
        { tripId, userId: userExists._id },
        { $set: tripContext },
        { new: true }
    );

    if (!resultTrip) {
        // It didn't exist for US. We should try creating.
        try {
            const newTrip = new Trip({
                tripId,
                userId: userExists._id,
                ...tripContext,
            });
            const created = await newTrip.save();
            await User.findByIdAndUpdate(
              userExists._id,
              { $push: { history: created.tripId } },
              { new: true }
            );
            return new Response(
              JSON.stringify({
                success: true,
                tripId: created.tripId,
                _id: created._id,
                message: "Trip created successfully",
              }),
              { status: 201, headers: { "Content-Type": "application/json" } }
            );
        } catch (e) {
            if (e?.code === 11000) {
               // Must belong to someone else
               return new Response(
                 JSON.stringify({ error: "Trip ID conflict. Please retry." }),
                 { status: 409, headers: { "Content-Type": "application/json" } }
               );
            }
            throw e;
        }
    }

    // It existed and we owned it. It is now updated.
    return new Response(
      JSON.stringify({
        success: true,
        tripId: resultTrip.tripId,
        _id: resultTrip._id,
        message: "Trip updated successfully",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[Store Trip] Error:", errorMessage);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: errorMessage,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
