"use client";

import { useContext } from "react";
import { Input } from "@/components/ui/input";
import { BudgetOptions } from "@/constants";
import Autocomplete from "react-google-autocomplete";
import { TripFormContext } from "@/components/form/TripFormContext";

const key = process.env.NEXT_PUBLIC_GOOGLE_PLACE_API_KEY;

export default function BasicDetailsStep() {
  const { formData, updateField, errors } = useContext(TripFormContext);

  return (
    <div className="flex flex-col gap-8 px-2 sm:px-4 py-8">
      {/* Origin Input */}
      <div className="flex flex-col gap-3 py-2">
        <label htmlFor="origin" className="font-semibold text-lg text-foreground">
          Where are you traveling from?
        </label>
        <Autocomplete
          apiKey={key}
          onPlaceSelected={(v) => {
            updateField("origin", v.formatted_address);
          }}
          className={`border rounded-lg px-4 py-3 shadow-sm text-base placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-transparent ${
            errors.origin ? "border-red-500" : "border-border"
          }`}
          placeholder="Enter your starting location (city or country)"
          defaultValue={formData.origin || ""}
        />
        {errors.origin && (
          <p className="text-xs text-red-500 font-medium">{errors.origin}</p>
        )}
      </div>

      {/* Destination Input */}
      <div className="flex flex-col gap-3 py-2">
        <label htmlFor="location" className="font-semibold text-lg text-foreground">
          Where are you planning to go?
        </label>
        <Autocomplete
          apiKey={key}
          onPlaceSelected={(v) => {
            updateField("location", v.formatted_address);
          }}
          className={`border rounded-lg px-4 py-3 shadow-sm text-base placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-transparent ${
            errors.location ? "border-red-500" : "border-border"
          }`}
          placeholder="Enter destination city or country"
          defaultValue={formData.location || ""}
        />
        {errors.location && (
          <p className="text-xs text-red-500 font-medium">{errors.location}</p>
        )}
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-2">
        <div className="flex flex-col gap-3">
          <label htmlFor="startDate" className="font-semibold text-lg text-foreground">
            When do you start?
          </label>
          <Input
            id="startDate"
            type="date"
            className={`border shadow-sm rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
              errors.startDate ? "border-red-500" : "border-border"
            }`}
            onChange={(e) => updateField("startDate", e.target.value)}
            value={formData.startDate || ""}
          />
          {errors.startDate && (
            <p className="text-xs text-red-500 font-medium">{errors.startDate}</p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <label htmlFor="endDate" className="font-semibold text-lg text-foreground">
            When do you return?
          </label>
          <Input
            id="endDate"
            type="date"
            className={`border shadow-sm rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
              errors.endDate ? "border-red-500" : "border-border"
            }`}
            onChange={(e) => updateField("endDate", e.target.value)}
            value={formData.endDate || ""}
          />
          {errors.endDate && (
            <p className="text-xs text-red-500 font-medium">{errors.endDate}</p>
          )}
        </div>
      </div>

      {/* Budget Input */}
      <div className="flex flex-col gap-3 py-2">
        <label htmlFor="budget" className="font-semibold text-lg text-foreground">
          What's your budget range?
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {BudgetOptions.map((item, index) => (
            <button
              key={index}
              type="button"
              onClick={() => updateField("budget", item.value)}
              className={`border-2 rounded-xl shadow-md flex justify-evenly items-center px-4 py-4 text-center transition-all duration-300 cursor-pointer group ${
                formData.budget === item.value
                  ? "bg-primary/20 border-primary scale-105 shadow-lg"
                  : "border-border hover:border-primary/50 hover:bg-card/80 hover:shadow-md"
              }`}
            >
              <img src={item.icon} alt={item.title} className="w-12 h-12 transition-transform group-hover:scale-110" />
              <span>
                <h2 className="text-base font-semibold">{item.title}</h2>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </span>
            </button>
          ))}
        </div>
        {errors.budget && (
          <p className="text-xs text-red-500 font-medium">{errors.budget}</p>
        )}
      </div>
    </div>
  );
}
