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
import { Button } from "@/components/ui/button";
import { MapPinned, Star } from "lucide-react";

function TripResult({ data }) {

  const {
    tripDetails = {},
    hotelOptions = [],
    itinerary = {},
    authenticDishes = [],
    estimatedCost = {},
  } = data || {};

  // console.log(hotelOptions);

  return (
    <div className="flex flex-col gap-4 mx-auto">
      <div className="text-lg font-semibold">Trip Results with AI</div>
      {/* trip details */}
      <div>
        <h2 className="text-md font-semibold">Details of you Trip:</h2>
        <div>
          <p>
            <span>Location:</span> {tripDetails?.location || "NA"}
          </p>
          <p>
            <span>Duration:</span> {tripDetails?.duration || "N/A"}
          </p>
          <p>
            <span>Budget:</span> {tripDetails?.budget || "N/A"}
          </p>
          <p>
            <span>Travelers:</span> {tripDetails?.travelers || "N/A"}
          </p>
        </div>
      </div>

      {/* hotel details */}
      <div className="flex gap-4 flex-wrap justify-center items-center">
        {hotelOptions && hotelOptions.length > 0 ? (
          hotelOptions.map((item, index) => (
            <div key={index} className="flex flex-row p-2 gap-4 max-w-[350px]">
              <Card className="border-2 border-gray-500/10 shadow-md">
                <CardHeader>
                  <img
                    src={item.imageUrl}
                    alt="Hotel Image"
                    width={300}
                    height={200}
                  />
                  <CardTitle>{item.name}</CardTitle>
                  <CardDescription className="flex gap-2">
                    <MapPinned className="scale-100" />
                    {item.address}
                  </CardDescription>
                  <div className="flex gap-2">
                    <span className="px-2 py-1 text-center text-xs border bg-gray-500/10 rounded-full">
                      {item.price}
                    </span>
                    <span className="px-2 text-center py-1 text-xs border bg-gray-500/10 rounded-full flex">
                      <span>
                        <Star className="scale-20 text-xs" />
                      </span>{" "}
                      {item.rating}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p>{item.description}</p>
                </CardContent>
                <CardFooter>
                  <Button variant="default" className="w-full">
                    Book Now
                  </Button>
                </CardFooter>
              </Card>
            </div>
          ))
        ) : (
          <p>No hotels found</p>
        )}
      </div>

      {/* itinerary */}
      <div>
        {itinerary ? (
          <div className="mx-auto flex gap-4 flex-wrap justify-center">
            {/* <p>Day - 1</p> */}
            {itinerary.day1.activities.length > 0 ? (
              itinerary.day1.activities.map((item, index) => (
                <Card key={index} className="max-w-[300px]">
                  <CardHeader>
                    <img
                      src={item.imgUrl}
                      alt={item.name}
                      width={250}
                      height={150}
                      className="border border-black rounded-lg"
                    />
                    <CardTitle>{item.name}</CardTitle>
                    <CardDescription>{item.location}</CardDescription>
                  </CardHeader>
                  <CardContent>{item.details}</CardContent>
                </Card>
              ))
            ) : (
              <div>No activities found</div>
            )}
          </div>
        ) : (
          <div>No itinerary found</div>
        )}
      </div>

      {/* authentic dishes */}

      <div className="flex gap-4 flex-wrap">
        {authenticDishes && authenticDishes.length > 0 ? (
          authenticDishes.map((item, index) => (
            <div key={index} className="flex flex-row p-2 gap-4 max-w-[300px]">
              <Card className="border-2 border-gray-500/10 shadow-md">
                <CardHeader>
                  <img
                    src={item.imageUrl}
                    alt="Hotel Image"
                    width={300}
                    height={200}
                  />
                  <CardTitle>{item.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{item.description}</p>
                </CardContent>
              </Card>
            </div>
          ))
        ) : (
          <div>
            <p className="text-xl font-semibold"> No authentic dishes found</p>
          </div>
        )}
      </div>

      {/* Estimated cost */}
      <div className="flex gap-4">
        {estimatedCost ? (
          <div className="flex gap-4 px-10 py-4 mb-10 border shadow-lg">
            <p className="text-lg font-semibold text-center">
              Let's calculate your estimated cost:
            </p>
            <div>
              <ul className="flex flex-col gap-2 justify-center">
                <li className="flex gap-4 justify-around items-center">
                  <span>Hotel cost :- </span>
                  <span>{estimatedCost.hotel}</span>
                </li>
                <li className="flex gap-4 justify-around items-center">
                  <span>Food cost :- </span>
                  <span>{estimatedCost.food}</span>
                </li>
                <li className="flex gap-4 justify-around items-center">
                  <span>Transportation Charge :- </span>
                  <span>{estimatedCost.transportation}</span>
                </li>
                <li className="flex gap-4 justify-around items-center">
                  <span>Site Seeing Fare :- </span>
                  <span>{estimatedCost.attractions}</span>
                </li>
              </ul>

              <p className="flex gap-4 justify-around items-center">
                <span>Total cost :- </span>
                <span>{estimatedCost.total}</span>
              </p>
            </div>
          </div>
        ) : (
          <div>No cost information</div>
        )}
      </div>
    </div>
  );
}

export default TripResult;
