'use client';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Error from "@/components/Error";
import TripResult from "@/components/form/TripResult";
export const dynamic = "force-dynamic";


export default function ViewTrip() {
    const params = useParams();
    const tripid = params.tripid;
    const [trip, setTrip] = useState(null);
    const [loading, setLoading] = useState(true);
    // const [error, setError] = useState(null);

    // console.log("Trip Id: ", tripid);
    
    useEffect(() => {
      const fetchTrip = async () => {
        try {
          const response = await fetch("/api/get-trip", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ tripid }),
          });

        //   console.log(response);

          if (response.ok) {
            const tripData = await response.json();
            setTrip(tripData);
            // return response;
          } else {
            console.error("Failed to fetch trip data");
          }
        } catch (error) {
          console.error("Unable to fetch trip details", error);
        } finally {
          setLoading(false);
        }
      };
      fetchTrip();
    }, [tripid]);

    console.log("Trip details from view-trip page: ",trip);


    if (loading) {
      return <div className="mt-32 text-center text-2xl">Loading trip details...</div>;
    }

    if(!trip){
        return <Error />;
    }

    return (
      <div className="w-full flex justify-center itemms-center py-4 px-4 lg:px-2">
        <main className="mt-32 relative inset-0">
          <div>
            <h1
              className="text-2xl md:text-3xl lg:text-5xl font-bold text-center 
          bg-gradient-to-r from-pink-500 via-red-500 to-orange-500 bg-clip-text text-transparent"
            >
              Trip Results with AI
            </h1>
            <p className="text-center mx-auto px-2 mt-10 text-md text-gray-500">
              Just provide some basic information, and Trip Tailor will generate
              a customized itenerary just for you.
            </p>
          </div>
          <div className="my-16 mx-1 md:mx-4 p-2 md:p-4 border rounded-2xl bg-slate-200/30">
            <TripResult data={trip} />
          </div>
        </main>
      </div>
    );
    
}