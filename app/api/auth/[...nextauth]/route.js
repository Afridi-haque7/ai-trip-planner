import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";


const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
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
        
        // Use atomic findOneAndUpdate to prevent race conditions
        await User.findOneAndUpdate(
          { email },
          {
            $setOnInsert: {
              googleId: account.providerAccountId,
              email,
              subscriptionPlan: "free",
              subscriptionEndDate: null,
              history: [],
            },
            $set: {
              // Update existing user with latest profile data
              name,
              profileImage: image,
            }
          },
          { 
            upsert: true, 
            new: true,
            runValidators: true
          }
        );
        
        return true;
      } catch (error) {
        console.error("Error during signin callback:", error);
        // Don't crash auth - just log and continue
        return true;
      }
    },
    async session({ session, token }) {
      // Send MongoDB user ID to the client (not Google ID)
      if (session?.user) {
        session.user.id = token.userId || token.sub;
      }
      return session;
    },
    async jwt({ token, user, account, trigger, isNewUser }) {
      // On first sign-in, fetch the MongoDB user by email and store their ID
      if (isNewUser || trigger === "signIn") {
        try {
          await dbConnect();
          const dbUser = await User.findOne({ email: token.email });
          if (dbUser) {
            // Store MongoDB user ID in token (not Google ID)
            token.userId = dbUser._id.toString();
          }
        } catch (error) {
          console.error("Error fetching user in JWT callback:", error);
        }
      }
      
      // Preserve userId if it exists from a previous call
      if (token.userId) {
        token.sub = token.userId; // Override sub with MongoDB ID
      }
      
      return token;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // Use default NextAuth pages instead of custom non-existent pages
  secret: process.env.NEXTAUTH_SECRET,
});

export {handler as GET, handler as POST}