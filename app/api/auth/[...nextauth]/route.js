import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// import { authOptions } from "./options";

// const handler = NextAuth(authOptions)
const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      clientSecret: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET,
    }),
  ],
});

export {handler as GET, handler as POST}