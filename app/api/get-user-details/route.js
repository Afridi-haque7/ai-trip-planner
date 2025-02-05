import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

export async function POST(request) {
  const { email } = await request.json();

  try {
    await dbConnect(); //connect to DB
    const user = await User.findOne({ email });

    if (user) {
      return new Response(JSON.stringify({ 
        name: user.name,
        email: user.email,
        history: user.history
       }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Error fetching user:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
