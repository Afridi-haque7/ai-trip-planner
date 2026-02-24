import dbConnect from "@/lib/dbConnect";
import Trip from "@/models/Trip";
import User from "@/models/User";
import { getToken } from "next-auth/jwt";
import crypto from "crypto";

export async function POST(request) {
    const token = await getToken({ req: request });

    // Verify user is authenticated
    if (!token || !token.userId || !token.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { userId, tripContext } = await request.json();
    
    // Verify the authenticated user matches the userId in request (use MongoDB ID)
    const mongoDbUserId = token.userId || token.sub;
    if (userId !== mongoDbUserId) {
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

      // Verify user exists
      const userExists = await User.findById(userId);
      if (!userExists) {
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Generate trip ID if not present (using crypto for random ID)
      const tripId = tripContext.tripId || crypto.randomUUID();
      
      console.log("[Store Trip] Generated/using tripId:", tripId);

      // Check for duplicate trips (prevent duplicate saves)
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

      // Create a new trip with full TripContext structure
      console.log("[Store Trip] Creating new trip document with tripId:", tripId);
      const newTrip = new Trip({
        tripId,
        userId,
        ...tripContext,
      });

      const savedTrip = await newTrip.save(); // save the new trip
      console.log("[Store Trip] Trip document saved to DB with _id:", savedTrip._id);

      // Store tripId (not MongoDB _id) in user history for easy lookup
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $push: { history: newTrip.tripId } },
        { new: true }
      );
      console.log("[Store Trip] User history updated with tripId. User now has", updatedUser.history.length, "trips");

      console.log("[Store Trip] Trip saved successfully:", {
        tripId,
        destination: tripContext.input?.destination,
        userId,
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
       
       // Handle duplicate key error
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