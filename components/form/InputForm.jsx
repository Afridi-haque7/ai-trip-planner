"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { BudgetOptions, MemberOptions } from "@/constants";
import { Button } from "../ui/button";
import Autocomplete from "react-google-autocomplete";
import { toast } from "sonner";
import { chatSession } from "@/app/api/generate-trip/route";
import TripResult from "./TripResult";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FcGoogle } from "react-icons/fc";
import { useGoogleLogin } from "@react-oauth/google";



function InputForm() {
  const [formData, setFormData] = useState({
    location: null,
    duration: null,
    budget: null,
    members: null,
  });
  const [resultData, setResultData] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const key = process.env.NEXT_PUBLIC_GOOGLE_PLACE_API_KEY;


  // const login = useGoogleLogin({
  //   onSuccess: tokenResponse => console.log(tokenResponse),
  //   onError: error => console.log(error)
  // });

  // const getUserProfile = (tokenInfo) => {
  //   axios.get(``)
  // }

  // const handleClick = () => {
  //   const user = localStorage.getItem('user');

  //   if(!user){
  //     setOpenDialog(true);
  //     return;
  //   }
  // }
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

    const prompt = `Act as a travel guide and generate a trip for the location: ${formData?.location}, for ${formData?.members} persons, in a ${formData?.budget} budget and for ${formData?.duration} days. 
    Give me a hotel-option list(max-3) with hotel name, address, price, hotel image url, geo-coordinates, rating, descriptions. 
    Also generate a day-to-day itinerary for the most famous places of the location, with a list of different places with their pictures url, location details, timings, entry fee(if applicable). 
    Suggest some famous authentic cuisines(max-3) of that place with picture urls. Return all the data in JSON format.`;

    // send to gemini model

    try {
      const result = await chatSession.sendMessage(prompt);
      console.log(result?.response?.text());

      if (!result) {
        console.error("No result found");
        return;
      }

      // send Data to database
      const data = result?.response?.text();
      const parsedData = JSON.parse(data);
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
        <form onSubmit={handleFormSubmit} className="flex flex-col gap-10">
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
                  className={`border border-zinc-500/40 rounded-lg shadow-lg 
                px-4 py-4 text-center transition-all duration-200 cursor-pointer
                ${
                  formData.budget === item.value
                    ? "bg-slate-200 scale-105"
                    : "hover:bg-slate-200"
                }
                `}
                >
                  <h2 className="text-md font-medium">{item.title}</h2>
                  <p className="text-sm text-gray-500">{item.description}</p>
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
                  className={`border border-zinc-500/40 rounded-lg shadow-lg 
                px-4 py-4 text-center transition-all duration-200 cursor-pointer
                ${
                  formData.members === item.value
                    ? "bg-slate-200 scale-105"
                    : "hover:bg-slate-200"
                }
                `}
                >
                  <h2 className="text-md font-medium">{item.title}</h2>
                  <p className="text-xs text-gray-500">{item.description}</p>
                  <p className="text-sm text-gray-500">{item.people}</p>
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

          {/* <div>
            <Dialog open={openDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="text-center">
                    Sign Up with Google
                  </DialogTitle>
                  <DialogDescription>
                    <p className="my-8 text-center">
                      Sign Up with your Google account and enjoy your trip
                    </p>
                    <Button variant="outline" className="w-full" onClick={() => login()} >
                      <span>
                        <FcGoogle />
                      </span>{" "}
                      Sign Up with Google
                    </Button>
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </div> */}
        </form>
      )}
    </div>
  );
}

export default InputForm;
