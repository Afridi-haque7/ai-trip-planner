import dbConnect from "@/lib/dbConnect";
import Chats from "@/models/Trip";
import User from "@/models/User";
import { getToken } from "next-auth/jwt";

export async function POST(request) {
    const token = await getToken({ req: request });

    // Verify user is authenticated
    if (!token || !token.userId || !token.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { userId, tripData } = await request.json();
    
    // Verify the authenticated user matches the userId in request (use MongoDB ID)
    const mongoDbUserId = token.userId || token.sub;
    if (userId !== mongoDbUserId) {
      return new Response(JSON.stringify({ error: "Forbidden: Cannot store trip for another user" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate input
    if (!tripData || typeof tripData !== "object") {
      return new Response(JSON.stringify({ error: "Invalid trip data" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    try {
      await dbConnect();

      // Verify user exists
      const userExists = await User.findById(userId);
      if (!userExists) {
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // create a new trip in the chats collection
      const newTrip = new Chats({
        userId,
        ...tripData,
      });

      await newTrip.save(); // save the new trip

      await User.findByIdAndUpdate(
        userId,
        { $push: { history: newTrip._id } },
        { new: true }
      );

      return new Response(JSON.stringify(newTrip), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
       console.error("Error storing trip:", error);
       return new Response(JSON.stringify({ error: "Internal Server Error" }), {
         status: 500,
         headers: { "Content-Type": "application/json" },
       }); 
    }
}