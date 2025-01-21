"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import dbConnect from "@/lib/dbConnect";

export default function Home() {
  return (
    <div className="w-full flex justify-center itemms-center py-4 px-4 lg:px-2">
      <div
        className="relative mt-10 inset-0 lg:mx-auto bg-[url('/iphone.png')] md:bg-[url('/macbook.png')] 
      bg-cover bg-center w-[700px] h-[725px] lg:w-[900px] lg:h-[800px] flex text-center justify-center items-center flex-wrap overflow-hidden"
      >
        <div className="w-[300px] md:w-full text-center px-4 md:px-24 md:py-4 flex flex-col justify-center items-center">
          <h1 className=" text-2xl md:text-3xl lg:text-5xl font-bold text-center flex flex-col">
            <span className="bg-gradient-to-r from-pink-500 via-red-500 to-orange-500 bg-clip-text text-transparent">
              Discover Your Next Adventure With AI:
            </span>
            <br />
            <span>Personalized Itineraries at Your Fingertips </span>
          </h1>
          <p className="text-center mx-auto px-2 mt-10 text-sm text-gray-500">
            Your personal trip planner and travel curator, creating custom
            itineraries tailored as per your preferences
          </p>
          <div className="flex justify-center items-center mt-10 flex-wrap">
            <Link href="/create-trip">
              <Button
                variant="default"
                className="text-lg font-semibold px-8 py-6 rounded-xl"
              >
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
