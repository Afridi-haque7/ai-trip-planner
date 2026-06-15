'use client';

import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ThemeProvider } from "@/components/theme-provider";
import { useSession } from "@/lib/auth-client";
import {
  setUserDetails,
  setUserInitialized,
  selectIsUserInitialized,
  selectUserEmail,
} from "@/lib/redux/slices/userSlice";
import { setChats } from "@/lib/redux/slices/chatsSlice";

/**
 * One-time user bootstrap for the whole app.
 *
 * AuthProvider mounts ONCE at the app root (in app/layout.js) and never unmounts
 * across navigation — so this is the single correct place to load the user. The
 * old logic lived in the Navbar (and Stats), which re-ran on every render /
 * navigation and N+1-fetched the trip history, flooding the API.
 *
 * Guards: only runs when there's a session AND we haven't already loaded THIS
 * user (state is persisted via redux-persist), and never concurrently.
 */
function useUserBootstrap() {
  const { data: session } = useSession();
  const dispatch = useDispatch();
  const isInitialized = useSelector(selectIsUserInitialized);
  const loadedEmail = useSelector(selectUserEmail);
  const inFlightRef = useRef(false);

  const sessionEmail = session?.user?.email;

  useEffect(() => {
    if (!sessionEmail) return;
    if (isInitialized && loadedEmail === sessionEmail) return;
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    const name = session?.user?.name;
    const googleId = session?.user?.googleId;
    const profileImage = session?.user?.image;

    (async () => {
      try {
        // Upsert the user once per session.
        const signUpRes = await fetch("/api/sign-up", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email: sessionEmail }),
        });
        if (!signUpRes.ok) return;

        const detailsRes = await fetch("/api/get-user-details", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: sessionEmail }),
        });
        if (!detailsRes.ok) return;
        const userDetails = await detailsRes.json();

        dispatch(
          setUserDetails({
            _id: userDetails._id || "",
            name: userDetails.name || "",
            email: userDetails.email || "",
            googleId: googleId || "",
            profileImage: profileImage || "",
            chats: userDetails.history || [],
            subscriptionPlan: userDetails.subscriptionPlan || "free",
            subscriptionEndDate: userDetails.subscriptionEndDate || null,
            monthlyTripCount: userDetails.monthlyTripCount ?? 0,
          })
        );

        // One batched call for the entire trip history (was N× /api/get-trip).
        const tripsRes = await fetch("/api/get-trips");
        const tripsJson = tripsRes.ok ? await tripsRes.json() : { trips: [] };
        dispatch(setChats(tripsJson.trips || []));

        dispatch(setUserInitialized(true));
      } catch (error) {
        console.error("[AuthProvider] user bootstrap failed:", error);
      } finally {
        inFlightRef.current = false;
      }
    })();
  }, [sessionEmail, isInitialized, loadedEmail, dispatch]);
}

export default function AuthProvider({ children }) {
  useUserBootstrap();
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      {children}
    </ThemeProvider>
  );
}
