/**
 * API input validation utilities
 */

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate that a string is not empty after trimming
 */
export const isValidString = (value) => {
  return typeof value === "string" && value.trim().length > 0;
};

/**
 * Validate JSON object structure
 */
export const isValidObject = (value) => {
  return value !== null && typeof value === "object" && !Array.isArray(value);
};

/**
 * Validate array
 */
export const isValidArray = (value) => {
  return Array.isArray(value);
};

/**
 * Validate MongoDB ObjectId format
 */
export const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Sanitize user input by trimming whitespace
 */
export const sanitizeString = (value) => {
  if (typeof value === "string") {
    return value.trim();
  }
  return value;
};

/**
 * Validate form submission for trip creation
 */
export const validateTripFormInput = (location, duration, budget, members) => {
  const errors = [];

  if (!isValidString(location)) {
    errors.push("Location is required");
  }

  if (!duration || isNaN(duration) || duration < 1 || duration > 30) {
    errors.push("Duration must be between 1 and 30 days");
  }

  if (!budget || typeof budget !== "string") {
    errors.push("Budget is required");
  }

  if (!members || isNaN(members) || members < 1 || members > 20) {
    errors.push("Members must be between 1 and 20");
  }

  return {
    valid: errors.length === 0,
    errors
  };
};
