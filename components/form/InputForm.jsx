'use client';

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { BudgetOptions, MemberOptions } from "@/constants";
import { Button } from "../ui/button";

function InputForm () {

    return (
      <div>
        <form action="" className="flex flex-col gap-10">
          {/* Days input */}
          <div className="flex flex-col gap-2 py-2">
            <label htmlFor="" className="font-medium">
              How many days you want to plan the trip?
            </label>
            <Input
              type="number"
              placeholder="ex.4"
              className="border border-zinc-500/40"
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
                  className="border border-zinc-500/40 rounded-lg shadow-lg 
                px-4 py-4 text-center hover:bg-slate-200 
                transition-all duration-200 cursor-pointer"
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
                  className="border border-zinc-500/40 rounded-lg shadow-lg 
                px-4 py-4 text-center hover:shadow-xl hover:bg-slate-200 
                transition-all duration-200 cursor-pointer"
                >
                  <h2 className="text-md font-medium">{item.title}</h2>
                  <p className="text-xs text-gray-500">{item.description}</p>
                  <p className="text-sm text-gray-500">{item.people}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center w-full">
            <Button className="w-full">Generate Trip</Button>
          </div>
        </form>
      </div>
    );
}

export default InputForm;