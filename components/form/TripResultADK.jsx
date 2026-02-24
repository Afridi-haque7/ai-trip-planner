"use client";
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  MapPinned,
  Star,
  Cloud,
  Thermometer,
  DollarSign,
  Users,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

function TripResultADK({ data }) {
  const [expandedDay, setExpandedDay] = useState(null);

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

  // Format currency safely
  const formatCurrency = (value, currency = "USD") => {
    if (!value && value !== 0) return "N/A";
    const num = typeof value === "number" ? value : parseFloat(value);
    return isNaN(num) ? "N/A" : `${currency} ${num.toFixed(2)}`;
  };

  // Format cost object (min/max/average)
  const formatCostObj = (obj, currency = "USD") => {
    if (!obj || typeof obj !== "object") return null;
    if (obj.min && obj.average && obj.max) {
      return {
        min: formatCurrency(obj.min, currency),
        avg: formatCurrency(obj.average, currency),
        max: formatCurrency(obj.max, currency),
      };
    }
    return null;
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Calculate trip duration
  const calculateDays = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  };

  const tripDays = calculateDays(input.startDate, input.endDate);
  const isItineraryPresent = itinerary?.days && itinerary?.days?.length > 0;
  const itineraries = isItineraryPresent ? itinerary.days : [];

  // Get hotel recommendations by tier
  const getHotelsByTier = (tier) => {
    if (!places.hotelRecommendations || !places.hotelRecommendations[tier]) {
      return [];
    }
    return places.hotelRecommendations[tier];
  };

  return (
    <div className="flex flex-col gap-10 mx-auto px-2 sm:px-4 py-8 w-full max-w-6xl">
      {/* TRIP OVERVIEW SECTION */}
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 via-purple-500 to-orange-500 rounded-lg opacity-20 blur"></div>
        <div className="relative bg-card border border-border rounded-lg p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-pink-500 via-red-500 to-orange-500 bg-clip-text text-transparent">
            Your {tripDays}-Day Adventure to {input.destination}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
            <div className="flex items-center gap-2">
              <MapPinned className="w-5 h-5 text-pink-500" />
              <div>
                <p className="text-sm text-muted-foreground">Destination</p>
                <p className="font-semibold">{input.destination}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Travelers</p>
                <p className="font-semibold">
                  {input.numberOfPeople}{" "}
                  {input.numberOfPeople > 1 ? "people" : "person"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Budget</p>
                <p className="font-semibold capitalize">{input.budgetLevel}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📅</span>
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="font-semibold">{tripDays} days</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl">💱</span>
              <div>
                <p className="text-sm text-muted-foreground">Currency</p>
                <p className="font-semibold">{input.currency}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl">
                {derived.season === "summer"
                  ? "☀️"
                  : derived.season === "winter"
                    ? "❄️"
                    : derived.season === "spring"
                      ? "🌸"
                      : "🍂"}
              </span>
              <div>
                <p className="text-sm text-muted-foreground">Season</p>
                <p className="font-semibold capitalize">
                  {derived.season || "Unknown"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* WEATHER & DESTINATION OVERVIEW */}
      <div className="space-y-6">
        <h3 className="text-2xl font-bold text-center bg-gradient-to-r from-pink-500 to-orange-500 bg-clip-text text-transparent">
          🌍 Destination Overview
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.keys(weather).length > 0 && (
            <Card className="border border-border shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cloud className="w-5 h-5" /> Weather & Climate
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {weather.currentSeason && (
                  <div className="pb-3 border-b">
                    <p className="text-xs text-muted-foreground font-medium">
                      Current Season
                    </p>
                    <p className="text-sm font-semibold capitalize">
                      {weather.currentSeason}
                    </p>
                  </div>
                )}
                {weather.bestSeasonToVisit && (
                  <div className="pb-3 border-b">
                    <p className="text-xs text-muted-foreground font-medium">
                      Best Time to Visit
                    </p>
                    <p className="text-sm font-semibold capitalize">
                      {weather.bestSeasonToVisit}
                    </p>
                  </div>
                )}
                {weather.temperatureRange && (
                  <div className="pb-3 border-b">
                    <p className="text-xs text-muted-foreground font-medium">
                      Temperature Range
                    </p>
                    <p className="text-sm font-semibold">
                      {weather.temperatureRange}
                    </p>
                  </div>
                )}
                {weather.seasonalImpactOnCost && (
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">
                      Seasonal Cost Impact
                    </p>
                    <p className="text-sm font-semibold">
                      {weather.seasonalImpactOnCost}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {places.recommendedAreas && places.recommendedAreas.length > 0 && (
            <Card className="border border-border shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPinned className="w-5 h-5" /> Recommended Areas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {places.recommendedAreas.map((area, idx) => (
                  <div key={idx} className="pb-3 border-b last:border-b-0">
                    <p className="font-semibold text-sm">{area.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {area.description}
                    </p>
                    {area.suitableFor && (
                      <p className="text-xs text-primary mt-1">
                        👥 {area.suitableFor}
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* TOP ATTRACTIONS */}
      {places.attractions && places.attractions.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-center bg-gradient-to-r from-pink-500 to-orange-500 bg-clip-text text-transparent">
            📍 Top Attractions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {places.attractions.slice(0, 9).map((attraction, idx) => (
              <Card
                key={idx}
                className="border border-border shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                {attraction.images && attraction.images.length > 0 && (
                  <div className="w-full h-40 bg-muted overflow-hidden">
                    <img
                      src={attraction.images[0]}
                      alt={attraction.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src =
                          "https://via.placeholder.com/300x200?text=Attraction";
                      }}
                    />
                  </div>
                )}
                <CardContent className="p-4 space-y-2">
                  <div>
                    <h4 className="font-semibold text-sm">{attraction.name}</h4>
                    {attraction.category && (
                      <p className="text-xs text-primary">
                        {attraction.category}
                      </p>
                    )}
                  </div>
                  {attraction.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {attraction.description}
                    </p>
                  )}
                  {attraction.location && (
                    <p className="text-xs text-muted-foreground mt-2 flex gap-1">
                      <MapPinned className="w-3 h-3 flex-shrink-0" />{" "}
                      {attraction.location}
                    </p>
                  )}
                  {attraction.estimatedEntryFee && (
                    <p className="text-xs font-semibold text-green-600 pt-1">
                      Entry:{" "}
                      {formatCurrency(
                        attraction.estimatedEntryFee,
                        input.currency,
                      )}
                    </p>
                  )}
                  {attraction.rating && (
                    <div className="flex items-center gap-1 pt-1">
                      <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                      <span className="text-xs font-medium">
                        {attraction.rating}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* DAY-BY-DAY ITINERARY */}
      {isItineraryPresent && (
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-center bg-gradient-to-r from-pink-500 to-orange-500 bg-clip-text text-transparent">
            📅 Day-by-Day Itinerary
          </h3>
          <div className="space-y-3">
            {itineraries?.map((day, dayIdx) => (
              <Card key={dayIdx} className="border border-border shadow-md overflow-hidden">
                <button
                  onClick={() => setExpandedDay(expandedDay === dayIdx ? null : dayIdx)}
                  className="w-full text-left"
                >
                  <CardHeader className="pb-3 hover:bg-secondary/50 transition-colors cursor-pointer">
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="text-base font-bold bg-primary/20 px-3 py-1 rounded">Day {dayIdx + 1}</span>
                          <span className="text-sm text-muted-foreground">{formatDate(day?.date)}</span>
                        </div>
                        {day?.theme && <p className="text-xs text-primary font-medium">🎯 {day?.theme}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        {day?.dailyEstimatedCostPerPerson && (
                          <div className="text-right text-xs">
                            <p className="text-muted-foreground">Per person</p>
                            <p className="font-bold text-green-600">{formatCurrency(day?.dailyEstimatedCostPerPerson, input?.currency)}</p>
                          </div>
                        )}
                        {expandedDay === dayIdx ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>
                  </CardHeader>
                </button>

                {expandedDay === dayIdx && (
                  <CardContent className="space-y-4 pt-0 border-t border-border">
                    {day?.weatherNote && (
                      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded text-xs">
                        <p className="font-medium">🌤️ {day?.weatherNote}</p>
                      </div>
                    )}

                    {day?.activities && day?.activities?.length > 0 && (
                      <div className="space-y-2">
                        <p className="font-semibold text-sm">Activities</p>
                        {day?.activities?.map((act, actIdx) => (
                          <div key={actIdx} className="p-3 bg-secondary/50 rounded space-y-1 text-xs">
                            <div className="flex justify-between items-start">
                              <p className="font-semibold">{act?.name}</p>
                              {act?.estimatedCostPerPerson && (
                                <span className="text-green-600 font-semibold whitespace-nowrap ml-2">
                                  {formatCurrency(act?.estimatedCostPerPerson, input?.currency)}
                                </span>
                              )}
                            </div>
                            {act?.description && <p className="text-muted-foreground">{act?.description}</p>}
                            <div className="flex gap-2 text-muted-foreground flex-wrap">
                              {act?.startTime && act?.endTime && <span>⏰ {act?.startTime} - {act?.endTime}</span>}
                              {act?.location && <span>📍 {act?.location?.name}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {day?.travelSegments && day?.travelSegments?.length > 0 && (
                      <div className="space-y-2">
                        <p className="font-semibold text-sm">Travel</p>
                        {day?.travelSegments?.map((seg, segIdx) => (
                          <div key={segIdx} className="p-2 bg-orange-500/10 rounded text-xs border border-orange-500/20">
                            <p className="font-medium">{seg?.travelMode} · {seg?.estimatedTravelTimeMinutes} mins</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {day?.mealsIncluded && (
                      <div className="flex gap-2 text-xs flex-wrap">
                        {day?.mealsIncluded?.breakfast && <span className="px-2 py-1 bg-yellow-500/20 rounded">🥐 Breakfast</span>}
                        {day?.mealsIncluded?.lunch && <span className="px-2 py-1 bg-green-500/20 rounded">🍜 Lunch</span>}
                        {day?.mealsIncluded?.dinner && <span className="px-2 py-1 bg-purple-500/20 rounded">🍽️ Dinner</span>}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* HOTELS & LOCAL FOOD */}
      <div className="space-y-8">
        {places.hotelRecommendations && (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-center bg-gradient-to-r from-pink-500 to-orange-500 bg-clip-text text-transparent">
              🏨 Hotel Recommendations
            </h3>
            <div className="space-y-6">
              {["budget", "medium", "luxury"].map((tier) => {
                const hotels = getHotelsByTier(tier);
                return hotels.length > 0 ? (
                  <div key={tier} className="space-y-4">
                    <h4 className="font-semibold text-base capitalize">
                      {tier === "luxury" ? "🌟 Luxury Hotels" : tier === "medium" ? "⭐ Premium Hotels" : "💰 Budget Hotels"}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {hotels.map((hotel, idx) => (
                        <Card key={idx} className="border border-border shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                          {hotel.images && hotel.images.length > 0 && (
                            <div className="w-full h-36 bg-muted overflow-hidden">
                              <img
                                src={hotel.images[0]}
                                alt={hotel.name}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.src = "https://via.placeholder.com/300x200?text=Hotel"; }}
                              />
                            </div>
                          )}
                          <CardContent className="p-4 space-y-2">
                            <h5 className="font-semibold text-sm">{hotel.name}</h5>
                            {hotel.location && (
                              <p className="text-xs text-muted-foreground flex gap-1">
                                <MapPinned className="w-3 h-3" /> {hotel.location.name}
                              </p>
                            )}
                            {hotel.description && <p className="text-xs text-muted-foreground line-clamp-2">{hotel.description}</p>}
                            <div className="flex gap-2 flex-wrap pt-2">
                              {hotel.pricePerNight && (
                                <span className="text-xs font-semibold bg-primary/20 px-2 py-1 rounded">
                                  {formatCurrency(hotel.pricePerNight, input.currency)}/night
                                </span>
                              )}
                              {hotel.rating && (
                                <span className="flex gap-1 items-center text-xs font-semibold bg-yellow-500/20 px-2 py-1 rounded">
                                  <Star className="w-3 h-3 fill-yellow-500" /> {hotel.rating}
                                </span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        )}

        {places.foods && places.foods.length > 0 && (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-center bg-gradient-to-r from-pink-500 to-orange-500 bg-clip-text text-transparent">
              🍽️ Local Cuisines to Try
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {places.foods.slice(0, 6).map((food, idx) => (
                <Card key={idx} className="border border-border shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                  {food.images && food.images.length > 0 && (
                    <div className="w-full h-40 bg-muted overflow-hidden">
                      <img
                        src={food.images[0]}
                        alt={food.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = "https://via.placeholder.com/300x200?text=Food"; }}
                      />
                    </div>
                  )}
                  <CardContent className="p-4 space-y-2">
                    <h4 className="font-semibold text-sm">{food.name}</h4>
                    {food.description && <p className="text-xs text-muted-foreground line-clamp-2">{food.description}</p>}
                    {food.averagePrice && (
                      <p className="text-xs font-semibold text-green-600 pt-1">Avg: {formatCurrency(food.averagePrice, input.currency)}</p>
                    )}
                    {food.topRestaurants && food.topRestaurants.length > 0 && (
                      <div className="pt-2 border-t">
                        <p className="text-xs font-semibold mb-1">Popular spots:</p>
                        <ul className="space-y-0.5">
                          {food.topRestaurants.slice(0, 2).map((rest, ridx) => (
                            <li key={ridx} className="text-xs text-muted-foreground">• {rest.name} — {rest.location} ({rest.rating}⭐)</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* BUDGET SUMMARY */}
      {Object.keys(budget).length > 0 && (
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-center bg-gradient-to-r from-pink-500 to-orange-500 bg-clip-text text-transparent">
            💰 Budget Summary
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {budget.breakdown && (
              <Card className="border border-border shadow-lg">
                <CardHeader>
                  <CardTitle className="text-base">Cost Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table className="text-xs">
                    <TableBody>
                      {Object.entries(budget.breakdown).map(([key, value]) => (
                        <TableRow key={key}>
                          <TableCell className="font-medium capitalize py-2">
                            {key.replace(/([A-Z])/g, " $1").trim()}
                          </TableCell>
                          <TableCell className="text-right font-semibold py-2">
                            {formatCurrency(value, input.currency)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            <div className="space-y-4">
              {budget.totalEstimatedCostPerPerson && (
                <Card className="border border-border shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-base">Cost Per Person</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {(() => {
                      const cost = formatCostObj(
                        budget.totalEstimatedCostPerPerson,
                        input.currency,
                      );
                      return cost ? (
                        <>
                          <div className="flex justify-between text-sm pb-2 border-b">
                            <span className="text-muted-foreground">Min</span>
                            <span className="font-semibold">{cost.min}</span>
                          </div>
                          <div className="flex justify-between text-sm pb-2 border-b font-bold text-blue-600">
                            <span>Average</span>
                            <span>{cost.avg}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Max</span>
                            <span className="font-semibold">{cost.max}</span>
                          </div>
                        </>
                      ) : (
                        <p className="text-sm">Not available</p>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}

              {budget.budgetStatus && (
                <Card className="border border-border shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-base">Budget Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`p-3 rounded text-center font-semibold text-sm ${
                        budget.budgetStatus === "within"
                          ? "bg-green-500/20 text-green-700 border border-green-500/30"
                          : budget.budgetStatus === "slightly_above"
                            ? "bg-yellow-500/20 text-yellow-700 border border-yellow-500/30"
                            : "bg-red-500/20 text-red-700 border border-red-500/30"
                      }`}
                    >
                      {budget.budgetStatus === "within"
                        ? "✓ Within Budget"
                        : budget.budgetStatus === "slightly_above"
                          ? "⚠️ Slightly Above Budget"
                          : "❌ Over Budget"}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {budget.totalEstimatedCostForGroup && (
              <Card className="border border-border shadow-lg">
                <CardHeader>
                  <CardTitle className="text-base">
                    Total for {input.numberOfPeople} Person(s)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const cost = formatCostObj(
                      budget.totalEstimatedCostForGroup,
                      input.currency,
                    );
                    return cost ? (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm pb-2 border-b">
                          <span className="text-muted-foreground">Min</span>
                          <span className="font-semibold">{cost.min}</span>
                        </div>
                        <div className="flex justify-between text-sm pb-2 border-b font-bold text-green-600">
                          <span>Average</span>
                          <span>{cost.avg}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Max</span>
                          <span className="font-semibold">{cost.max}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm">Not available</p>
                    );
                  })()}
                </CardContent>
              </Card>
            )}

            {budget.dailyAverageCostPerPerson && (
              <Card className="border border-border shadow-lg">
                <CardHeader>
                  <CardTitle className="text-base">
                    Daily Average (Per Person)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(
                      budget.dailyAverageCostPerPerson,
                      input.currency,
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">per day</p>
                </CardContent>
              </Card>
            )}
          </div>

          {budget.seasonalAdjustment && (
            <Card className="border border-border shadow-lg bg-blue-500/5">
              <CardHeader>
                <CardTitle className="text-base">Seasonal Adjustment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Season:</span>
                  <span className="font-semibold capitalize">
                    {budget.seasonalAdjustment.season}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Cost Multiplier:
                  </span>
                  <span className="font-semibold">
                    {budget.seasonalAdjustment.multiplierApplied}x
                  </span>
                </div>
                {budget.seasonalAdjustment.reason && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      {budget.seasonalAdjustment.reason}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

export default TripResultADK;
