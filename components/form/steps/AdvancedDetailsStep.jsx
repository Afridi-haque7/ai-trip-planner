"use client";

import { useContext } from "react";
import { MemberOptions, TRIP_THEMES, CURRENCY_OPTIONS } from "@/constants";
import { TripFormContext } from "@/components/form/TripFormContext";

export default function AdvancedDetailsStep() {
  const { formData, updateField, errors } = useContext(TripFormContext);

  const toggleTheme = (theme) => {
    const currentThemes = formData.tripTheme || [];
    if (currentThemes.includes(theme)) {
      updateField("tripTheme", currentThemes.filter((t) => t !== theme));
    } else {
      updateField("tripTheme", [...currentThemes, theme]);
    }
  };

  return (
    <div className="flex flex-col gap-8 px-2 sm:px-4 py-8">
      {/* Members Input */}
      <div className="flex flex-col gap-3 py-2">
        <label htmlFor="members" className="font-semibold text-lg text-foreground">
          Who's traveling with you?
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MemberOptions.map((item, index) => (
            <button
              key={index}
              type="button"
              onClick={() => updateField("members", item.value)}
              className={`border-2 rounded-xl shadow-md flex gap-4 px-4 py-4 text-left transition-all duration-300 cursor-pointer group ${
                formData.members === item.value
                  ? "bg-primary/20 border-primary scale-105 shadow-lg"
                  : "border-border hover:border-primary/50 hover:bg-card/80 hover:shadow-md"
              }`}
            >
              <img src={item.icon} alt={item.title} className="w-14 h-14 transition-transform group-hover:scale-110" />
              <span>
                <h2 className="text-base font-semibold">{item.title}</h2>
                <p className="text-xs text-muted-foreground">{item.description}</p>
                <p className="text-sm font-medium text-foreground">{item.people}</p>
              </span>
            </button>
          ))}
        </div>
        {errors.members && (
          <p className="text-xs text-red-500 font-medium">{errors.members}</p>
        )}
      </div>

      {/* Currency Input */}
      <div className="flex flex-col gap-3 py-2">
        <label htmlFor="currency" className="font-semibold text-lg text-foreground">
          What's your preferred currency?
        </label>
        <select
          id="currency"
          value={formData.currency}
          onChange={(e) => updateField("currency", e.target.value)}
          className="border border-border bg-card shadow-sm rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
        >
          {CURRENCY_OPTIONS.map((option) => (
            <option key={option.code} value={option.code}>
              {option.label}
            </option>
          ))}
        </select>
        {errors.currency && (
          <p className="text-xs text-red-500 font-medium">{errors.currency}</p>
        )}
      </div>

      {/* Trip Theme - Multi-select */}
      <div className="flex flex-col gap-3 py-2">
        <label className="font-semibold text-lg text-foreground">
          What's your trip theme? (Select one or more)
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {TRIP_THEMES.map((theme) => (
            <button
              key={theme.value}
              type="button"
              onClick={() => toggleTheme(theme.value)}
              className={`border-2 rounded-xl shadow-md flex items-center gap-3 px-4 py-3 text-left transition-all duration-300 cursor-pointer ${
                formData.tripTheme?.includes(theme.value)
                  ? "bg-primary/20 border-primary shadow-lg"
                  : "border-border hover:border-primary/50 hover:bg-card/80 hover:shadow-md"
              }`}
            >
              <span className="text-2xl">{theme.icon}</span>
              <div className="flex-1">
                <h3 className="font-semibold text-base">{theme.label}</h3>
                <p className="text-xs text-muted-foreground">{theme.description}</p>
              </div>
              <div
                className={`size-4 rounded border-2 flex items-center justify-center transition-all ${
                  formData.tripTheme?.includes(theme.value)
                    ? "bg-primary border-primary"
                    : "border-muted-foreground"
                }`}
              >
                {formData.tripTheme?.includes(theme.value) && (
                  <svg className="size-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>
        {errors.tripTheme && (
          <p className="text-xs text-red-500 font-medium">{errors.tripTheme}</p>
        )}
      </div>
    </div>
  );
}
