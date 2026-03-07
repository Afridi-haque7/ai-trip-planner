"use client";

import { useContext, useState, Fragment } from "react";
import { Button } from "@/components/ui/button";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { useSession, signIn } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { setTripContext, setLoadingTripGeneration, setTripError } from "@/lib/redux/slices/tripSlice";
import { TripFormContext } from "@/components/form/TripFormContext";
import BasicDetailsStep from "@/components/form/steps/BasicDetailsStep";
import AdvancedDetailsStep from "@/components/form/steps/AdvancedDetailsStep";
import ReviewStep from "@/components/form/steps/ReviewStep";

// Budget level mapping
const BUDGET_MAPPING = {
  cheap: "low",
  medium: "medium",
  expensive: "luxury",
};

const STEP_LABELS = {
  1: "Basic Details",
  2: "Advanced Details",
  3: "Review",
};

export default function StepperForm() {
  const {
    currentStep,
    formData,
    goNext,
    goBack,
    resetForm,
    validateStep,
  } = useContext(TripFormContext);

  const userId = useSelector((state) => state.user.googleId) || "unknown";
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();
  const dispatch = useDispatch();

  // Fetch user ID when session is available
  // const handleSessionCheck = async () => {
  //   if (session && !userId) {
  //     const email = session.user.email;
  //     try {
  //       const response = await fetch("/api/get-user-id", {
  //         method: "POST",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify({ email }),
  //       });
  //       if (response.ok) {
  //         const user = await response.json();
  //         // setUserId(user._id);
  //       }
  //     } catch (error) {
  //       console.error("Error fetching user ID:", error);
  //       toast("Error: Could not fetch user information", {
  //         action: { label: "Close", onClick: () => {} },
  //       });
  //     }
  //   }
  // };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      goNext();
    } else {
      toast("Please fill in all required fields", {
        action: { label: "Close", onClick: () => {} },
      });
    }
  };

  const handleFinish = async () => {
    if (!session) {
      return router.push("/login?redirect=/dashboard");
    }

    setIsLoading(true);
    dispatch(setLoadingTripGeneration(true));

    try {
      // Ensure we have user ID
      if (!userId) {
        
        console.warn("User Id is missing");
        return;
      }

      // Prepare the trip input
      const tripInput = {
        origin: formData.origin,
        destination: formData.location,
        numberOfPeople: formData.members,
        startDate: formData.startDate,
        endDate: formData.endDate,
        budgetLevel: BUDGET_MAPPING[formData.budget],
        currency: formData.currency,
        tripTheme: formData.tripTheme || [],
      };

      console.log("[StepperForm] Sending trip request:", tripInput);

      // Generate trip
      const apiResponse = await fetch("/api/generate-trip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

      console.log("[StepperForm] Trip context generated:", result.context);

      // Store trip context in Redux state
      dispatch(setTripContext(result.context));

      // Store trip to database
      const storeResponse = await fetch("/api/store-trip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      console.log("[StepperForm] Trip stored successfully:", {
        tripId: storedTrip.tripId,
        mongoId: storedTrip._id,
        message: storedTrip.message,
        timestamp: new Date().toISOString(),
      });

      setIsLoading(false);
      dispatch(setLoadingTripGeneration(false));
      resetForm();

      // Redirect to view trip
      router.push(`/view-trip/${storedTrip.tripId}`);
    } catch (error) {
      console.error("[StepperForm] Error:", error);
      toast(`An error occurred: ${error.message}`, {
        action: { label: "Close", onClick: () => {} },
      });
      setIsLoading(false);
      dispatch(setLoadingTripGeneration(false));
      dispatch(setTripError(error.message));
    }
  };

  // Step indicator component
  const StepIndicator = () => (
    <div className="flex items-start mb-8">
      {[1, 2, 3].map((step, idx) => (
        <Fragment key={step}>
          {/* Connector line between steps — placed before step 2 and 3 */}
          {idx > 0 && (
            <div
              className={`flex-1 h-0.5 mt-[18px] sm:mt-5 mx-1 sm:mx-2 rounded transition-colors duration-300 ${
                currentStep > idx ? "bg-primary" : "bg-muted"
              }`}
            />
          )}
          {/* Step column — fixed equal width keeps all gaps identical */}
          <div className="flex flex-col items-center gap-1.5 shrink-0 w-16 sm:w-20">
            <div
              className={`flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full font-semibold text-sm transition-all duration-300 ${
                currentStep >= step
                  ? "bg-primary text-white dark:text-black"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {currentStep > step ? (
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                step
              )}
            </div>
            <span className={`text-[10px] sm:text-xs font-medium text-center leading-tight ${
              currentStep >= step ? "text-primary" : "text-muted-foreground"
            }`}>
              {STEP_LABELS[step]}
            </span>
          </div>
        </Fragment>
      ))}
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <BasicDetailsStep />;
      case 2:
        return <AdvancedDetailsStep />;
      case 3:
        return <ReviewStep />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      
        <StepIndicator />

      {/* Step Content */}
      <div className="min-h-96 py-4">{renderStep()}</div>

      {/* Button Group */}
      <div className="mt-8 flex justify-between items-center gap-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={goBack}
          disabled={currentStep === 1 || isLoading}
          className="py-2 px-3 inline-flex items-center gap-x-1 text-sm font-medium"
        >
          <svg className="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back
        </Button>

        <div className="flex gap-2">
          {currentStep < 3 && (
            <Button
              type="button"
              onClick={handleNext}
              disabled={isLoading}
              className="py-2 px-3 inline-flex items-center gap-x-1 text-sm font-medium rounded-lg bg-blue-600 dark:bg-blue-500 border border-transparent text-white hover:bg-blue-700 dark:hover:bg-blue-600"
            >
              Next
              <svg className="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </Button>
          )}

          {currentStep === 3 && (
            <Button
              type="button"
              onClick={handleFinish}
              disabled={isLoading}
              className="py-2 px-3 inline-flex items-center gap-x-1 text-sm font-medium rounded-lg bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 border border-transparent text-white"
            >
              {isLoading ? (
                <>
                  <Loader2Icon className="animate-spin mr-2 size-4" />
                  Generating...
                </>
              ) : (
                "Finish & Generate Trip 🚀"
              )}
            </Button>
          )}
        </div>

        <div className="w-20"></div>
      </div>
    </div>
  );
}
