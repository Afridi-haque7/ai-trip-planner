"use client";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useSession, signIn, signOut } from "@/lib/auth-client";
import { LiquidGlassCard } from "@/components/liquid-glass";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import {
  setUserDetails,
  setUserInitialized,
  clearUser,
  selectUserProfile,
} from "@/lib/redux/slices/userSlice";
import { setChats, clearChats } from "@/lib/redux/slices/chatsSlice";
import { useRouter } from "next/navigation";

const ProfileAvatar = ({}) => {
  const [mounted, setMounted] = useState(false);
  const userProfile = useSelector(selectUserProfile);
  const { name = "John Doe", profileImage = "" } = userProfile;
    const router = useRouter();
  useEffect(() => {
    setMounted(true);
  }, []);

  const initials = name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const dispatch = useDispatch();

  const handleLogout = async () => {
    dispatch(clearUser());
    dispatch(clearChats());
    await signOut();
    router.push("/login");
  };
  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Avatar className={`ring-2 ring-offset-0 ring-border`}>
            <AvatarImage
              src={profileImage}
              alt="@shadcn"
              className={`ring-1 ring-offset-1 ring-primary/20`}
            />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem asChild>
            <Link href={`/dashboard`}>Profile</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/contact`}>Report Issues</Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleLogout}>Sign Out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

function Navbar() {
  const { data: session } = useSession();
  const dispatch = useDispatch();
  const router = useRouter();

  useEffect(() => {
    if (!session) return;

    const name = session?.user?.name;
    const email = session?.user?.email;
    const googleId = session?.user?.googleId;
    const profileImage = session?.user?.image;

    const initializeUser = async () => {
      try {
        // Upsert user in DB on every login
        const signUpRes = await fetch("/api/sign-up", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email }),
        });

        if (!signUpRes.ok) {
          console.error("Failed to save user during sign-up");
          return;
        }

        // Fetch full user details (subscription, history, _id)
        const detailsRes = await fetch("/api/get-user-details", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        if (!detailsRes.ok) {
          console.error("Failed to fetch user details");
          return;
        }

        const userDetails = await detailsRes.json();

        // Store complete user profile in Redux
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
          }),
        );

        // Fetch all trips and store in Redux
        const tripIds = userDetails.history || [];
        if (tripIds.length > 0) {
          const allTrips = await Promise.all(
            tripIds.map((tripId) =>
              fetch("/api/get-trip", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tripid: tripId }),
              })
                .then((res) => (res.ok ? res.json() : null))
                .catch((err) => {
                  console.error(`Failed to fetch trip ${tripId}:`, err);
                  return null;
                }),
            ),
          );
          dispatch(setChats(allTrips.filter(Boolean)));
        } else {
          dispatch(setChats([]));
        }

        // Mark user data as fully loaded
        dispatch(setUserInitialized(true));
      } catch (error) {
        console.error("Error initializing user data:", error);
      }
    };

    initializeUser();
  }, [session, dispatch]);

  return (
    <>
      <nav className="w-full fixed top-0 left-0 flex backdrop-blur-md z-50 justify-between px-4 py-4 ">
        {/* Logo & branding */}
        <Link href="/">
          <div className="flex gap-2 justify-center items-center text-foreground ">
            <svg
              fill="currentColor"
              viewBox="-1 0 19 19"
              xmlns="http://www.w3.org/2000/svg"
              className="w-8 h-8"
            >
              <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
              <g
                id="SVGRepo_tracerCarrier"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></g>
              <g id="SVGRepo_iconCarrier">
                <path d="M16.417 9.579A7.917 7.917 0 1 1 8.5 1.662a7.917 7.917 0 0 1 7.917 7.917zm-3.468-4.393c-.277-.277-1.211.208-1.488.485L9.754 7.379l-.015-.005-4.772-1.297a.678.678 0 0 0-.593.158l-.428.428a.253.253 0 0 0 .06.422L7.18 8.84l.557.557-1.472 1.47a2.47 2.47 0 0 0-.376.56L4.81 11.1a.654.654 0 0 0-.59.148l-.132.131a.355.355 0 0 0 0 .502l.776.776.015.014.587.588.015.015.775.776a.356.356 0 0 0 .502 0l.132-.132a.653.653 0 0 0 .148-.59l-.328-1.08a2.483 2.483 0 0 0 .56-.377L8.74 10.4l.557.556 1.753 3.174a.253.253 0 0 0 .422.06l.428-.428a.678.678 0 0 0 .158-.594l-1.296-4.77-.005-.016 1.707-1.708c.277-.277.762-1.21.485-1.488z"></path>
              </g>
            </svg>
            <p className="font-bold text-xl cursor-pointer">Trip Tailor</p>
          </div>
        </Link>

        {/* Nav items */}
        <div className="flex gap-8">
          <AnimatedThemeToggler />
          <div>
            {session ? (
              <div className="flex gap-2 md:gap-4 justify-center items-center">
                <ProfileAvatar />
              </div>
            ) : (
              <Button
                variant="default"
                onClick={() => {
                  // const baseUrl =
                  //   process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
                  // signIn("google", {
                  //   callbackUrl: `${baseUrl}/create-trip`,
                  // });
                  router.push("/login")
                }}
              >
                Sign Up
              </Button>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}

export default Navbar;
