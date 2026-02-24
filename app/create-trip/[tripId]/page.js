"use client";

import InputForm from "@/components/form/InputForm";
import { useSearchParams } from "next/navigation";

const CreateTrip = () => {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || "default"; // Fallback if id
  // const {id} = params;    // some issue is there
  return (
    <div className="w-full flex justify-center items-center py-4 px-4 lg:px-2 min-h-screen">
      <main className="mt-32 w-full max-w-4xl mb-16">
        <div className="mb-12">
          <h1
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-center 
          bg-gradient-to-r from-pink-500 via-red-500 to-orange-500 bg-clip-text text-transparent mb-6"
          >
            {`Tell Us Your Travel Preferences`}
          </h1>
          <p className="text-center mx-auto max-w-xl px-2 text-base md:text-lg text-muted-foreground leading-relaxed">
            Just provide some basic information, and Trip Tailor will generate a
            customized itinerary just for you. Let's create your perfect trip!
          </p>
        </div>
        <div className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 via-red-500 to-orange-500 rounded-2xl opacity-20 blur"></div>
          <div className="relative p-6 md:p-8 border border-border rounded-2xl bg-card backdrop-blur-sm">
            <InputForm />
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateTrip;
