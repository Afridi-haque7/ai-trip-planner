"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { BudgetOptions, MemberOptions } from "@/constants";
import { Button } from "../ui/button";
import Autocomplete from "react-google-autocomplete";
import { toast } from "sonner";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2Icon } from "lucide-react";
import { useDispatch } from "react-redux";
import { setTripContext, setLoadingTripGeneration, setTripError } from "@/lib/redux/slices/tripSlice";

// Currency options
const CURRENCY_OPTIONS = [
  { code: "USD", label: "USD (US Dollar)" },
  { code: "EUR", label: "EUR (Euro)" },
  { code: "GBP", label: "GBP (British Pound)" },
  { code: "INR", label: "INR (Indian Rupee)" },
  { code: "JPY", label: "JPY (Japanese Yen)" },
  { code: "AUD", label: "AUD (Australian Dollar)" },
  { code: "CAD", label: "CAD (Canadian Dollar)" },
  { code: "CHF", label: "CHF (Swiss Franc)" },
];

// Budget level mapping
const BUDGET_MAPPING = {
  "cheap": "low",
  "medium": "medium",
  "expensive": "luxury"
};

function InputForm() {
  const [formData, setFormData] = useState({
    location: null,
    startDate: null,
    endDate: null,
    budget: null,
    members: null,
    currency: "USD",
  });
  const [userId, setUserId] = useState(null);
  const key = process.env.NEXT_PUBLIC_GOOGLE_PLACE_API_KEY;
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    if (session) {
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
            const user_id = user._id;
            setUserId(user_id);

            // router.push(`/create-trip/${user_id}`);
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

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    dispatch(setLoadingTripGeneration(true));

    // Validate all fields
    if (
      !formData?.location ||
      !formData?.startDate ||
      !formData?.endDate ||
      !formData?.budget ||
      !formData?.members
    ) {
      toast("Please fill all the fields!", {
        action: {
          label: "Close",
          onClick: () => console.log("Close toast"),
        },
      });
      setIsLoading(false);
      dispatch(setLoadingTripGeneration(false));
      return;
    }

    // Validate date range
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    if (endDate <= startDate) {
      toast("End date must be after start date!", {
        action: { label: "Close", onClick: () => {} },
      });
      setIsLoading(false);
      dispatch(setLoadingTripGeneration(false));
      return;
    }

    if (session) {
      try {
        // Prepare the new ADK schema payload
        const tripInput = {
          destination: formData.location,
          numberOfPeople: formData.members,
          startDate: formData.startDate,
          endDate: formData.endDate,
          budgetLevel: BUDGET_MAPPING[formData.budget],
          currency: formData.currency,
        };

        console.log("[InputForm] Sending trip request:", tripInput);

        const apiResponse = await fetch("/api/generate-trip", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(tripInput),
        });

        if (!apiResponse.ok) {
          const errorData = await apiResponse.json();
          throw new Error(errorData.error || "Failed to generate trip");
        }

        const result = await apiResponse.json();

        if (!result.success || !result.context) {
          toast("Failed to generate trip. Please try again.", {
            action: { label: "Close", onClick: () => {} },
          });
          setIsLoading(false);
          dispatch(setLoadingTripGeneration(false));
          dispatch(setTripError("Failed to generate trip"));
          return;
        }

        console.log("[InputForm] Trip context generated:", result.context);

        console.log("[InputForm] Trip generation succeeded, storing to database...");
        console.log("[InputForm] Using userId:", userId);

        // Store trip to database
        console.log("[InputForm] Calling /api/store-trip with tripContext");
        const storeResponse = await fetch("/api/store-trip", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            tripContext: result.context,
          }),
        });

        if (!storeResponse.ok) {
          const error = await storeResponse.json();
          throw new Error(error.error || "Failed to store trip");
        }

        const storedTrip = await storeResponse.json();
        console.log("[InputForm] Trip stored successfully:", {
          tripId: storedTrip.tripId,
          mongoId: storedTrip._id,
          message: storedTrip.message,
          timestamp: new Date().toISOString(),
        });

        setIsLoading(false);
        dispatch(setLoadingTripGeneration(false));

        // Redirect to view trip using custom tripId (not MongoDB _id)
        router.push(`/view-trip/${storedTrip.tripId}`);
      } catch (error) {
        console.error("[InputForm] Error:", error);
        toast(`An error occurred: ${error.message}`, {
          action: { label: "Close", onClick: () => {} },
        });
        setIsLoading(false);
        dispatch(setLoadingTripGeneration(false));
        dispatch(setTripError(error.message));
      }
    } else {
      return signIn("google", { callbackUrl: window.location.href });
    }
  };

  return (
    <div className="w-full">
      <form
        onSubmit={handleFormSubmit}
        className="flex flex-col gap-8 px-2 sm:px-4 py-8"
      >
        {/* Location Input */}
        <div className="flex flex-col gap-3 py-2">
          <label htmlFor="location" className="font-semibold text-lg text-foreground">
            Where are you planning to go?
          </label>
          <Autocomplete
            apiKey={key}
            onPlaceSelected={(v) => {
              setFormData({
                ...formData,
                location: v.formatted_address,
              });
            }}
            className="border border-border bg-transparent rounded-lg px-4 py-3 shadow-sm text-base placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            placeholder="Enter destination city or country"
          />
        </div>
        {/* Days input - REPLACED with Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-2">
          <div className="flex flex-col gap-3">
            <label htmlFor="startDate" className="font-semibold text-lg text-foreground">
              When do you start?
            </label>
            <Input
              id="startDate"
              type="date"
              className="border border-border shadow-sm rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              onChange={(e) => {
                setFormData({
                  ...formData,
                  startDate: e.target.value,
                });
              }}
              value={formData.startDate || ""}
            />
          </div>
          <div className="flex flex-col gap-3">
            <label htmlFor="endDate" className="font-semibold text-lg text-foreground">
              When do you return?
            </label>
            <Input
              id="endDate"
              type="date"
              className="border border-border shadow-sm rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              onChange={(e) => {
                setFormData({
                  ...formData,
                  endDate: e.target.value,
                });
              }}
              value={formData.endDate || ""}
            />
          </div>
        </div>

        {/* currency input */}
        <div className="flex flex-col gap-3 py-2">
          <label htmlFor="currency" className="font-semibold text-lg text-foreground">
            What's your preferred currency?
          </label>
          <select
            id="currency"
            value={formData.currency}
            onChange={(e) => {
              setFormData({
                ...formData,
                currency: e.target.value,
              });
            }}
            className="border border-border bg-card shadow-sm rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          >
            {CURRENCY_OPTIONS.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* budget input */}
        <div className="flex flex-col gap-3 py-2">
          <label htmlFor="budget" className="font-semibold text-lg text-foreground">
            What's your budget range?
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {BudgetOptions.map((item, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setFormData({ ...formData, budget: item.value })}
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
        </div>

        {/* members input */}
        <div className="flex flex-col gap-3 py-2">
          <label htmlFor="members" className="font-semibold text-lg text-foreground">
            Who's traveling with you?
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MemberOptions.map((item, index) => (
              <button
                key={index}
                type="button"
                onClick={() =>
                  setFormData({ ...formData, members: item.value })
                }
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
        </div>

        <div className="flex justify-center w-full pt-4">
          {isLoading ? (
            <Button size="lg" disabled className="w-full sm:w-auto">
              <Loader2Icon className="animate-spin mr-2" />
              Generating your trip...
            </Button>
          ) : (
            <Button
              type="submit"
              size="lg"
              className="w-full sm:w-auto px-12 bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 font-semibold"
            >
              Generate Trip 🚀
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

export default InputForm;
