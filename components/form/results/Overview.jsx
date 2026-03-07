import React from "react";
import {
  Pencil,
  Share2,
  DollarSign,
  Calendar,
  PlaneTakeoff,
  Users,
  Thermometer,
  Droplets,
  Wind,
  Flower2,
  Sun,
  MapPin,
  Home,
  Utensils,
  Music,
  Backpack,
  Heart,
  Wallet,
  Crown,
  Zap,
} from "lucide-react";

export default function Overview({
  weather,
  input,
  budget,
  derived,
  recommendedAreas,
}) {
  const noOfDays = derived.numberOfDays || 0;
  const noOfNights = noOfDays > 0 ? noOfDays - 1 : 0;
  const origin = input.origin || "Unknown";
  const cost = `${budget?.totalEstimatedCostPerPerson?.min} - ${budget?.totalEstimatedCostPerPerson?.max} ${input.currency}`;

  const overViewStats = [
    { icon: DollarSign, label: "Est. Cost", value: cost },
    {
      icon: Calendar,
      label: "Duration",
      value: `${noOfDays} days / ${noOfNights} nights`,
    },
    {
      icon: Users,
      label: "Travelers",
      value: `${input.numberOfPeople || "1"}`,
    },
    { icon: PlaneTakeoff, label: "Origin", value: `${origin}` },
  ];

  const weatherStats = [
    {
      icon: Thermometer,
      label: "Avg Temp",
      value: `${weather.temperatureRange}`,
      color: "orange",
    },
    {
      icon: Droplets,
      label: "Rainfall",
      value: "Low Chance",
      color: "blue",
    },
    {
      icon: Flower2,
      label: "Best Time to Visit",
      value: `${weather.bestSeasonToVisit}`,
      color: "teal",
    },
    {
      icon: Wind,
      label: "Avoid Time To Visit",
      value: `${weather.avoidSeason}`,
      color: "teal",
    },
  ];

  return (
    <div className="w-full h-full flex flex-col gap-8 rounded-xl">
      <section className="rounded-xl bg-white dark:bg-slate-900 p-6 shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                Generated Plan
              </span>
              <span className="text-slate-500 dark:text-slate-400 text-sm">
                Created 2 hours ago
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-2">
              {input.destination}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">{`${input.startDate} to ${input.endDate}, ${noOfDays} days`}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-sm transition-colors">
              <Share2 className="w-4 h-4" />
              Share
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 font-medium text-sm transition-all">
              <Pencil className="w-4 h-4" />
              Edit Params
            </button>
          </div>
        </div>

        {/* Key Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {overViewStats.map((stat, idx) => {
            const IconComponent = stat.icon;
            return (
              <div
                key={idx}
                className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700"
              >
                <div className="flex items-center gap-2 text-primary mb-1">
                  <IconComponent className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {stat.label}
                  </span>
                </div>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Weather Section */}
      <section>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Sun className="w-4 h-4" />
          Weather & Best Season
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {weatherStats.map((weather, idx) => {
            const IconComponent = weather.icon;
            const colorMap = {
              orange: "text-orange-500",
              blue: "text-blue-500",
              teal: "text-teal-500",
            };
            return (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center"
              >
                <IconComponent
                  className={`w-8 h-8 mb-2 ${colorMap[weather.color]}`}
                />
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                  {weather.label}
                </p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  {weather.value}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Best Areas to Stay
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {recommendedAreas?.slice(0, 4).map((area, idx) => {
            const suitableForMap = {
              budget: {
                icon: Wallet,
                color:
                  "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
                label: "Budget",
              },
              family: {
                icon: Users,
                color:
                  "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
                label: "Family",
              },
              luxury: {
                icon: Crown,
                color:
                  "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300",
                label: "Luxury",
              },
              nightlife: {
                icon: Zap,
                color:
                  "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
                label: "Nightlife",
              },
              couples: {
                icon: Heart,
                color:
                  "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
                label: "Couples",
              },
            };
            const areaType =
              suitableForMap[area?.suitableFor] || suitableForMap.family;
            const IconComponent = areaType.icon;

            return (
              <div
                key={idx}
                className="group bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary/50 dark:hover:border-primary/50 hover:shadow-lg dark:hover:shadow-lg/50 transition-all duration-300 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between">
                  <IconComponent className={`w-6 h-6`} />
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${areaType.color} capitalize`}
                  >
                    {area?.suitableFor}
                  </span>
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                    {area?.name}
                  </h4>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
