import dbConnect from "@/lib/dbConnect";
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

    const { email } = await request.json();

    // Validate email format
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return new Response(JSON.stringify({ error: "Invalid email format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
        await dbConnect();
        const user = await User.findOne({ email });

        if(user){
            return new Response(JSON.stringify({ _id: user._id }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
        }else{
            return new Response(JSON.stringify({ error: "User not found" }), {
              status: 404,
              headers: { "Content-Type": "application/json" },
            });
        }
    } catch (error) {
        console.error("Error fetching user:", error);
        return new Response(
          JSON.stringify({ error: "Internal Server Error" }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
    }
}