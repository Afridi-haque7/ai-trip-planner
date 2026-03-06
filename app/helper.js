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
  if (!session) {
    router.push("/login?redirect=/dashboard");
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
