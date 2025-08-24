'use client';

import { useSession, signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Stats from "@/components/Stats";
import { Timer, Plane, Podcast } from "lucide-react";


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
                                        .split(' ')
                                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                        .join(' ');
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
    <div className="w-full flex justify-center items-center py-4 px-4">
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
        {/* <div className="w-full min-w-[350px] py-10 px-10 bg-zinc-200 rounded-xl flex flex-col gap-4">
          <div className="flex flex-col gap-2 flex-wrap">
            <p className="text-xl flex gap-4">
              <span>Name: </span>
              <span>{name}</span>
            </p>
            <p className="text-xl flex gap-4">
              <span>Email: </span>
              <span>{email}</span>
            </p>
          </div>
          <div>
            <p className="text-xl mb-2">Your Trips: </p>
            {chats && chats.length > 0 ? (
              chats.map((item, index) => (
                <div key={index}>
                  <div>
                    <Link href={`/view-trip/${item}`}>Chat {index}</Link>
                  </div>
                </div>
              ))
            ) : (
              <p>No Chats found</p>
            )}
          </div>
        </div> */}
      </main>
    </div>
  );
}

export default Dashboard;