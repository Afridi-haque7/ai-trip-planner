"use client";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { LiquidGlassCard } from "@/components/liquid-glass";
import { Avatar,AvatarImage, AvatarFallback } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ProfileAvatar = ({ }) => {
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("John Doe");
  const [image, setImage] = useState("");

  useEffect(() => {
    // Only access localStorage after component is mounted (client-side)
    setMounted(true);
    if (typeof window !== "undefined") {
      setName(localStorage?.getItem("name") || "John Doe");
      setImage(localStorage?.getItem("profileImage") || "");
    }
  }, []);

  const initials = name?.split(" ").map(n => n[0]).join("").toUpperCase();
  
  const handleLogout = () => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    signOut({ callbackUrl: baseUrl });
  }
  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Avatar className={`ring-2 ring-offset-0 ring-neutral-200/20`}>
            <AvatarImage
              src={image}
              alt="@shadcn"
              className={`ring-1 ring-offset-1 ring-blue-700/20`}
            />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>
            <Link href={`/dashboard`}>Profile</Link>
          </DropdownMenuItem>
          <DropdownMenuItem>Report Issue</DropdownMenuItem>
          <DropdownMenuItem onClick={handleLogout}>Sign Out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function Navbar() {
  const { data: session } = useSession();

  useEffect(() => {
    if (session) {
      
      const name = session?.user?.name;
      const email = session?.user?.email;
      const googleId = session?.user?.googleId;
      const profileImage = session?.user?.image;

      try {
        // Only set values that exist
        if (name) localStorage?.setItem("name", name);
        if (email) localStorage?.setItem("email", email);
        if (googleId) localStorage?.setItem("googleId", googleId);
        if (profileImage) localStorage?.setItem("profileImage", profileImage);

        // console.log("User data saved to localStorage");
      } catch (error) {
        console.error("Error saving user data to localStorage:", error.message);
      }
      // API route
      const saveUser = async () => {
        const response = await fetch("/api/sign-up", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name, email }),
        });

        if (response.ok) {
          const user = await response.json();
          // console.log("User saved or retrieved:", user);
        } else {
          console.error("Failed to save user");
        }
      };

      saveUser();
    }
  }, [session]);

  return (
    <>
        <nav
          className="w-full fixed top-0 left-0 flex backdrop-blur-md z-50 justify-between px-4 py-4 "
        >
          {/* Logo & branding */}
          <Link href="/">
            <div className="flex gap-2 justify-center items-center text-white ">
              <svg
                fill="#000000"
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
          <div>
            {session ? (
              <div className="flex gap-2 md:gap-4 justify-center items-center">
                {/* <Link href="/dashboard">
                  <p className="text-xl font-semibold">
                    {session?.user?.name.split(" ")[0]}
                  </p>
                </Link>
                <Button
                  variant="default"
                  onClick={() =>
                    signOut({ callbackUrl: "http://localhost:3000" })
                  }
                >
                  Sign Out
                </Button> */}
                <ProfileAvatar />
              </div>
            ) : (
              <Button
                variant="default"
                onClick={() => {
                  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
                  signIn("google", {
                    callbackUrl: `${baseUrl}/create-trip`,
                  });
                }}
              >
                Sign Up
              </Button>
            )}
          </div>
        </nav>
    </>
  );
}

export default Navbar;
