export const capitalizeFirstLetter = (string) => {
  if (!string || typeof string !== "string") return string;
  return string.charAt(0).toUpperCase() + string.slice(1);
};

export const getCurrencySymbol = (currencyCode) => {
  if (!currencyCode || typeof currencyCode !== "string") return "";
  const symbols = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
    CNY: "¥",
    INR: "₹",
    AUD: "A$",
    CAD: "C$",
    CHF: "CHF",
  };
  return symbols[currencyCode.toUpperCase()] || currencyCode;
};

export const getTimeOfDay = (startTime) => {
  if (!startTime || typeof startTime !== "string") return "";

  // Extract hour from startTime (assuming HH:MM format)
  const hour = parseInt(startTime.split(":")[0]);

  if (hour >= 0 && hour < 12) {
    return "Morning";
  } else if (hour >= 12 && hour < 18) {
    return "Afternoon";
  } else if (hour >= 18 && hour < 24) {
    return "Evening";
  }

  return "";
};
