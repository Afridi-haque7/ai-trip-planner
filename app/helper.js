import { useSession, signIn } from "next-auth/react";
import crypto from "crypto";

// Function to generate a unique tripId
export const generateTripId = () => {
  return crypto.randomBytes(16).toString("hex");
};

// Function to check if user is authenticated
export const checkAuthentication = (session, router) => {
  if (!session) {
    router.push("/restricted");
    return false;
  }
  return true;
};

// Function to redurect unauthenticated users
export const redirectIfUnauthenticated = async (session, router) => {
  const tripId = generateTripId();
  const baseUrl = "http://localhost:3000";
    // process.env.NODE_ENV === "development"
    //   ? "http://localhost:3000"
    //   : process.env.NEXTAUTH_URL;
  if (!session) {
    await signIn("google", {
      callbackUrl: `http://localhost:3000/create-trip/${tripId}`,
    });
    return;
  }
  try {
    if (checkAuthentication(session, router)) {
      router.push(`/create-trip/${tripId}`);
    }
  } catch (error) {
    console.error("Error during redirection:", error);
  }
};
