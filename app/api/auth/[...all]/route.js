// app/api/auth/[...all]/route.js
export const dynamic = 'force-dynamic';
export const maxDuration = 30; // increase Vercel timeout to 30s

import clientPromise from "@/lib/mongodb";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { emailOTP } from "better-auth/plugins";
import { Resend } from "resend";
import { toNextJsHandler } from "better-auth/next-js";

const resend = new Resend(process.env.RESEND_API_KEY || "");

let authInstance;

async function getAuth() {
  if (authInstance) return authInstance;

  const client = await clientPromise;
  const db = client.db("trip-tailor");

  authInstance = betterAuth({
    database: mongodbAdapter(db),
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",

    trustedOrigins: [
      "http://localhost:3000",
      "https://trip-tailor-dev.vercel.app",
      process.env.NEXT_PUBLIC_APP_URL,
      process.env.BETTER_AUTH_URL,
    ].filter(Boolean),

    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID || "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      },
    },

    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
      cookieAttributes: {
        secure: true,
        httpOnly: true,
        sameSite: "lax",
      },
    },

    plugins: [
      emailOTP({
        sendVerificationOTP: async ({ email, otp }) => {
          await resend.emails.send({
            from: process.env.RESEND_FROM,
            to: email,
            subject: "Your TripTailor verification code",
            text: `Your OTP is: ${otp}. Valid for 10 minutes.`,
          });
        },
        otpLength: 6,
        expiresIn: 600,
      }),
    ],
  });

  return authInstance;
}

export async function GET(request) {
  const auth = await getAuth();
  return toNextJsHandler(auth).GET(request);
}

export async function POST(request) {
  const auth = await getAuth();
  return toNextJsHandler(auth).POST(request);
}