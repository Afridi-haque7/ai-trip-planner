import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";


const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      clientSecret: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({user}){
      const {name, email} = user;
      try {
        await dbConnect();
        const existingUser = await User.findOne({ email });

         if (!existingUser) {
           // User does not exist, create a new user
           const newUser = new User({
             name,
             email,
             history: [], // Initialize history as an empty array
           });

           await newUser.save(); // Save the new user to the database
           console.log("New user created:", newUser);
         } else {
           console.log("User already exists:", existingUser);
         }
      } catch (error) {
        console.error("Error during signin callback", error);
        return false
        
      }

      return true;
    },
  },
});

export {handler as GET, handler as POST}