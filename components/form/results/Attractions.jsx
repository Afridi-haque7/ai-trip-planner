import React from "react";
import { Star, ShipWheel } from "lucide-react";
import { capitalizeFirstLetter, getCurrencySymbol } from "./helper";
import { useSelector } from 'react-redux';
import { selectTripContext } from '@/lib/redux/slices/tripSlice';

function Attractions({ attractions }) {
  const tripContext = useSelector(selectTripContext);
  const currencySymbol = getCurrencySymbol(
    tripContext?.input?.currency || "USD",
  );
  return (
    <div>
      {/* Top Attractions Grid */}
      <section>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <ShipWheel className="w-6 h-6" />
          Don't Miss Attractions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {attractions.map((attraction, idx) => (
            <div
              key={idx}
              className="group relative overflow-hidden rounded-xl h-48 cursor-pointer"
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                style={{ backgroundImage: `url("${attraction?.images?.[0]}")` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 p-4 w-full">
                <div className="flex items-center gap-1">
                  <span className="text-white font-bold text-lg">
                    {attraction.name}
                  </span>
                  <>
                    <span className="text-xs text-slate-50">•</span>
                    <div className="flex items-center gap-1 text-yellow-400">
                      <Star className="w-4 h-4" />
                      <span className="text-white text-sm font-bold">
                        {attraction.rating}
                      </span>
                      <span className="text-white/70 text-xs">
                        ({attraction.reviewsCount / 1000}k)
                      </span>
                    </div>
                  </>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs bg-white/20 backdrop-blur-md text-white px-2 py-1 rounded">{`Entry Fee: ${currencySymbol}${attraction?.estimatedEntryFee}`}</span>
                  <span className="text-xs bg-white/20 backdrop-blur-md text-white px-2 py-1 rounded">
                    {capitalizeFirstLetter(attraction.category)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Attractions;
