import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";


const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      clientSecret: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      const { name, email, image } = user;
      try {
        await dbConnect();
        const existingUser = await User.findOne({ email });

        if (!existingUser) {
          // User does not exist, create a new user
          const newUser = new User({
            googleId: account.providerAccountId,
            name,
            email,
            profileImage: image,
            subscriptionPlan: "free", // Default plan
            subscriptionEndDate: null, // No end date for free plan
            history: [], // Initialize history as an empty array
          });

          await newUser.save(); // Save the new user to the database
          // console.log("New user created:", newUser);
        } else {
          // console.log("User already exists:", existingUser);
        }
      } catch (error) {
        console.error("Error during signin callback", error);
        return false;
      }

      return true;
    },
    async session({ session, token }) {
      // Send properties to the client
      if (session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
  pages: {
    signIn: "/signin", // Custom sign-in page
    signUp: "/signup", // Custom sign-up page
  },
  debug: process.env.NODE_ENV === "development", // Enable debug in development
});

export {handler as GET, handler as POST}