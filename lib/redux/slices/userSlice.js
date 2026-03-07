import { createSlice } from '@reduxjs/toolkit';
import { createSelector } from 'reselect';

const initialState = {
  _id: '',
  name: '',
  email: '',
  googleId: '',
  profileImage: '',
  chats: [],
  subscriptionPlan: 'free',
  subscriptionEndDate: null,
  monthlyTripCount: 0,
  isInitialized: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserDetails: (state, action) => {
      state._id = action.payload._id ?? state._id;
      state.name = action.payload.name;
      state.email = action.payload.email;
      state.googleId = action.payload.googleId;
      state.profileImage = action.payload.profileImage;
      state.chats = action.payload.chats;
      state.subscriptionPlan = action.payload.subscriptionPlan ?? state.subscriptionPlan;
      state.subscriptionEndDate = action.payload.subscriptionEndDate ?? state.subscriptionEndDate;
      state.monthlyTripCount = action.payload.monthlyTripCount ?? state.monthlyTripCount;
    },
    setUserInitialized: (state, action) => {
      state.isInitialized = action.payload;
    },
    updateUserName: (state, action) => {
      state.name = action.payload;
    },
    updateUserEmail: (state, action) => {
      state.email = action.payload;
    },
    updateProfileImage: (state, action) => {
      state.profileImage = action.payload;
    },
    clearUser: (state) => {
      state._id = '';
      state.name = '';
      state.email = '';
      state.googleId = '';
      state.profileImage = '';
      state.chats = [];
      state.subscriptionPlan = 'free';
      state.subscriptionEndDate = null;
      state.monthlyTripCount = 0;
      state.isInitialized = false;
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
  setUserDetails,
  setUserInitialized,
  updateUserName,
  updateUserEmail,
  updateProfileImage,
  clearUser,
  setLoading,
  setError,
} = userSlice.actions;

// Basic selectors
export const selectUserDetails = (state) => state.user;
export const selectUserName = (state) => state.user.name;
export const selectUserEmail = (state) => state.user.email;
export const selectUserId = (state) => state.user._id;
export const selectIsUserInitialized = (state) => state.user.isInitialized;

// Memoized selector for profile display
export const selectUserProfile = createSelector(
  [(state) => state.user.name,
   (state) => state.user.email,
   (state) => state.user.googleId,
   (state) => state.user.profileImage,
   (state) => state.user.chats],
  (name, email, googleId, profileImage, chats) => ({
    name,
    email,
    googleId,
    profileImage,
    chats,
  })
);

// Memoized selector for subscription info
export const selectSubscriptionDetails = createSelector(
  [(state) => state.user.subscriptionPlan,
   (state) => state.user.subscriptionEndDate,
   (state) => state.user.monthlyTripCount],
  (subscriptionPlan, subscriptionEndDate, monthlyTripCount) => ({
    subscriptionPlan,
    subscriptionEndDate,
    monthlyTripCount,
  })
);

export default userSlice.reducer;
