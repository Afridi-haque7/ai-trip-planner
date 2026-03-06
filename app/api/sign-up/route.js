export const dynamic = 'force-dynamic';

import dbConnect from '@/lib/dbConnect'
import User from '@/models/User'

export async function POST(request) {
    const { name, email } = await request.json();

    // Validate input
    if (!name || !email || typeof name !== "string" || typeof email !== "string") {
      return new Response(JSON.stringify({ error: "Invalid name or email" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json'}
      });
    }

    if (!email.includes("@")) {
      return new Response(JSON.stringify({ error: "Invalid email format" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json'}
      });
    }

    try {
      await dbConnect(); // Connect to MongoDB

      // Use atomic findOneAndUpdate to prevent race conditions
      const user = await User.findOneAndUpdate(
        { email },
        {
          $setOnInsert: {
            name,
            email,
            history: [],
          }
        },
        {
          upsert: true,
          new: true,
          runValidators: true
        }
      );

      return new Response(JSON.stringify(user), {
        status: 200,
        headers: { 'Content-Type': 'application/json'}
      });
    } catch (error) {
      console.error("Error saving user:", error);
      return new Response(JSON.stringify({ error: "Internal Server Error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
}
