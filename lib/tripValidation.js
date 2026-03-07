/**
 * Validate trip data structure from Gemini API response
 * Ensures required fields are present and have correct types
 */
export const validateTripData = (data) => {
  const errors = [];

  // Check required top-level fields
  if (!data.tripDetails) {
    errors.push("Missing tripDetails field");
  } else {
    const requiredTripDetails = ["location", "duration", "budget", "travelers"];
    requiredTripDetails.forEach(field => {
      if (!data.tripDetails[field]) {
        errors.push(`Missing tripDetails.${field}`);
      }
    });
  }

  if (!Array.isArray(data.hotelOptions) || data.hotelOptions.length === 0) {
    errors.push("Missing or empty hotelOptions array");
  } else {
    // Validate hotel structure
    data.hotelOptions.forEach((hotel, index) => {
      const requiredFields = ["name", "address", "price", "imageUrl"];
      requiredFields.forEach(field => {
        if (!hotel[field]) {
          errors.push(`hotelOptions[${index}] missing ${field}`);
        }
      });
    });
  }

  if (!data.itinerary || typeof data.itinerary !== "object") {
    errors.push("Missing or invalid itinerary field");
  } else {
    // Check if itinerary has at least one day
    const dayKeys = Object.keys(data.itinerary);
    if (dayKeys.length === 0) {
      errors.push("Itinerary has no days defined");
    }
    // Validate each day's structure
    dayKeys.forEach(dayKey => {
      const day = data.itinerary[dayKey];
      if (!Array.isArray(day.activities) && typeof day.activities !== "object") {
        errors.push(`itinerary.${dayKey} missing or invalid activities`);
      }
    });
  }

  if (!Array.isArray(data.authenticDishes) || data.authenticDishes.length === 0) {
    errors.push("Missing or empty authenticDishes array");
  } else {
    data.authenticDishes.forEach((dish, index) => {
      if (!dish.name || !dish.imageUrl) {
        errors.push(`authenticDishes[${index}] missing name or imageUrl`);
      }
    });
  }

  if (!data.estimatedCost || typeof data.estimatedCost !== "object") {
    errors.push("Missing or invalid estimatedCost field");
  } else {
    const requiredCostFields = ["totalCost"];
    requiredCostFields.forEach(field => {
      if (!data.estimatedCost[field]) {
        errors.push(`estimatedCost missing ${field}`);
      }
    });
  }

  if (errors.length > 0) {
    return {
      valid: false,
      errors,
      message: `Validation failed with ${errors.length} error(s): ${errors.join("; ")}`
    };
  }

  return {
    valid: true,
    errors: [],
    message: "Trip data is valid"
  };
};
