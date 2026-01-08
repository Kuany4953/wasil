/**
 * Wasil Driver - Redux Store Configuration
 */

import { configureStore } from '@reduxjs/toolkit';
import driverReducer from './slices/driverSlice';

// Import auth slice from rider app (shared auth logic)
// In production, this would be in the shared package
const authInitialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,
};

const authReducer = (state = authInitialState, action) => {
  switch (action.type) {
    case 'auth/initialize/fulfilled':
      return {
        ...state,
        isInitialized: true,
        isAuthenticated: action.payload?.isAuthenticated || false,
        user: action.payload?.user || null,
      };
    case 'auth/login/fulfilled':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
      };
    case 'auth/logout/fulfilled':
      return { ...authInitialState, isInitialized: true };
    default:
      return state;
  }
};

export const store = configureStore({
  reducer: {
    auth: authReducer,
    driver: driverReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: __DEV__,
});

export default store;
