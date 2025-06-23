import { NextAuth } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

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
        password: {
          label: "password",
          type: "password",
        },
      },
      async authorize(credentials, req) {
        await dbConnect();
        try {
          const user = await User.findOne({
            email: credentials.email,
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
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        await dbConnect();
        try {
          // Check if user already exists
          const existingUser = await User.findOne({ email: user.email });

          if (existingUser) {
            // Update user info if needed
            if (!existingUser.googleId) {
              existingUser.googleId = user.id;
              await existingUser.save();
            }
            return true;
          } else {
            // Create new user for Google sign-in
            const newUser = new User({
              name: user.name,
              email: user.email,
              googleId: user.id,
              username: user.email.split("@")[0], // Generate username from email
              // No password for Google users
            });
            await newUser.save();
            return true;
          }
        } catch (error) {
          console.error("Error during Google sign-in:", error);
          return false;
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token._id;
        session.user.username = token.username;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token._id = user._id?.toString();
        token.username = user.username;
      }
      // For Google sign-in, fetch user details from database
      if (account?.provider === "google" && user?.email) {
        await dbConnect();
        const dbUser = await User.findOne({ email: user.email });
        if (dbUser) {
          token._id = dbUser._id.toString();
          token.username = dbUser.username;
        }
      }
      return token;
    },
  },
  pages: {
    signIn: "/sign-in",
    signUp: "/sign-up",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

/*

*/
