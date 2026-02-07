export const runtime = "nodejs";

import dbConnect from "@/lib/dbConnect";
import Chats from "@/models/Trip";
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

    console.log(tripid);

    await dbConnect();

    try {
        const tripData = await Chats.findById(tripid);
        console.log(tripData);
        
        if(tripData){
            // Verify the authenticated user owns this trip (use MongoDB ID)
            const mongoDbUserId = token.userId || token.sub;
            if (tripData.userId.toString() !== mongoDbUserId.toString()) {
              return new Response(JSON.stringify({ error: "Forbidden: Trip does not belong to you" }), {
                status: 403,
                headers: { "Content-Type": "application/json" },
              });
            }

            return new Response(JSON.stringify({
                userId: tripData.userId,
                locationImg: tripData.locationImg,
                tripDetails: tripData.tripDetails,
                hotelOptions: tripData.hotelOptions,
                itinerary: tripData.itinerary,
                authenticDishes: tripData.authenticDishes,
                estimatedCost: tripData.estimatedCost,
                createdAt: tripData.createdAt,
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