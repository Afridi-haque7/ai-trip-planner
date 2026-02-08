import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';
import tripReducer from './slices/tripSlice';
import chatsReducer from './slices/chatsSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    trip: tripReducer,
    chats: chatsReducer,
  },
});

export default store;
