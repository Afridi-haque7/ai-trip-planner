import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { emailOTP } from "better-auth/plugins";
import { MongoClient } from "mongodb";
import { Resend } from "resend";

// ── MongoDB: direct connection (no top-level await) ───────────────────────────
const mongoClient = new MongoClient(process.env.MONGODB_URI || "mongodb://localhost:27017");
const db = mongoClient.db("trip-tailor");
// MongoClient connects lazily on first operation — no await needed here

// ── Resend ────────────────────────────────────────────────────────────────────
const resend = new Resend(process.env.RESEND_API_KEY || "");

// ── Auth ──────────────────────────────────────────────────────────────────────
export const auth = betterAuth({
  database: mongodbAdapter(db),

  secret: process.env.BETTER_AUTH_SECRET || "build-time-placeholder",
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
      secure: process.env.NODE_ENV === "production",
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
          text: `Your TripTailor verification code is: ${otp}. Valid for 10 minutes.`,
        });
        console.log(`[Auth] OTP sent to ${email}`);
      },
      otpLength: 6,
      expiresIn: 600,
    }),
  ],
});