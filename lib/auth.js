import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { emailOTP } from "better-auth/plugins";
import { Resend } from "resend";
// NO MongoClient import here at all

const resend = new Resend(process.env.RESEND_API_KEY || "");

let authInstance;

export async function getAuth() {
  if (authInstance) return authInstance;

  // Only imported and called at request time, never at build time
  const { getClientPromise } = await import("@/lib/mongodb");
  const client = await getClientPromise();
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
            text: `Your OTP is: ${otp}. Valid for 10 minutes.`,
          });
          console.log(`[Auth] OTP sent to ${email}`);
        },
        otpLength: 6,
        expiresIn: 600,
      }),
    ],
  });

  return authInstance;
}