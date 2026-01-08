/**
 * Wasil Rider - Auth Redux Slice
 * Manages authentication state
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { AuthService } from '@wasil/shared';

// Initial state
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,
  otpSent: false,
  verificationId: null,
};

// Async Thunks
export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { rejectWithValue }) => {
    try {
      const isAuth = await AuthService.isAuthenticated();
      if (isAuth) {
        const user = await AuthService.getCurrentUser();
        return { user, isAuthenticated: true };
      }
      return { user: null, isAuthenticated: false };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const sendOTP = createAsyncThunk(
  'auth/sendOTP',
  async (phoneNumber, { rejectWithValue }) => {
    try {
      const result = await AuthService.requestOTP(phoneNumber);
      return { verificationId: result.verificationId, phoneNumber };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const verifyOTP = createAsyncThunk(
  'auth/verifyOTP',
  async ({ phoneNumber, otp }, { rejectWithValue }) => {
    try {
      const result = await AuthService.verifyOTP(phoneNumber, otp, 'rider');
      return result;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const completeProfile = createAsyncThunk(
  'auth/completeProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const user = await AuthService.completeProfile(profileData);
      return user;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (updates, { rejectWithValue }) => {
    try {
      const user = await AuthService.updateProfile(updates);
      return user;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const uploadPhoto = createAsyncThunk(
  'auth/uploadPhoto',
  async (photo, { rejectWithValue }) => {
    try {
      const photoUrl = await AuthService.uploadProfilePhoto(photo);
      return photoUrl;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const resendOTP = createAsyncThunk(
  'auth/resendOTP',
  async (phoneNumber, { rejectWithValue }) => {
    try {
      const result = await AuthService.requestOTP(phoneNumber);
      return { verificationId: result.verificationId, phoneNumber };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await AuthService.logout();
      return null;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetOTPState: (state) => {
      state.otpSent = false;
      state.verificationId = null;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Initialize Auth
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.user = action.payload.user;
        state.isAuthenticated = action.payload.isAuthenticated;
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.error = action.payload;
      });

    // Send OTP
    builder
      .addCase(sendOTP.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendOTP.fulfilled, (state, action) => {
        state.isLoading = false;
        state.otpSent = true;
        state.verificationId = action.payload.verificationId;
      })
      .addCase(sendOTP.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Verify OTP
    builder
      .addCase(verifyOTP.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyOTP.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.otpSent = false;
        state.verificationId = null;
      })
      .addCase(verifyOTP.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Complete Profile
    builder
      .addCase(completeProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(completeProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(completeProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Update Profile
    builder
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Upload Photo
    builder
      .addCase(uploadPhoto.fulfilled, (state, action) => {
        if (state.user) {
          state.user.photoUrl = action.payload;
        }
      });

    // Logout
    builder
      .addCase(logout.fulfilled, (state) => {
        return { ...initialState, isInitialized: true };
      });
  },
});

export const { clearError, resetOTPState, setUser } = authSlice.actions;

// Selectors
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectIsLoading = (state) => state.auth.isLoading;
export const selectAuthError = (state) => state.auth.error;
export const selectIsInitialized = (state) => state.auth.isInitialized;
export const selectOTPSent = (state) => state.auth.otpSent;

export default authSlice.reducer;
