import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  name: '',
  email: '',
  googleId: '',
  profileImage: '',
  chats: [],
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserDetails: (state, action) => {
      state.name = action.payload.name;
      state.email = action.payload.email;
      state.googleId = action.payload.googleId;
      state.chats = action.payload.chats;
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
      state.name = '';
      state.email = '';
      state.googleId = '';
      state.profileImage = '';
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
  updateUserName,
  updateUserEmail,
  updateProfileImage,
  clearUser,
  setLoading,
  setError,
} = userSlice.actions;

// Selector to get all user details
export const selectUserDetails = (state) => state.user;
export const selectUserName = (state) => state.user.name;
export const selectUserEmail = (state) => state.user.email;
export const selectUserProfile = (state) => ({
  name: state.user.name,
  email: state.user.email,
  googleId: state.user.googleId,
  profileImage: state.user.profileImage,
  chats: state.user.chats,
});

export default userSlice.reducer;
