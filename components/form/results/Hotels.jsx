import React from "react";
import { Star, MapPin, Building2, Wifi, Coffee, Utensils, Music, Waves, ExternalLink } from "lucide-react";
import { useSelector } from "react-redux";
import { selectTripContext } from "@/lib/redux/slices/tripSlice";
import { getCurrencySymbol } from "./helper";

// Helper map for icons
const AmenityIcon = ({ name }) => {
  const iconMap = {
    wifi: <Wifi className="w-3 h-3" />,
    breakfast: <Coffee className="w-3 h-3" />,
    restaurant: <Utensils className="w-3 h-3" />,
    pool: <Waves className="w-3 h-3" />,
    bar: <Music className="w-3 h-3" />,
    default: <Building2 className="w-3 h-3" />
  };
  const key = name.toLowerCase();
  const Icon = Object.keys(iconMap).find(k => key.includes(k)) ? iconMap[Object.keys(iconMap).find(k => key.includes(k))] : iconMap.default;
  return Icon;
};

export default function Hotels({ hotels, destination }) {
  const tripContext = useSelector(selectTripContext);
  const currencySymbol = getCurrencySymbol(
    tripContext?.input?.currency || "USD"
  );
  const hotelBookingLink = tripContext?.bookingLinks?.hotel;

  if (!hotels || hotels.length === 0) return null;

  return (
    <div className="flex flex-col gap-6 w-full">
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-6 h-6" />
            Recommended Hotels in {destination || "the Area"}
          </h3>
          {hotelBookingLink && (
            <a
              href={hotelBookingLink}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Check live prices
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {hotels.map((hotel, idx) => {
            const price = hotel.pricePerNight ? `${currencySymbol}${hotel.pricePerNight}` : "Check Rates";
            
            return (
              <div 
                key={idx}
                className="group flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden hover:shadow-lg transition-all"
              >
                <div 
                  className="h-48 w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                  style={{ backgroundImage: `url("${hotel.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'}")` }}
                >
                  <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-md px-2 py-1 flex items-center gap-1 rounded font-bold text-white text-sm shadow-sm">
                    <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                    <span>{hotel.rating || "New"}</span>
                    <span className="text-xs text-white/80 font-normal">({hotel.reviewsCount || 0})</span>
                  </div>
                </div>
                
                <div className="p-5 flex flex-col flex-1 gap-2">
                  <div className="flex justify-between items-start gap-4">
                    <h4 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                      {hotel.name}
                    </h4>
                  </div>
                  
                  <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="truncate">{hotel.address}</span>
                  </div>
                  
                  <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mt-1 flex-1">
                    {hotel.description}
                  </p>
                  
                  {hotel.amenities && hotel.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {hotel.amenities.slice(0, 3).map((amenity, i) => (
                        <span key={i} className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded text-[10px] font-medium uppercase tracking-wider">
                          <AmenityIcon name={amenity} />
                          {amenity}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Est. Price / Night</span>
                    <span className="text-lg font-black text-slate-900 dark:text-white">{price}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
