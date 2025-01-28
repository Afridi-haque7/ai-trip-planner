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
    <div className="flex flex-col gap-8 mx-auto">
      <div className="text-2xl mt-8 md:text-4xl font-bold text-center">
        Trip Results with AI
      </div>
      {/* trip details */}
      <div>
        {/* <h2 className="text-md font-semibold">Details of you Trip:</h2> */}

        <p className="text-lg px-4 ">
          {`Showing result for a trip requested by you to ${
            tripDetails?.location
          } for ${tripDetails?.duration} with a ${
            tripDetails?.budget == "Cheap"
              ? "Pocket-friendly"
              : tripDetails?.budget
          } budget for ${tripDetails?.travelers} traveler(s)`}
        </p>
      </div>

      {/* hotel details */}
      <p className="font-semibold text-xl mt-10 text-center">
        Top Hotels that suits your pocket
      </p>
      <div className="flex gap-2 flex-wrap justify-center items-start">
        {hotelOptions && hotelOptions.length > 0 ? (
          hotelOptions.map((item, index) => (
            <div key={index} className="flex flex-row p-1 gap-4 ">
              <Card className="border max-w-[300px] h-[475px] p-0 border-gray-500/10 shadow-md">
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
                    <span className="px-2 py-1 text-center text-s border bg-gray-500/10 rounded-full">
                      {item.price.slice(14)}
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
      <p className="font-semibold text-xl mt-10 text-center">
        Famous Places to Visit
      </p>
      <div>
        {itinerary ? (
          <div className="mx-auto flex gap-4 flex-wrap justify-center">
            {/* <p>Day - 1</p> */}
            {itinerary?.day1 && itinerary?.day1?.length > 0 ? (
              itinerary?.day1?.map((item, index) => (
                <Card key={index} className="w-[300px] h-[365px] shadow-lg">
                  <CardHeader>
                    <img
                      src={item.imgUrl}
                      alt={item.name}
                      width={250}
                      height={150}
                      className="border border-black shadow-md rounded-lg"
                    />
                    <CardTitle>{item.name}</CardTitle>
                    <CardDescription>{item.location}</CardDescription>
                  </CardHeader>
                  <CardContent>{item.description}</CardContent>
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

      <p className="font-semibold text-xl mt-10 text-center">
        Authentic Dishes to try out{" "}
      </p>
      <div className="flex gap-4 flex-wrap">
        {authenticDishes && authenticDishes.length > 0 ? (
          authenticDishes.map((item, index) => (
            <div
              key={index}
              className="mx-auto flex gap-4 flex-wrap justify-center"
            >
              <Card className="border-2 w-[300px] h-[350px] border-gray-500/10 shadow-md">
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
      <p className="font-semibold text-xl mt-10 text-center">
        Let's Estimate your Trip Cost
      </p>

      <div className="">
        {estimatedCost ? (
          <div className="flex bg-white flex-col mx-auto rounded-xl max-w-[450px] gap-4 px-4 py-4 mb-10 border-2 shadow-lg">
            <Table>
              <TableCaption>A list of your recent invoices.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-left">Invoice</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                <TableRow>
                  <TableCell>Hotel Cost</TableCell>
                  <TableCell className="text-right">
                    {estimatedCost.hotel}
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell>Food Bill</TableCell>
                  <TableCell className="text-right">
                    {estimatedCost.food}
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell>Transport Charge</TableCell>
                  <TableCell className="text-right">
                    {estimatedCost.transport}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Site Seeing Fees</TableCell>
                  <TableCell className="text-right">
                    {estimatedCost.attractions}
                  </TableCell>
                </TableRow>
              </TableBody>

              <TableFooter className="bg-slate-200/40">
                <TableRow>
                  <TableCell>Overall Cost</TableCell>
                  <TableCell className="text-right">
                    {estimatedCost.totalCost}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        ) : (
          <div>No cost information</div>
        )}
      </div>
    </div>
  );
}

export default TripResult;
