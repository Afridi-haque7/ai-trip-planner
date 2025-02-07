export const runtime = "nodejs";

import dbConnect from "@/lib/dbConnect";
import Chats from "@/models/Trip";

export async function POST(req){
    const { tripid } = await req.json();

    console.log(tripid);

    await dbConnect();

    try {
        const tripData = await Chats.findById(tripid);
        console.log(tripData);
        
        if(tripData){
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