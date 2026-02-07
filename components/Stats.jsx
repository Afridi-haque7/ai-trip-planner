"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useSession, signIn } from "next-auth/react";

const Stats = ({ data, query, className, iconClassName }) => {
  const { data: session } = useSession();
  const [subscriptionPlan, setSubscriptionPlan] = useState("Free");
  const [totalTrips, setTotalTrips] = useState(0);
  const [subscriptionEndDate, setSubscriptionEndDate] = useState(null);

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

          if (response.ok) {
            const user = await response.json();

            setSubscriptionPlan(
              user?.subscriptionPlan?.charAt(0).toUpperCase() +
                user?.subscriptionPlan?.slice(1)
            );
            setSubscriptionEndDate(user?.subscriptionEndDate);
            setTotalTrips(user?.history?.length);

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

  return (
    <>
      <Card
        className={cn(
          "w-full h-20 bg-card text-foreground flex gap-1 items-center justify-between rounded-sm border-0 border-l-8 border-destructive",
          className
        )}
      >
        <div className={cn("basis-1/4 px-4 w-full h-full flex items-center justify-center", iconClassName)}>{query.icon}</div>
        <div className="basis-3/4 px-2 w-full h-full flex flex-col justify-around">
          <CardHeader className="text-xl font-semibold p-0">
            {query.label}
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-2xl font-bold">
              {query.value === "subscriptionPlan"
                ? subscriptionPlan
                : query.value === "totalTrips"
                ? totalTrips
                : query.value === "subscriptionEndDate"
                ? subscriptionEndDate
                  ? subscriptionEndDate
                  : "N/A"
                : "N/A"}
            </p>
          </CardContent>
        </div>
      </Card>
    </>
  );
};

export default Stats;