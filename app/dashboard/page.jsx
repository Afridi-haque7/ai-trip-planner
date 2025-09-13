"use client";

import { useSession, signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Stats from "@/components/Stats";
import { Timer, Plane, Podcast } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import dynamic from "next/dynamic";
import Image from "next/image";
import {images}  from "@/constants/index";
const MagicCard = dynamic(() => import("@/components/magicui/magic-card.jsx"));

const query = [
  {
    value: "subscriptionPlan",
    label: "Subscription Plan",
    icon: <Podcast className="w-8 h-8" />,
  },
  {
    value: "totalTrips",
    label: "Total Trips",
    icon: <Plane className="w-8 h-8" />,
  },
  {
    value: "subscriptionEndDate",
    label: "Subscription Expires On",
    icon: <Timer className="w-8 h-8" />,
  },
];

function Dashboard() {
  const { data: session, status } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [id, setId] = useState(null);
  const [chats, setChats] = useState([]);
  const router = useRouter();
  const image = (typeof window !== "undefined") ? localStorage?.getItem("profileImage") : "";
  // Redirect to /restricted if user is unauthenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/restricted");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      const fetchUserId = async () => {
        const email = session.user.email;

        try {
          const response = await fetch("/api/get-user-details", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email }),
          });

          // console.log(response);

          if (response.ok) {
            const user = await response.json();
            const userId = user._id;
            const username = user.name;
            const userEmail = user.email;
            const chatArr = user.history;

            const capitalizedUsername = username
              .split(" ")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ");
            setName(capitalizedUsername);
            setEmail(userEmail);
            setChats(chatArr);
            setId(userId);
            return response;
          } else {
            console.error("Failed to fetch user details");
          }
        } catch (error) {
          console.error("Failed to fetch user details in Dashboard", error);
        }
      };

      fetchUserId();
    }
  }, [session]);

  // Optionally, render a loading state while the session is being determined
  if (status === "loading") {
    return <div className="mt-20 text-xl font-semibold">Loading...</div>;
  }
  return (
    <div className="w-full flex justify-center items-center py-4 px-4 mb-16">
      <main className="mt-32 w-full relative inset-0 flex flex-col items-center gap-10">
        {/* Header */}
        <div>
          <h1 className="text-3xl md:text-4xl lg:text-6xl font-extrabold text-center">
            <span className="text-white">Welcome Back, </span>
            <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">
              {name}
            </span>
          </h1>
        </div>
        {/* Stats section */}
        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-12 p-8">
          {query.map((item, index) => (
            <Stats
              key={index}
              query={item}
              data={id}
              className={`h-28 ${
                index == 0
                  ? "border-purple-500"
                  : index == 1
                  ? "border-green-500"
                  : "border-red-500"
              }`}
              iconClassName={`${
                index == 0
                  ? "bg-purple-500/20"
                  : index == 1
                  ? "bg-green-500/20"
                  : "bg-red-500/20"
              }`}
            />
          ))}
        </div>

        <div className="w-full flex flex-col md:flex-row gap-8 justify-evenly">
          {/* user details */}
          <div className="w-full max-w-md">
            <Card className="w-full shadow-none border-none text-white p-0">
              <MagicCard gradientColor={"#262626"} className="p-8 border-none">
                <CardHeader className=" p-4 ">
                  <CardTitle className="flex flex-col gap-1 items-center ">
                    <span className="text-4xl ">Your Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <form>
                    <div className="grid gap-4">
                      <div className="w-full flex justify-center">
                        <Image
                          src={image}
                          className="w-24 h-24 rounded-full"
                          width={20}
                          height={20}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="email">Your Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="name@example.com"
                          className={`border-gray-100/10`}
                          value={email}
                          readOnly
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="name">Your Name</Label>
                        <Input
                          id="name"
                          type="text"
                          placeholder="Enter your name"
                          className={`border-gray-100/10`}
                          value={name}
                          readOnly
                        />
                      </div>
                    </div>
                  </form>
                </CardContent>
              </MagicCard>
            </Card>
          </div>
          {/* Trip section */}
          <div className="w-full max-w-md">
            <Card className="w-full shadow-none border-none text-white p-0">
              <MagicCard gradientColor={"#262626"} className="p-8 border-none">
                <CardHeader className=" p-4 ">
                  <CardTitle className="flex flex-col gap-1 items-center ">
                    <span className="text-4xl ">Your Trips</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 grid grid-cols-3">
                  {chats && chats.length > 0 ? (
                    chats.map((item, index) => (
                      <Link href={`/view-trip/${item}`} key={index}>
                        <div>
                          <div className="flex flex-col items-center p-2 rounded-sm bg-white/10 cursor-pointer">
                            <div>
                              <Image
                                src={images[4]}
                                width={16}
                                height={16}
                                className="w-24 h-24 rounded-sm mb-2"
                              />
                            </div>
                            <p>Trip {index + 1} </p>
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <p>No Chats found</p>
                  )}
                </CardContent>
              </MagicCard>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;