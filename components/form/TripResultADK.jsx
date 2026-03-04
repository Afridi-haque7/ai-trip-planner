"use client";
import React, { useState } from "react";
import { AlertCircle } from "lucide-react";
import Overview from "@/components/form/results/Overview";
import Itinerary from "@/components/form/results/Itinerary";
import Attractions from "@/components/form/results/Attractions";
import Budget from "@/components/form/results/Budget";
import Foods from "@/components/form/results/Foods";

function TripResultADK({ data }) {
  if (!data || !data.input) {
    return (
      <div className="flex flex-col gap-4 mx-auto px-4 py-8 text-center">
        <AlertCircle className="w-12 h-12 mx-auto text-yellow-500" />
        <p className="text-xl text-muted-foreground">No trip data available</p>
      </div>
    );
  }

  const {
    input = {},
    derived = {},
    weather = {},
    places = {},
    itinerary = {},
    budget = {},
  } = data;
  const {
    recommendedAreas = [],
    foods = [],
    attractions = [],
    hotelRecommendations = [],
  } = places;

  const [currentDay, setCurrentDay] = useState(1);
  return (
    <div className="relative mb-12 flex min-h-screen w-full flex-col overflow-x-hidden bg-white dark:bg-slate-950">
      {/* Main Content */}
      <main className="flex flex-1 justify-center py-8 px-4 sm:px-8">
        <div className="flex w-full max-w-[1280px] gap-8 flex-col lg:flex-row">
          {/* Main Content Column */}
          <div className="flex flex-1 flex-col gap-8">
            {/* Overview Component */}
            <div className="flex gap-4">
              <div className="w-[70%]">
                <Overview
                  weather={weather}
                  input={input}
                  budget={budget}
                  derived={derived}
                  recommendedAreas={recommendedAreas}
                />
              </div>
              <div className="w-[30%]">
                <Budget budget={budget} />
              </div>
            </div>

            {/* Attractions Component */}
            <div className="flex gap-4">
              <div className="w-[60%]">
                <Attractions attractions={attractions} />
              </div>
              <div className="w-[40%] mt-10">
                <Foods foods={foods} />
              </div>
            </div>
            {/* Itinerary Component */}
            <div>
              <Itinerary
                currentDay={currentDay}
                setCurrentDay={setCurrentDay}
                itinerary={itinerary}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default TripResultADK;
