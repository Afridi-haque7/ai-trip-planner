"use client";

import { useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import Error from "@/components/Error";
import TripResultADK from "@/components/form/TripResultADK";
import { setTripContext } from "@/lib/redux/slices/tripSlice";
import { selectChatByTripId } from "@/lib/redux/slices/chatsSlice";
import { selectIsUserInitialized } from "@/lib/redux/slices/userSlice";
import confetti from "canvas-confetti";
export const dynamic = "force-dynamic";

export default function ViewTrip() {
  const params = useParams();
  const tripid = params.tripid;
  const dispatch = useDispatch();
  const isInitialized = useSelector(selectIsUserInitialized);
  const trip = useSelector(selectChatByTripId(tripid));

  const handleClick = useCallback(() => {
    const end = Date.now() + 3 * 1000; // 3 seconds
    const colors = ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1"];
    const frame = () => {
      if (Date.now() > end) return;
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        startVelocity: 60,
        origin: { x: 0, y: 0.5 },
        colors: colors,
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        startVelocity: 60,
        origin: { x: 1, y: 0.5 },
        colors: colors,
      });
      requestAnimationFrame(frame);
    };
    frame();
  }, [tripid]);

  useEffect(() => {
    const key = `confetti-shown-${tripid}`;
    if (!sessionStorage.getItem(key)) {
      handleClick();
      sessionStorage.setItem(key, "true");
    }
  }, [tripid]);

  useEffect(() => {
    if (trip) {
      dispatch(setTripContext(trip));
    }
  }, [trip, dispatch]);

  if (!isInitialized) {
    return (
      <div className="mt-32 text-center text-2xl">Loading trip details...</div>
    );
  }

  if (!trip) {
    return <Error />;
  }

  return (
    <div className="w-full flex justify-center itemms-center py-4 px-4 lg:px-2">
      <main className="mt-20 relative inset-0">
        <div>
          <h1
            className="text-2xl md:text-3xl lg:text-5xl font-bold text-center 
          bg-gradient-to-r from-pink-500 via-red-500 to-orange-500 bg-clip-text text-transparent"
          >
            Your AI-Planned Trip
          </h1>
          <p className="text-center mx-auto px-2 mt-4 text-md text-gray-500">
            Here's your personalized travel itinerary powered by advanced AI
            agents.
          </p>
        </div>
        <div className="mt-8 mx-1 md:mx-4 border rounded-2xl">
          <TripResultADK data={trip} />
        </div>
      </main>
    </div>
  );
}
