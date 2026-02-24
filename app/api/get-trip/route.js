export const runtime = "nodejs";

import dbConnect from "@/lib/dbConnect";
import Trip from "@/models/Trip";
import { getToken } from "next-auth/jwt";

export async function POST(req){
    const token = await getToken({ req });

    // Verify user is authenticated
    if (!token || !token.userId || !token.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { tripid } = await req.json();

    // Validate tripid format
    if (!tripid || typeof tripid !== "string") {
      return new Response(JSON.stringify({ error: "Invalid trip ID" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("[Get Trip] Fetching trip:", tripid);

    await dbConnect();

    try {
        const tripData = await Trip.findOne({ tripId: tripid });
        
        if(tripData){
            // Verify the authenticated user owns this trip (use MongoDB ID)
            const mongoDbUserId = token.userId || token.sub;
            if (tripData.userId.toString() !== mongoDbUserId.toString()) {
              return new Response(JSON.stringify({ error: "Forbidden: Trip does not belong to you" }), {
                status: 403,
                headers: { "Content-Type": "application/json" },
              });
            }

            // Return complete TripContext with all nested data
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
        }else{
            return new Response(JSON.stringify({ error: "Trip not found"}), {
                status: 404,
                headers: { "Content-Type": "application/json"}
            });
        }
    } catch (error) {
        console.error("Error fetching trip data", error.message);
        return new Response(
          JSON.stringify({ error: "Internal Server Error" }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
    }
}