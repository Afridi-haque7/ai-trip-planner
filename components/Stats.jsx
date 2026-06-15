"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "./ui/card";
import { useSelector } from "react-redux";
import {
  selectSubscriptionDetails,
  selectUserProfile,
} from "@/lib/redux/slices/userSlice";

const Stats = ({ data, query, className, iconClassName }) => {
  // Read straight from Redux (populated once by AuthProvider). This component is
  // rendered once per stat card, so the old per-instance /api/get-user-details
  // fetch meant 3× the calls on every render — now zero.
  const { subscriptionPlan, subscriptionEndDate } = useSelector(
    selectSubscriptionDetails
  );
  const { chats } = useSelector(selectUserProfile);

  const totalTrips = chats?.length ?? 0;
  const planLabel = subscriptionPlan
    ? subscriptionPlan.charAt(0).toUpperCase() + subscriptionPlan.slice(1)
    : "Free";

  const value =
    query.value === "subscriptionPlan"
      ? planLabel
      : query.value === "totalTrips"
        ? totalTrips
        : query.value === "subscriptionEndDate"
          ? subscriptionEndDate || "N/A"
          : "N/A";

  return (
    <Card
      className={cn(
        "w-full h-20 bg-card text-foreground flex gap-1 items-center justify-between rounded-sm border-0 border-l-8 border-destructive",
        className
      )}
    >
      <div
        className={cn(
          "basis-1/4 px-4 w-full h-full flex items-center justify-center",
          iconClassName
        )}
      >
        {query.icon}
      </div>
      <div className="basis-3/4 px-2 w-full h-full flex flex-col justify-around">
        <CardHeader className="text-xl font-semibold p-0">
          {query.label}
        </CardHeader>
        <CardContent className="p-0">
          <p className="text-2xl font-bold">{value}</p>
        </CardContent>
      </div>
    </Card>
  );
};

export default Stats;
