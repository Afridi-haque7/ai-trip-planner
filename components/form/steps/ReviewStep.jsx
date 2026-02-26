"use client";

import { useContext } from "react";
import { MemberOptions, BudgetOptions, TRIP_THEMES, CURRENCY_OPTIONS } from "@/constants";
import { TripFormContext } from "@/components/form/TripFormContext";

export default function ReviewStep() {
  const { formData } = useContext(TripFormContext);

  const getMemberLabel = (value) => {
    return MemberOptions.find((m) => m.value === value)?.title || "";
  };

  const getBudgetLabel = (value) => {
    return BudgetOptions.find((b) => b.value === value)?.title || "";
  };

  const getThemeLabels = (themes) => {
    return themes.map((t) => TRIP_THEMES.find((theme) => theme.value === t)?.label).join(", ");
  };

  const getCurrencyLabel = (code) => {
    return CURRENCY_OPTIONS.find((c) => c.code === code)?.label || code;
  };

  const getDaysDifference = () => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    }
    return 0;
  };

  const reviewItems = [
    {
      icon: "📍",
      label: "Destination",
      value: formData.location || "Not selected",
    },
    {
      icon: "📅",
      label: "Travel Dates",
      value: formData.startDate && formData.endDate 
        ? `${formData.startDate} to ${formData.endDate} (${getDaysDifference()} days)`
        : "Not selected",
    },
    {
      icon: "💰",
      label: "Budget",
      value: getBudgetLabel(formData.budget) || "Not selected",
    },
    {
      icon: "👥",
      label: "Travelers",
      value: getMemberLabel(formData.members) || "Not selected",
    },
    {
      icon: "🪙",
      label: "Currency",
      value: getCurrencyLabel(formData.currency),
    },
    {
      icon: "🎯",
      label: "Trip Themes",
      value: getThemeLabels(formData.tripTheme || []) || "Not selected",
    },
  ];

  return (
    <div className="flex flex-col gap-6 px-2 sm:px-4 py-8">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-foreground mb-2">Review Your Trip Details</h2>
        <p className="text-muted-foreground">Please verify all your selections below before proceeding</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reviewItems.map((item, index) => (
          <div
            key={index}
            className="border border-border rounded-xl p-5 bg-card/50 hover:bg-card/80 transition-colors duration-200"
          >
            <div className="flex items-start gap-3">
              <span className="text-3xl">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground mb-1">{item.label}</p>
                <p className="text-base font-semibold text-foreground break-words">{item.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-border pt-6 mt-6">
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            ✓ All information is locked for review. Click <span className="font-semibold">Finish</span> to generate your personalized trip plan with AI agents.
          </p>
        </div>
      </div>
    </div>
  );
}
