import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import userReducer from './slices/userSlice';
import tripReducer from './slices/tripSlice';
import chatsReducer from './slices/chatsSlice';

const userPersistConfig = { key: 'user', storage };
const chatsPersistConfig = { key: 'chats', storage };

export const store = configureStore({
  reducer: {
    user: persistReducer(userPersistConfig, userReducer),
    trip: tripReducer,
    chats: persistReducer(chatsPersistConfig, chatsReducer),
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export default store;
