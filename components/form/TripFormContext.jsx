"use client";

import { createContext, useState, useCallback } from "react";

export const TripFormContext = createContext();

export const TripFormProvider = ({ children }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    location: null,
    startDate: null,
    endDate: null,
    budget: null,
    members: null,
    currency: "USD",
    tripTheme: [],
  });
  const [errors, setErrors] = useState({});

  const updateField = useCallback((field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field when user updates it
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }
  }, [errors]);

  const validateStep = useCallback((step) => {
    const newErrors = {};

    if (step === 1) {
      // Basic Details validation
      if (!formData.location) {
        newErrors.location = "Location is required";
      }
      if (!formData.startDate) {
        newErrors.startDate = "Start date is required";
      }
      if (!formData.endDate) {
        newErrors.endDate = "End date is required";
      }
      if (formData.startDate && formData.endDate) {
        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);
        if (end <= start) {
          newErrors.endDate = "End date must be after start date";
        }
      }
      if (!formData.budget) {
        newErrors.budget = "Budget is required";
      }
    }

    if (step === 2) {
      // Advanced Details validation
      if (!formData.members) {
        newErrors.members = "Number of members is required";
      }
      if (!formData.currency) {
        newErrors.currency = "Currency is required";
      }
      if (formData.tripTheme.length === 0) {
        newErrors.tripTheme = "Select at least one trip theme";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const goToStep = useCallback((step) => {
    // Validate current step before moving
    if (step > currentStep && !validateStep(currentStep)) {
      return false;
    }
    setCurrentStep(step);
    return true;
  }, [currentStep, validateStep]);

  const goNext = useCallback(() => {
    return goToStep(currentStep + 1);
  }, [currentStep, goToStep]);

  const goBack = useCallback(() => {
    setCurrentStep(Math.max(1, currentStep - 1));
    return true;
  }, [currentStep]);

  const resetForm = useCallback(() => {
    setCurrentStep(1);
    setFormData({
      location: null,
      startDate: null,
      endDate: null,
      budget: null,
      members: null,
      currency: "USD",
      tripTheme: [],
    });
    setErrors({});
  }, []);

  const value = {
    currentStep,
    setCurrentStep,
    formData,
    updateField,
    errors,
    setErrors,
    validateStep,
    goToStep,
    goNext,
    goBack,
    resetForm,
  };

  return (
    <TripFormContext.Provider value={value}>
      {children}
    </TripFormContext.Provider>
  );
};
