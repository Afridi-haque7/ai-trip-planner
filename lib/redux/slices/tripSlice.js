import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  formData: {
    days: '',
    destination: '',
    tripType: '',
    budget: '',
    people: '',
    startDate: '',
    endDate: '',
  },
  aiResponse: null,
  isLoading: false,
  error: null,
};

const tripSlice = createSlice({
  name: 'trip',
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
    clearTrip: (state) => {
      state.formData = {
        days: '',
        destination: '',
        tripType: '',
        budget: '',
        people: '',
        startDate: '',
        endDate: '',
      };
      state.aiResponse = null;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const {
  setFormData,
  updateFormField,
  setAiResponse,
  clearTrip,
  setLoading,
  setError,
} = tripSlice.actions;

export default tripSlice.reducer;
