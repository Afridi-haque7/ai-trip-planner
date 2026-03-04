import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  formData: {
    days: "",
    destination: "",
    tripType: "",
    budget: "",
    people: "",
    startDate: "",
    endDate: "",
  },
  aiResponse: null,
  tripContext: null, // New: Full ADK TripContext
  isLoading: false,
  isLoadingTripGeneration: false, // New: Loading state for trip generation
  error: null,
};

const tripSlice = createSlice({
  name: "trip",
  initialState,
  reducers: {
    setFormData: (state, action) => {
      state.formData = { ...state.formData, ...action.payload };
    },
    updateFormField: (state, action) => {
      const { field, value } = action.payload;
      state.formData[field] = value;
    },
    setAiResponse: (state, action) => {
      state.aiResponse = action.payload;
    },
    setTripContext: (state, action) => {
      state.tripContext = action.payload;
      state.error = null;
    },
    clearTrip: (state) => {
      state.formData = {
        days: "",
        destination: "",
        tripType: "",
        budget: "",
        people: "",
        startDate: "",
        endDate: "",
      };
      state.aiResponse = null;
      state.tripContext = null;
      state.error = null;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setLoadingTripGeneration: (state, action) => {
      state.isLoadingTripGeneration = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setTripError: (state, action) => {
      state.error = action.payload;
      state.isLoadingTripGeneration = false;
    },
  },
});

export const {
  setFormData,
  updateFormField,
  setAiResponse,
  setTripContext,
  clearTrip,
  setLoading,
  setLoadingTripGeneration,
  setError,
  setTripError,
} = tripSlice.actions;

// Selectors
export const selectTripContext = (state) => state.trip.tripContext;
export const selectFormData = (state) => state.trip.formData;
export const selectIsLoadingTripGeneration = (state) =>
  state.trip.isLoadingTripGeneration;
export const selectError = (state) => state.trip.error;

export default tripSlice.reducer;
