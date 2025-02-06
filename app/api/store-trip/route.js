import dbConnect from "@/lib/dbConnect";
import Chats from "@/models/Trip";
import User from "@/models/User";


export async function  POST(request) {
    const { userId, tripData } = await request.json();
    
    try {
      await dbConnect();

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