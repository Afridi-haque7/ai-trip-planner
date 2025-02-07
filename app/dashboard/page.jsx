'use client';

import { useSession, signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function Dashboard() {
  const { data: session, status } = useSession();
  const [name, setName] = useState(null);
  const [email, setEmail] = useState(null);
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

          console.log(response);

          if (response.ok) {
            const user = await response.json();
            const userId = user._id;
            const username = user.name;
            const userEmail = user.email;
            const chatArr = user.history;

            setName(username);
            setEmail(userEmail);
            setChats(chatArr);
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

  console.log(chats);
  
  // Optionally, render a loading state while the session is being determined
  if (status === "loading") {
    return <div className="mt-32 text-xl font-semibold">Loading...</div>;
  }

  return (
    <div className="w-full flex justify-center items-center py-4 px-4">
      <main className="mt-32 relative inset-0 flex flex-col gap-10">
        <div>
          <h1
            className="text-2xl md:text-3xl lg:text-5xl font-bold text-center 
          bg-gradient-to-r from-pink-500 via-red-500 to-orange-500 bg-clip-text text-transparent"
          >
            User Dashboard
          </h1>
          <p className="text-center mx-auto px-2 mt-10 text-md text-gray-500">
            You can find all your details here
          </p>
        </div>
        <div className="w-full min-w-[350px] py-10 px-10 bg-zinc-200 rounded-xl flex flex-col gap-4">
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
                    <Link href={`/view-trip/${item}`} >Chat {index}</Link>
                  </div>
                </div>))
            ) : (
              <p>No Chats found</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;