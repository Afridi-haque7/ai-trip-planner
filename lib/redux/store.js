import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';
import tripReducer from './slices/tripSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    trip: tripReducer,
  },
});

export default store;
