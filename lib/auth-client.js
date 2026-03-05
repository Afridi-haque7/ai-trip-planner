import { createAuthClient } from "better-auth/react";
import { phoneNumberClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "http://localhost:3000",
  plugins: [phoneNumberClient()],
});

export const { signIn, signOut, useSession } = authClient;
export const { phoneNumber } = authClient;