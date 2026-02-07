import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { getToken } from "next-auth/jwt";

export async function POST(request) {
  try {
    const token = await getToken({ req: request });

    // Verify user is authenticated
    if (!token || !token.userId || !token.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { email } = await request.json();

    // Validate email
    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    await dbConnect();
    
    // Fetch the authenticated user's details using MongoDB ID (not Google ID)
    const authenticatedUser = await User.findById(token.userId || token.sub);
    
    if (!authenticatedUser) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify user can only request their own details
    if (authenticatedUser.email !== email) {
      return new Response(JSON.stringify({ error: "Forbidden - can only access own details" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Return user details
    return new Response(JSON.stringify({ 
      _id: authenticatedUser._id,
      name: authenticatedUser.name,
      email: authenticatedUser.email,
      history: authenticatedUser.history || [],
      subscriptionPlan: authenticatedUser.subscriptionPlan || "Free",
      subscriptionEndDate: authenticatedUser.subscriptionEndDate || null,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
