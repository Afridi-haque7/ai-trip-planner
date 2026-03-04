import React from "react";
import { Star, UtensilsCrossed } from "lucide-react";
import { useSelector } from "react-redux";
import { selectTripContext } from "@/lib/redux/slices/tripSlice";
import { getCurrencySymbol } from "./helper";

export default function Foods({ foods }) {
  const tripContext = useSelector(selectTripContext);
  const currencySymbol = getCurrencySymbol(
    tripContext?.input?.currency || "INR",
  );

  return (
    <div className=" flex flex-col gap-6 shrink-0">
      {/* Local Food Guide */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Must Try Dishes
          </h3>
        </div>
        <div className="flex flex-col gap-8 ">
          {foods.map((food, idx) => {
            const resturant = food?.topRestaurants?.[0];

            return (
              <div
                key={idx}
                className="flex gap-2 items-center p-2 rounded-lg shadow-md hover:bg-slate-50 transition-all dark:shadow-lg dark:border dark:border-slate-700 dark:hover:bg-slate-800 "
              >
                <div
                  className="size-24 rounded-lg bg-cover bg-center shrink-0"
                  style={{ backgroundImage: `url("${food?.images?.[0]}")` }}
                />
                <div className="flex flex-col gap-1">
                  <div className="flex">
                    <p className="font-bold text-sm text-slate-900 dark:text-white">
                      {food.name}
                    </p>
                    <div
                      className={`ml-auto px-2 py-0.5 rounded text-xs font-bold bg-neutral-200 dark:bg-slate-600 dark:text-slate-50`}
                    >
                      {`${currencySymbol}${food.averagePrice}`}
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-300">
                    {food.description}
                  </p>
                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                    <UtensilsCrossed className="w-3 h-3 text-slate-400 shrink-0" />
                    <p className="text-xs text-slate-500 dark:text-slate-300">
                      {resturant?.name}
                    </p>

                    {resturant?.rating && (
                      <>
                        <span className="text-xs text-slate-400">•</span>
                        <div className="flex items-center gap-0.5">
                          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                            {resturant?.rating}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Map Preview */}
      {/* <div className="rounded-xl overflow-hidden h-48 relative border border-slate-200 dark:border-slate-800 shadow-sm">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCiFOexempor6crPDkYoW0T-9Y_V6ezyvIHv9VSLcFoKTEcaOZJCxVzcjpseoqRIbONl8pdpUP66D93bpwokyfwxQNhB4QdcWyHCXTkiQGUzE0FQxiGOsFEsMKklH7_xyPQgHmZmzBj-u3uy0WDcyeg371te6OvvohG9wVgMrrzjmv0Jixls7Uae03okREZbcw3nAko42IE14c1Xx2qz-LdnFzVuWkNQUCCWerDeMfkqvSRugSIHHCScWHrkyodTdeI6vWCS9staoAW")',
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/10 hover:bg-black/20 transition-colors cursor-pointer group">
                <button className="bg-white text-slate-900 px-4 py-2 rounded-full font-bold shadow-lg flex items-center gap-2 transform group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-primary">map</span>
                  Open Interactive Map
                </button>
              </div>
            </div> */}
    </div>
  );
}
