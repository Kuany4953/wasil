/**
 * Wasil Driver - Driver Redux Slice
 * Manages driver status, rides, and earnings
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { RideService, RIDE_STATUS } from '@wasil/shared';
import { post, get } from '@wasil/shared';

// Initial state
const initialState = {
  // Driver status
  isOnline: false,
  isAvailable: true,
  
  // Current ride
  currentRide: null,
  rideStatus: null,
  riderLocation: null,
  
  // Incoming ride request
  incomingRequest: null,
  requestTimer: 15,
  
  // Earnings
  todayEarnings: 0,
  todayRides: 0,
  weeklyEarnings: 0,
  weeklyRides: 0,
  monthlyEarnings: 0,
  monthlyRides: 0,
  
  // Ride history
  rideHistory: [],
  historyPage: 1,
  hasMoreHistory: true,
  
  // UI state
  isLoading: false,
  error: null,
};

// Async Thunks
export const goOnline = createAsyncThunk(
  'driver/goOnline',
  async (_, { rejectWithValue }) => {
    try {
      const result = await post('/drivers/status', { status: 'online' });
      return result;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const goOffline = createAsyncThunk(
  'driver/goOffline',
  async (_, { rejectWithValue }) => {
    try {
      const result = await post('/drivers/status', { status: 'offline' });
      return result;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const acceptRide = createAsyncThunk(
  'driver/acceptRide',
  async (rideId, { rejectWithValue }) => {
    try {
      const ride = await post(`/rides/${rideId}/accept`);
      return ride;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const declineRide = createAsyncThunk(
  'driver/declineRide',
  async ({ rideId, reason }, { rejectWithValue }) => {
    try {
      await post(`/rides/${rideId}/decline`, { reason });
      return { rideId };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const arrivedAtPickup = createAsyncThunk(
  'driver/arrivedAtPickup',
  async (rideId, { rejectWithValue }) => {
    try {
      const ride = await post(`/rides/${rideId}/arrived`);
      return ride;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const startRide = createAsyncThunk(
  'driver/startRide',
  async (rideId, { rejectWithValue }) => {
    try {
      const ride = await post(`/rides/${rideId}/start`);
      return ride;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const completeRide = createAsyncThunk(
  'driver/completeRide',
  async ({ rideId, finalFare }, { rejectWithValue }) => {
    try {
      const ride = await post(`/rides/${rideId}/complete`, { finalFare });
      return ride;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const cancelRide = createAsyncThunk(
  'driver/cancelRide',
  async ({ rideId, reason }, { rejectWithValue }) => {
    try {
      const result = await post(`/rides/${rideId}/cancel`, { reason });
      return result;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const getEarnings = createAsyncThunk(
  'driver/getEarnings',
  async (_, { rejectWithValue }) => {
    try {
      const earnings = await get('/drivers/earnings');
      return earnings;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const getRideHistory = createAsyncThunk(
  'driver/getRideHistory',
  async ({ page = 1, refresh = false }, { rejectWithValue }) => {
    try {
      const result = await get('/drivers/rides', { params: { page, limit: 20 } });
      return { ...result, page, refresh };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Slice
const driverSlice = createSlice({
  name: 'driver',
  initialState,
  reducers: {
    // New ride request received via socket
    newRideRequest: (state, action) => {
      state.incomingRequest = action.payload;
      state.requestTimer = 15;
    },
    
    // Update request timer
    updateRequestTimer: (state) => {
      if (state.requestTimer > 0) {
        state.requestTimer -= 1;
      } else {
        state.incomingRequest = null;
      }
    },
    
    // Clear incoming request
    clearIncomingRequest: (state) => {
      state.incomingRequest = null;
      state.requestTimer = 15;
    },
    
    // Update ride status from socket
    updateRideStatus: (state, action) => {
      state.rideStatus = action.payload.status;
      if (action.payload.ride) {
        state.currentRide = action.payload.ride;
      }
    },
    
    // Rider cancelled ride
    riderCancelled: (state) => {
      state.currentRide = null;
      state.rideStatus = null;
      state.isAvailable = true;
    },
    
    // Update rider location
    updateRiderLocation: (state, action) => {
      state.riderLocation = action.payload;
    },
    
    // Reset driver state
    resetDriverState: (state) => {
      return { ...initialState, isOnline: state.isOnline };
    },
    
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Go Online
    builder
      .addCase(goOnline.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(goOnline.fulfilled, (state) => {
        state.isLoading = false;
        state.isOnline = true;
        state.isAvailable = true;
      })
      .addCase(goOnline.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Go Offline
    builder
      .addCase(goOffline.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(goOffline.fulfilled, (state) => {
        state.isLoading = false;
        state.isOnline = false;
        state.isAvailable = false;
      })
      .addCase(goOffline.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Accept Ride
    builder
      .addCase(acceptRide.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(acceptRide.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentRide = action.payload;
        state.rideStatus = RIDE_STATUS.ACCEPTED;
        state.incomingRequest = null;
        state.isAvailable = false;
      })
      .addCase(acceptRide.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.incomingRequest = null;
      });

    // Decline Ride
    builder
      .addCase(declineRide.fulfilled, (state) => {
        state.incomingRequest = null;
        state.isAvailable = true;
      });

    // Arrived at Pickup
    builder
      .addCase(arrivedAtPickup.fulfilled, (state, action) => {
        state.currentRide = action.payload;
        state.rideStatus = RIDE_STATUS.ARRIVED;
      });

    // Start Ride
    builder
      .addCase(startRide.fulfilled, (state, action) => {
        state.currentRide = action.payload;
        state.rideStatus = RIDE_STATUS.IN_PROGRESS;
      });

    // Complete Ride
    builder
      .addCase(completeRide.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(completeRide.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentRide = action.payload;
        state.rideStatus = RIDE_STATUS.COMPLETED;
        // Add to today's earnings
        const earnings = action.payload.driverEarnings || 0;
        state.todayEarnings += earnings;
        state.todayRides += 1;
        state.isAvailable = true;
      })
      .addCase(completeRide.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Cancel Ride
    builder
      .addCase(cancelRide.fulfilled, (state) => {
        state.currentRide = null;
        state.rideStatus = null;
        state.isAvailable = true;
      });

    // Get Earnings
    builder
      .addCase(getEarnings.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getEarnings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.todayEarnings = action.payload.today?.earnings || 0;
        state.todayRides = action.payload.today?.rides || 0;
        state.weeklyEarnings = action.payload.weekly?.earnings || 0;
        state.weeklyRides = action.payload.weekly?.rides || 0;
        state.monthlyEarnings = action.payload.monthly?.earnings || 0;
        state.monthlyRides = action.payload.monthly?.rides || 0;
      })
      .addCase(getEarnings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Get Ride History
    builder
      .addCase(getRideHistory.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getRideHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.refresh) {
          state.rideHistory = action.payload.rides || [];
        } else {
          state.rideHistory = [...state.rideHistory, ...(action.payload.rides || [])];
        }
        state.historyPage = action.payload.page;
        state.hasMoreHistory = (action.payload.rides?.length || 0) === 20;
      })
      .addCase(getRideHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  newRideRequest,
  updateRequestTimer,
  clearIncomingRequest,
  updateRideStatus,
  riderCancelled,
  updateRiderLocation,
  resetDriverState,
  clearError,
} = driverSlice.actions;

// Selectors
export const selectIsOnline = (state) => state.driver.isOnline;
export const selectIsAvailable = (state) => state.driver.isAvailable;
export const selectCurrentRide = (state) => state.driver.currentRide;
export const selectRideStatus = (state) => state.driver.rideStatus;
export const selectIncomingRequest = (state) => state.driver.incomingRequest;
export const selectRequestTimer = (state) => state.driver.requestTimer;
export const selectTodayEarnings = (state) => state.driver.todayEarnings;
export const selectTodayRides = (state) => state.driver.todayRides;
export const selectWeeklyEarnings = (state) => state.driver.weeklyEarnings;
export const selectMonthlyEarnings = (state) => state.driver.monthlyEarnings;
export const selectRideHistory = (state) => state.driver.rideHistory;
export const selectIsLoading = (state) => state.driver.isLoading;
export const selectDriverError = (state) => state.driver.error;

export default driverSlice.reducer;
