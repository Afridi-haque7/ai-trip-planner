import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { phoneNumber } from "better-auth/plugins";
import { MongoClient } from "mongodb";
import twilio from "twilio";

// ── MongoDB: direct connection (no top-level await) ───────────────────────────
const mongoClient = new MongoClient(process.env.MONGODB_URI);
const db = mongoClient.db("trip-tailor");
// MongoClient connects lazily on first operation — no await needed here

// ── Twilio ────────────────────────────────────────────────────────────────────
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const auth = betterAuth({
  database: mongodbAdapter(db),

  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
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
    phoneNumber({
      sendOTP: async ({ phoneNumber, code }) => {
        const fromNumber = process.env.TWILIO_PHONE_NUMBER;
        const toNumber = phoneNumber;

        if (!fromNumber) {
          throw new Error("TWILIO_PHONE_NUMBER is not configured");
        }

        if (fromNumber === toNumber) {
          throw new Error(
            "Invalid phone configuration: From and To numbers cannot be the same. " +
            "Check that TWILIO_PHONE_NUMBER is set to your Twilio number, not the user's number."
          );
        }

        await twilioClient.messages.create({
          body: `Your TripTailor verification code is: ${code}. Valid for 10 minutes.`,
          from: fromNumber,
          to: toNumber,
        });
        console.log(`[Auth] OTP sent to ${phoneNumber}`);
      },
      otpLength: 6,
      expiresIn: 600,
    }),
  ],
});