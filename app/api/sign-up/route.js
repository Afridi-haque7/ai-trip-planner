import dbConnect from '@/lib/dbConnect'
import User from '@/models/User'

export async function POST(request) {
    const { name, email } = await request.json();

    try {
      await dbConnect(); // Connect to MongoDB

      // Check if the user already exists
      const existingUser = await User.findOne({ email });

      if (existingUser) {
        // User exists, return the user
        return new Response(JSON.stringify(existingUser), {
            status: 200,
            headers: { 'Content-Type': 'application/json'}
        });
      } else {
        // User does not exist, create a new user
        const newUser = new User({
          name,
          email,
          history: [], // Initialize history as an empty array
        });

        await newUser.save(); // Save the new user to the database
        return new Response(JSON.stringify(newUser), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });
      }
    } catch (error) {
      console.error("Error saving user:", error);
      return new Response(JSON.stringify({ error: "Internal Server Error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
}
