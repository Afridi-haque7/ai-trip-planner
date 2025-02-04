"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { BudgetOptions, MemberOptions } from "@/constants";
import { Button } from "../ui/button";
import Autocomplete from "react-google-autocomplete";
import { toast } from "sonner";
import { chatSession } from "@/app/api/generate-trip/route";
import TripResult from "./TripResult";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";



function InputForm() {
  const [formData, setFormData] = useState({
    location: null,
    duration: null,
    budget: null,
    members: null,
  });
  const [resultData, setResultData] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  // const [userId, setUserId] = useState(null);
  const key = process.env.NEXT_PUBLIC_GOOGLE_PLACE_API_KEY;
  const router = useRouter();
  const { data : session} = useSession();
  // console.log(session);
  useEffect(() => {
    if(session){
      const fetchUserId = async () => {
        const email = session.user.email;

        try {
          // Fetch the user's _id from MongoDB
          const response = await fetch("/api/get-user-id", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email }),
          });

          if (response.ok) {
            const user = await response.json();
            const userId = user._id;

            router.push(`/create-trip/${userId}`);
          } else {
            console.error("Failed to fetch user ID");
          }
        } catch (error) {
          console.error("Error fetching user ID:", error);
        }
      };

      fetchUserId();
      
    }
  }, [session, router]);
  

        // console.log(userId);

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    // if any form field is missing, show a dialog
    if (
      !formData?.location ||
      !formData?.duration ||
      !formData?.budget ||
      !formData?.members
    ) {
      toast("Please fill all the fields!", {
        action: {
          label: "Close",
          onClick: () => console.log("Close toast"),
        },
      });
      return;
    }


    const prompt = `Act as a travel guide and generate a trip for the location: ${formData?.location}, for ${formData?.members} persons, in a ${formData?.budget} budget and for ${formData?.duration} days. Give a hotel list(max-3) with hotel name, address, price, hotel image url, geo-coordinates, rating, descriptions. Give a picture url of the place.
    Also generate an itinerary for the most famous places of the location, with a list of different places with their pictures url, location details, timings, entry fee(if applicable). Suggest some famous authentic cuisines(max-3) of that place with picture urls. Generate estimated cost for the trip. Give all the image urls from google, don't use tripadvisor cdn. For itinerary response, give itinerary only for exact ${formData?.duration} days, don't generate unnecessary days.
    Give the response in JSON format - locationImg: {url}, tripDetails: {location, duration, budget, travelers}, hotelOptions: [{name, address, price, imageUrl, geoCoordinates, rating, description}], itinerary: [{name, imgUrl, description, location, timings, entryFee}], authenticDishes: [{name, description, imageUrl}], estimatedCost: {hotel, food, transport, attractions, totalCost}`;

    // send to gemini model

    try {
      const result = await chatSession.sendMessage(prompt);
      // console.log(result?.response?.text());

      if (!result) {
        console.error("No result found");
        return;
      }

      // send Data to database
      const data = result?.response?.text();
      const parsedData = JSON.parse(data);
      console.log(parsedData);
      
      setResultData(parsedData);
    } catch (error) {
      console.log("Error generating response: ", error);
    }

  };



  return (
    <div className="">
      {resultData ? (
        <TripResult data={resultData} />
      ) : (
        <form onSubmit={handleFormSubmit} className="flex flex-col gap-10 px-4 py-8">
          {/* Location Input */}
          <div className="flex flex-col gap-2 py-2">
            <label htmlFor="" className="font-medium">
              Which place you want to plan the trip?
            </label>
            <Autocomplete
              apiKey={key}
              onPlaceSelected={(v) => {
                setFormData({
                  ...formData,
                  location: v.formatted_address,
                });
              }}
              className="border border-zinc-500/40 bg-transparent rounded-md px-4 py-2 shadow-md text-base"
            />
          </div>
          {/* Days input */}
          <div className="flex flex-col gap-2 py-2">
            <label htmlFor="" className="font-medium">
              How many days you want to plan the trip?
            </label>
            <Input
              type="number"
              placeholder="ex.2"
              max={3}
              min={1}
              className="border border-zinc-500/40 shadow-md"
              onChange={(e) => {
                setFormData({
                  ...formData,
                  duration: e.target.value,
                });
              }}
            />
          </div>

          {/* budget input */}
          <div className="flex flex-col gap-2 py-2">
            <label htmlFor="" className="font-medium">
              What is your budget for the trip?
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {BudgetOptions.map((item, index) => (
                <div
                  key={index}
                  onClick={() =>
                    setFormData({ ...formData, budget: item.value })
                  }
                  className={`border border-zinc-500/40 rounded-lg shadow-lg flex justify-evenly items-center
                px-4 py-4 text-center transition-all duration-200 cursor-pointer
                ${
                  formData.budget === item.value
                    ? "bg-slate-200 scale-105 border-black"
                    : "hover:bg-slate-200"
                }
                `}
                >
                  <img src={item.icon} alt="" className="w-12 h-12" />
                  <span>
                    <h2 className="text-md font-medium">{item.title}</h2>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* members input */}
          <div className="flex flex-col gap-2 py-2">
            <label htmlFor="" className="font-medium">
              What is your budget for the trip?
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MemberOptions.map((item, index) => (
                <div
                  key={index}
                  onClick={() =>
                    setFormData({ ...formData, members: item.value })
                  }
                  className={`border border-zinc-500/40 rounded-lg shadow-lg flex gap-4
                px-4 py-4 text-center transition-all duration-200 cursor-pointer
                ${
                  formData.members === item.value
                    ? "bg-slate-200 scale-105 border-black"
                    : "hover:bg-slate-200"
                }
                `}
                >
                  <img
                    src={item.icon}
                    alt=""
                    className="w-14"
                  />
                  <span>
                    <h2 className="text-md font-medium">{item.title}</h2>
                    <p className="text-xs text-gray-500">{item.description}</p>
                    <p className="text-sm text-gray-500">{item.people}</p>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center w-full">
            <Button
              // onClick={handleClick}
              type="submit"
              className="w-full md:w-[200px]"
            >
              Generate Trip
            </Button>
          </div>

        </form>
      )}
    </div>
  );
}

export default InputForm;
