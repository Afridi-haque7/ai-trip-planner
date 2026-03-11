import { createSlice } from '@reduxjs/toolkit';
import { createSelector } from 'reselect';

const initialState = {
  // Form data for creating a new trip
  formData: {
    days: '',
    destination: '',
    tripType: '',
    budget: '',
    people: '',
    startDate: '',
    endDate: '',
  },
  // Array of trip objects (matching Trip.js schema)
  chats: [],
  isLoading: false,
  error: null,
};

const chatsSlice = createSlice({
  name: 'chats',
  initialState,
  reducers: {
    // Form data reducers
    setFormData: (state, action) => {
      state.formData = { ...state.formData, ...action.payload };
    },
    updateFormField: (state, action) => {
      const { field, value } = action.payload;
      state.formData[field] = value;
    },
    clearFormData: (state) => {
      state.formData = {
        days: '',
        destination: '',
        tripType: '',
        budget: '',
        people: '',
        startDate: '',
        endDate: '',
      };
    },

    // Chats/trips reducers
    setChats: (state, action) => {
      state.chats = action.payload;
    },
    addChat: (state, action) => {
      state.chats.push(action.payload);
    },
    upsertChatByTripId: (state, action) => {
      const incoming = action.payload;
      if (!incoming?.tripId) return;

      const existingIndex = state.chats.findIndex(
        (chat) => chat.tripId === incoming.tripId
      );

      if (existingIndex === -1) {
        state.chats.push(incoming);
        return;
      }

      state.chats[existingIndex] = {
        ...state.chats[existingIndex],
        ...incoming,
      };
    },
    updateChat: (state, action) => {
      const { chatId, chatData } = action.payload;
      const chatIndex = state.chats.findIndex((chat) => chat._id === chatId);
      if (chatIndex !== -1) {
        state.chats[chatIndex] = { ...state.chats[chatIndex], ...chatData };
      }
    },
    deleteChat: (state, action) => {
      state.chats = state.chats.filter((chat) => chat._id !== action.payload);
    },
    clearChats: (state) => {
      state.chats = [];
    },

    // Loading and error states
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
  clearFormData,
  setChats,
  addChat,
  upsertChatByTripId,
  updateChat,
  deleteChat,
  clearChats,
  setLoading,
  setError,
} = chatsSlice.actions;

// Memoized selectors
const selectChatsState = (state) => state.chats;

export const selectFormData = createSelector(
  [selectChatsState],
  (chatsState) => chatsState.formData
);

export const selectAllChats = createSelector(
  [selectChatsState],
  (chatsState) => chatsState.chats
);

export const selectChatByTripId = (tripId) =>
  createSelector(
    [selectAllChats],
    (chats) => chats.find((chat) => chat.tripId === tripId) ?? null
  );

export const selectChatsLoading = createSelector(
  [selectChatsState],
  (chatsState) => chatsState.isLoading
);

export const selectChatsError = createSelector(
  [selectChatsState],
  (chatsState) => chatsState.error
);

// Selector to get a specific chat by ID
export const selectChatById = (chatId) =>
  createSelector(
    [selectAllChats],
    (chats) => chats.find((chat) => chat._id === chatId)
  );

export default chatsSlice.reducer;
