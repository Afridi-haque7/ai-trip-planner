import {NextAuth} from 'next-auth';
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';


export const authOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: {
          label: "email",
          type: "email",
          placeholder: "user@example.com",
        },
        password: { label: "password", type: "password" },
      },
      async authorize(credentials, req) {
        await dbConnect();
        try {
          const user = await User.findOne({
            $or: [
              { email: credentials.identifier },
              { name: credentials.identifier },
            ],
          });

          if (!user) {
            throw new Error("No user found");
          }

          // check password
          const isPasswordMatched = await bcrypt.compare(
            credentials.password,
            user.password
          );
          if (isPasswordMatched) {
            return user;
          } else {
            throw new Error("Incorrect Password");
          }
        } catch (error) {
          throw new Error(error);
        }
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      return session;
    },
    async jwt({ token, user}) {
        if(user){
            token._id = user._id?.toString()
            token.username = user.username
        }
      return token;
    },
  },
  pages: {
    signIn: "/sign-in",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

/*

*/