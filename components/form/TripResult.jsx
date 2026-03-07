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
import { MapPinned, Star } from "lucide-react";

const tripData = {
  "locationImg": {
    "url": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
  },
  "tripDetails": {
    "location": "Paris, France",
    "duration": "1 day",
    "budget": "Cheap",
    "travelers": 2
  },
  "hotelOptions": [
    {
      "name": "Generator Paris",
      "address": "9-11 Place du Colonel Fabien, 75010 Paris, France",
      "price": "$85 - $110 per night",
      "imageUrl": "https://images.unsplash.com/photo-1555854816-809d28f041f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "geoCoordinates": {
        "latitude": 48.8785,
        "longitude": 2.3691
      },
      "rating": 4.1,
      "description": "A stylish designer hostel and hotel located in the vibrant 10th district, offering affordable private rooms and great social spaces."
    },
    {
      "name": "ibis budget Paris Porte de Montmartre",
      "address": "45 Rue du Dr Babinski, 75018 Paris, France",
      "price": "$75 - $95 per night",
      "imageUrl": "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "geoCoordinates": {
        "latitude": 48.8997,
        "longitude": 2.3382
      },
      "rating": 3.6,
      "description": "Essential comfort at a budget price, located near the famous flea markets and a short metro ride from the city center."
    },
    {
      "name": "The People - Paris Belleville",
      "address": "59 Boulevard de Belleville, 75011 Paris, France",
      "price": "$80 - $105 per night",
      "imageUrl": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "geoCoordinates": {
        "latitude": 48.8703,
        "longitude": 2.3775
      },
      "rating": 4.3,
      "description": "Modern and friendly accommodation in the trendy Belleville area, featuring a rooftop terrace with views of the Eiffel Tower."
    }
  ],
  "itinerary": [
    {
      "name": "Eiffel Tower & Trocadéro Gardens",
      "imgUrl": "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "description": "Start your morning at the Trocadéro for the best free view of the Eiffel Tower. Walk across the Seine to the Champ de Mars.",
      "location": "Champ de Mars, 5 Av. Anatole France, 75007 Paris",
      "timings": "9:30 AM - 11:45 PM",
      "entryFee": "Free to view; €18-€28 to ascend (optional)"
    },
    {
      "name": "Louvre Museum (Courtyard & Pyramid)",
      "imgUrl": "https://images.unsplash.com/photo-1543349689-9a4d426bee8e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "description": "Admire the iconic glass pyramid and the historic palace exterior. Walk through the Tuileries Garden towards Place de la Concorde.",
      "location": "Rue de Rivoli, 75001 Paris",
      "timings": "Courtyard open 24/7",
      "entryFee": "Free for exterior; €22 for museum entry"
    },
    {
      "name": "Notre-Dame Cathedral & Latin Quarter",
      "imgUrl": "https://images.unsplash.com/photo-1478147427282-58a87a120781?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "description": "View the magnificent Gothic facade of Notre-Dame and explore the narrow, historic streets of the nearby Latin Quarter.",
      "location": "6 Parvis Notre-Dame - Pl. Jean-Paul II, 75004 Paris",
      "timings": "8:00 AM - 6:45 PM",
      "entryFee": "Free to view exterior"
    },
    {
      "name": "Sacré-Cœur & Montmartre",
      "imgUrl": "https://images.unsplash.com/photo-1503917988258-f197e2f41911?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "description": "End your day at the white basilica on the hill for a panoramic sunset view of Paris. Explore the artist square at Place du Tertre.",
      "location": "35 Rue du Chevalier de la Barre, 75018 Paris",
      "timings": "6:30 AM - 10:30 PM",
      "entryFee": "Free"
    }
  ],
  "authenticDishes": [
    {
      "name": "Butter Croissant",
      "description": "A flaky, buttery pastry that is a staple of French breakfast. Best enjoyed fresh from a local boulangerie.",
      "imageUrl": "https://images.unsplash.com/photo-1555507036-ab1f4038808a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    },
    {
      "name": "French Onion Soup",
      "description": "A savory soup made of caramelized onions and beef stock, topped with a thick layer of melted Gruyère cheese and croutons.",
      "imageUrl": "https://images.unsplash.com/photo-1583032015879-e5022cb87c3b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    },
    {
      "name": "Crêpes",
      "description": "Thin pancakes served with sweet fillings like Nutella or savory fillings like ham and cheese (galettes) from street stalls.",
      "imageUrl": "https://images.unsplash.com/photo-1519676867240-f03562e64548?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    }
  ],
  "estimatedCost": {
    "hotel": "$90",
    "food": "$60",
    "transport": "$18",
    "attractions": "$0",
    "totalCost": "$168"
  }
}

function TripResult({ data }) {

  const {
    locationImg = {},
    tripDetails = {},
    hotelOptions = [],
    itinerary = [],
    authenticDishes = [],
    estimatedCost = {},
  } = data || tripData || {};


  return (
    <div className="flex flex-col gap-10 mx-auto px-4 py-8">
      
      {/* trip details */}
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 via-purple-500 to-orange-500 rounded-lg opacity-20 blur"></div>
        <div className="relative bg-card border border-border rounded-lg p-6 md:p-8">
          <p className="text-lg md:text-xl text-foreground leading-relaxed">
            {`Showing result for a trip requested by you to `}
            <span className="font-semibold bg-gradient-to-r from-pink-500 via-red-500 to-orange-500 bg-clip-text text-transparent">
              {tripDetails?.location}
            </span>
            {` for `}
            <span className="font-semibold">{tripDetails?.duration} days</span>
            {` with a `}
            <span className="font-semibold">
              {tripDetails?.budget === "Cheap" ? "Pocket-friendly" : tripDetails?.budget}
            </span>
            {` budget for `}
            <span className="font-semibold">{tripDetails?.travelers} traveler(s)</span>
          </p>
        </div>
      </div>

      {/* hotel details */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <p className="font-semibold text-2xl md:text-3xl bg-gradient-to-r from-pink-500 via-red-500 to-orange-500 bg-clip-text text-transparent">
            🏨 Top Hotels that suits your pocket
          </p>
          <div className="h-1 w-20 bg-gradient-to-r from-pink-500 to-orange-500 mx-auto rounded-full"></div>
        </div>
        <div className="flex gap-4 flex-wrap overflow-hidden justify-center items-start">
          {hotelOptions && hotelOptions.length > 0 ? (
            hotelOptions.map((item, index) => (
              <div key={index} className="grid lg:grid-cols-1 grid-cols-3 p-4 gap-4">
                <Card className="border border-border max-w-[300px] min-h-[550px] overflow-hidden p-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:border-primary">
                  <CardHeader className="p-0">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      width={300}
                      height={200}
                      className="w-full h-48 object-cover"
                    />
                  </CardHeader>
                  <div className="p-4 space-y-3">
                    <div>
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                      <CardDescription className="flex gap-2 items-start mt-2">
                        <MapPinned className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{item.address}</span>
                      </CardDescription>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <span className="px-3 py-1 text-sm border border-primary/30 bg-primary/10 rounded-full font-medium">
                        {item.price.slice(14)}
                      </span>
                      <span className="px-3 py-1 text-sm border border-yellow-500/30 bg-yellow-500/10 rounded-full flex gap-1 items-center font-medium">
                        <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                        {item.rating}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                  </div>
                  <CardFooter className="p-4">
                    <Button className="w-full bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600">
                      Book Now
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground">No hotels found</p>
          )}
        </div>
      </div>

      {/* itinerary */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <p className="font-semibold text-2xl md:text-3xl bg-gradient-to-r from-pink-500 via-red-500 to-orange-500 bg-clip-text text-transparent">
            📍 Famous Places to Visit
          </p>
          <div className="h-1 w-20 bg-gradient-to-r from-pink-500 to-orange-500 mx-auto rounded-full"></div>
        </div>
        {itinerary && itinerary?.length > 0 ? (
          <div className="mx-auto flex gap-4 flex-wrap justify-center">
            {itinerary?.map((item, index) => (
              <Card
                key={index}
                className="w-[300px] overflow-hidden min-h-[365px] shadow-lg border border-border hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:border-primary"
              >
                <CardHeader className="p-0">
                  <img
                    src={item.imgUrl}
                    alt={item.name}
                    width={250}
                    height={150}
                    className="w-full h-48 object-cover"
                  />
                </CardHeader>
                <div className="p-4 space-y-2">
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                  <CardDescription className="flex gap-2 items-start">
                    <MapPinned className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{item.location}</span>
                  </CardDescription>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground">No activities found</div>
        )}
      </div>

      {/* authentic dishes */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <p className="font-semibold text-2xl md:text-3xl bg-gradient-to-r from-pink-500 via-red-500 to-orange-500 bg-clip-text text-transparent">
            🍽️ Authentic Dishes to try out
          </p>
          <div className="h-1 w-20 bg-gradient-to-r from-pink-500 to-orange-500 mx-auto rounded-full"></div>
        </div>
        <div className="flex gap-4 flex-wrap justify-center overflow-hidden">
          {authenticDishes && authenticDishes.length > 0 ? (
            authenticDishes.map((item, index) => (
              <div
                key={index}
                className="mx-auto flex gap-4 p-4 flex-wrap justify-center"
              >
                <Card className="border-2 border-border overflow-hidden w-[300px] min-h-[350px] shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:border-primary">
                  <CardHeader className="p-0">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      width={300}
                      height={200}
                      className="w-full h-48 object-cover"
                    />
                  </CardHeader>
                  <div className="p-4 space-y-2">
                    <CardTitle>{item.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </Card>
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground">
              <p className="text-lg font-semibold">No authentic dishes found</p>
            </div>
          )}
        </div>
      </div>

      {/* Estimated cost */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <p className="font-semibold text-2xl md:text-3xl bg-gradient-to-r from-pink-500 via-red-500 to-orange-500 bg-clip-text text-transparent">
            💰 Let's Estimate your Trip Cost
          </p>
          <div className="h-1 w-20 bg-gradient-to-r from-pink-500 to-orange-500 mx-auto rounded-full"></div>
        </div>

        {estimatedCost ? (
          <div className="mx-auto max-w-[450px]">
            <div className="relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-orange-500 rounded-xl opacity-20 blur"></div>
              <div className="relative bg-card border border-border rounded-xl p-6 shadow-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-left">Expense Category</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    <TableRow>
                      <TableCell>🏨 Hotel Cost</TableCell>
                      <TableCell className="text-right font-semibold">
                        {estimatedCost.hotel}
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell>🍽️ Food Bill</TableCell>
                      <TableCell className="text-right font-semibold">
                        {estimatedCost.food}
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell>🚗 Transport Charge</TableCell>
                      <TableCell className="text-right font-semibold">
                        {estimatedCost.transport}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>🎟️ Site Seeing Fees</TableCell>
                      <TableCell className="text-right font-semibold">
                        {estimatedCost.attractions}
                      </TableCell>
                    </TableRow>
                  </TableBody>

                  <TableFooter>
                    <TableRow className="bg-primary/10 font-bold">
                      <TableCell>Total Trip Cost</TableCell>
                      <TableCell className="text-right text-lg">
                        {estimatedCost.totalCost}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground">No cost information</div>
        )}
      </div>
    </div>
  );
}

export default TripResult;
