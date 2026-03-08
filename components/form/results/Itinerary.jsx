import React, { useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Sunrise,
  Clock4,
  Sun,
  Moon,
  Footprints,
  Utensils,
  BusFront,
} from "lucide-react";
import { capitalizeFirstLetter, getTimeOfDay, getCurrencySymbol, minutesToHours, getSegment } from "./helper";

const ItineraryCard = ({ activity, currency = "USD" }) => {
  const timeOfDay = getTimeOfDay(activity.startTime);
  const timeIcon = {
    Morning: <Sunrise className="w-5 h-5 text-yellow-500" />,
    Afternoon: <Sun className="w-5 h-5 text-yellow-500" />,
    Evening: <Moon className="w-5 h-5 text-yellow-500" />,
  };
  const costPerPerson = activity.estimatedCostPerPerson || 0;
  const time = minutesToHours(activity?.estimatedDurationMinutes || 60);

  return (
    <>
      <div className="relative flex gap-6 group">
        <div className="relative z-10 flex-none size-14 rounded-full bg-white dark:bg-slate-900 border-4 border-slate-100 dark:border-slate-800 flex items-center justify-center shadow-sm">
          {timeIcon[timeOfDay] || (
            <Clock4 className="w-5 h-5 text-yellow-500" />
          )}
        </div>
        <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h4 className="font-bold text-lg text-slate-900 dark:text-white">
                {activity?.name}
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {`${activity.startTime} - ${activity.endTime}`} •{" "}
                {capitalizeFirstLetter(activity.type)}
              </p>
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded text-xs font-bold text-slate-600 dark:text-slate-300">
              {costPerPerson === 0 ? "Free Entry" : `${getCurrencySymbol(currency)} ${costPerPerson}`}
            </div>
          </div>
          <p className="text-slate-600 dark:text-slate-300 text-sm mb-4 leading-relaxed">
            {activity.description}
          </p>
          <div className="flex gap-4">
            <div
              className="w-24 h-24 rounded-lg bg-cover bg-center shrink-0"
              style={{
                backgroundImage:
                  'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCbNXa2pBkgyX1APIjd-lBFZFoAmdL7r5LMJT5iQw_RwuhQMFK4X__KsmYpiu77Xqo4mbe4i0WpEkKYhvX_qbGfXdvnwVogEbeMcXgSsyu9UNdWktB6YrL6ZvsScDPlhTPcO6_cC4uXwCRPYcKhpu2iTaKAUVrunXaEmhkrABimgEpLRNi4SXJYY99DEWnDQ36uKwAghnLm_8KO3zSaAkwr2h6U-YcTCQg3Yxj9MYkqZSJWxzAtTEs70ekKvXldmkgURQLuGWjHXoZb")',
              }}
            />
            <div className="flex flex-col gap-2 justify-center">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Footprints className="w-4 h-4" />
                <span>{`${getSegment(activity?.type)}`} total</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Clock4 className="w-4 h-4" />
                <span>{`${time}`} recommended</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const DayThemeCard = ({
  day,
  date,
  theme = "General",
  weatherNote = "No weather info",
  travelSegments = [],
  mealsIncluded = {},
  dailyEstimatedCostPerPerson = 100,
  currency = "USD",
}) => {
  const mealIcons = {
    breakfast: {
      icon: <Sunrise className="w-3.5 h-3.5" />,
      label: "Breakfast",
    },
    lunch: { icon: <Utensils className="w-3.5 h-3.5" />, label: "Lunch" },
    dinner: { icon: <Moon className="w-3.5 h-3.5" />, label: "Dinner" },
  };

  const bgGradients = [
    "from-teal-600 via-cyan-500 to-sky-400",
    "from-orange-500 via-amber-400 to-yellow-300",
    "from-rose-400 via-pink-400 to-fuchsia-400",
    "from-slate-800 via-slate-700 to-indigo-800"
  ]
  const randomGradient = bgGradients[(day-1) % bgGradients.length];

  const includedMeals = Object.entries(mealsIncluded).filter(([_, v]) => v);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden">
      {/* Gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${randomGradient} opacity-90`} />

      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 opacity-20 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Decorative circle top-right */}
      <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-black/10 blur-2xl" />

      {/* Content */}
      <div className="relative z-10 p-6 text-white">
        {/* Header row */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full tracking-widest uppercase">
                Day {day}
              </span>
              {date && (
                <span className="flex items-center gap-1.5 text-white/70 text-xs font-medium">
                  <CalendarDays className="w-3.5 h-3.5" />
                  {date}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold tracking-tight leading-tight mt-2">
              {capitalizeFirstLetter(theme)}
            </h2>
          </div>

          {/* Cost badge */}
          <div className="bg-black/20 backdrop-blur-sm rounded-xl px-3 py-2 text-right border border-white/10">
            <p className="text-white/60 text-[10px] uppercase tracking-widest font-semibold">
              Est. / person
            </p>
            <p className="text-white text-lg font-bold leading-tight">
              {`${getCurrencySymbol(currency)} ${dailyEstimatedCostPerPerson}`}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/20 mb-4" />

        {/* Weather + Meals row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Weather */}
          {weatherNote && (
            <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs font-medium text-white/90 border border-white/10">
              <Sun className="w-3.5 h-3.5 text-yellow-300 shrink-0" />
              <span className="line-clamp-1">{weatherNote}</span>
            </div>
          )}

          {/* Meals */}
          {includedMeals.map(([meal]) => (
            <div
              key={meal}
              className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs font-medium text-white/90 border border-white/10"
            >
              {mealIcons[meal]?.icon}
              <span>{mealIcons[meal]?.label ?? meal}</span>
            </div>
          ))}

          {/* Travel segments */}
          {travelSegments.length > 0 && (
            <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs font-medium text-white/90 border border-white/10">
              <BusFront className="w-3.5 h-3.5 shrink-0" />
              <span>
                {travelSegments.length} transfer
                {travelSegments.length > 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function Itinerary({
  currentDay: propCurrentDay,
  setCurrentDay: propSetCurrentDay,
  itinerary,
  currency = "USD",
}) {
  const [currentDay, setCurrentDay] = useState(1);
  const totalDays = itinerary.totalDays || itinerary.days?.length;
  const days = itinerary.days || [];

  return (
    <div>
      {/* Itinerary Timeline */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-primary" />
            Day-by-Day Itinerary
          </h3>
          <div className="flex gap-2">
            <button
              className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
              onClick={() => setCurrentDay(Math.max(1, currentDay - 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold self-center">
              Day {currentDay} of {totalDays}
            </span>
            <button
              className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
              onClick={() => setCurrentDay(Math.min(totalDays, currentDay + 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-6 relative">
          {/* Vertical Line */}
          <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-slate-200 dark:bg-slate-800" />

          {days.map((day, index) => {
            const {
              theme = "General",
              weatherNote = "No weather info",
              activities = [],
              travelSegments = [],
              mealsIncluded = {},
              dailyEstimatedCostPerPerson,
              date,
            } = day;
            if (index + 1 !== currentDay) return null; // Only render current day

            // activities?.sort((a, b) => a.startTime.localeCompare(b.startTime)); // Sort activities by start time
            if (activities.length === 0) {
              return (
                <div className="relative flex gap-6 group">
                  No activities planned for this day.
                </div>
              );
            }
            return (
              <div key={index} className="flex flex-col gap-8">
                <DayThemeCard
                  day={index + 1}
                  date={date}
                  theme={theme}
                  weatherNote={weatherNote}
                  travelSegments={travelSegments}
                  mealsIncluded={mealsIncluded}
                  dailyEstimatedCostPerPerson={dailyEstimatedCostPerPerson}
                  currency={currency}
                />
                {activities.map((activity, idx) => {
                  return <ItineraryCard activity={activity} key={idx} currency={currency} />;
                })}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default Itinerary;
