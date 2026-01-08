/**
 * Wasil Rider - Ride Redux Slice
 * Manages ride request and tracking state
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { RideService, RIDE_STATUS } from '@wasil/shared';

// Initial state
const initialState = {
  // Current ride
  currentRide: null,
  rideStatus: null, // requested, accepted, arriving, in_progress, completed, cancelled
  
  // Locations
  pickup: null,
  dropoff: null,
  
  // Fare estimate
  fareEstimate: null,
  selectedRideType: 'standard',
  
  // Driver info (when ride is accepted)
  driver: null,
  driverLocation: null,
  
  // ETA
  etaToPickup: null,
  etaToDropoff: null,
  
  // Ride history
  rideHistory: [],
  historyPage: 1,
  hasMoreHistory: true,
  
  // UI state
  isLoading: false,
  isFindingDriver: false,
  error: null,
  
  // Payment
  selectedPaymentMethod: 'cash',
};

// Async Thunks
export const getFareEstimate = createAsyncThunk(
  'ride/getFareEstimate',
  async ({ pickup, dropoff }, { rejectWithValue }) => {
    try {
      const estimate = await RideService.getFareEstimate({ pickup, dropoff });
      return estimate;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const requestRide = createAsyncThunk(
  'ride/request',
  async (rideData, { rejectWithValue }) => {
    try {
      const ride = await RideService.requestRide(rideData);
      return ride;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const cancelRide = createAsyncThunk(
  'ride/cancel',
  async ({ rideId, reason }, { rejectWithValue }) => {
    try {
      const result = await RideService.cancelRide(rideId, reason);
      return result;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const rateRide = createAsyncThunk(
  'ride/rate',
  async ({ rideId, rating, feedback, tip }, { rejectWithValue }) => {
    try {
      const result = await RideService.rateRide(rideId, rating, feedback, tip);
      return result;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const getActiveRide = createAsyncThunk(
  'ride/getActive',
  async (_, { rejectWithValue }) => {
    try {
      const ride = await RideService.getActiveRide();
      return ride;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const getRideHistory = createAsyncThunk(
  'ride/getHistory',
  async ({ page = 1, refresh = false }, { getState, rejectWithValue }) => {
    try {
      const result = await RideService.getRideHistory({ page, limit: 20 });
      return { ...result, page, refresh };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Slice
const rideSlice = createSlice({
  name: 'ride',
  initialState,
  reducers: {
    // Location selection
    setPickup: (state, action) => {
      state.pickup = action.payload;
      state.fareEstimate = null; // Reset estimate when location changes
    },
    setDropoff: (state, action) => {
      state.dropoff = action.payload;
      state.fareEstimate = null;
    },
    clearLocations: (state) => {
      state.pickup = null;
      state.dropoff = null;
      state.fareEstimate = null;
    },
    
    // Ride type selection
    setRideType: (state, action) => {
      state.selectedRideType = action.payload;
    },
    
    // Payment method
    setPaymentMethod: (state, action) => {
      state.selectedPaymentMethod = action.payload;
    },
    
    // Real-time updates from Socket
    updateRideStatus: (state, action) => {
      state.rideStatus = action.payload.status;
      if (action.payload.ride) {
        state.currentRide = action.payload.ride;
      }
    },
    
    setDriverInfo: (state, action) => {
      state.driver = action.payload;
    },
    
    updateDriverLocation: (state, action) => {
      state.driverLocation = action.payload;
    },
    
    updateETA: (state, action) => {
      if (action.payload.toPickup !== undefined) {
        state.etaToPickup = action.payload.toPickup;
      }
      if (action.payload.toDropoff !== undefined) {
        state.etaToDropoff = action.payload.toDropoff;
      }
    },
    
    // Ride accepted event
    rideAccepted: (state, action) => {
      state.rideStatus = RIDE_STATUS.ACCEPTED;
      state.currentRide = action.payload.ride;
      state.driver = action.payload.driver;
      state.isFindingDriver = false;
    },
    
    // Driver arriving event
    driverArriving: (state, action) => {
      state.rideStatus = RIDE_STATUS.ARRIVING;
      state.etaToPickup = action.payload.eta;
    },
    
    // Ride started event
    rideStarted: (state, action) => {
      state.rideStatus = RIDE_STATUS.IN_PROGRESS;
      state.currentRide = action.payload.ride;
    },
    
    // Ride completed event
    rideCompleted: (state, action) => {
      state.rideStatus = RIDE_STATUS.COMPLETED;
      state.currentRide = action.payload.ride;
    },
    
    // Reset ride state
    resetRide: (state) => {
      state.currentRide = null;
      state.rideStatus = null;
      state.pickup = null;
      state.dropoff = null;
      state.fareEstimate = null;
      state.driver = null;
      state.driverLocation = null;
      state.etaToPickup = null;
      state.etaToDropoff = null;
      state.isFindingDriver = false;
      state.error = null;
    },
    
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Get Fare Estimate
    builder
      .addCase(getFareEstimate.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getFareEstimate.fulfilled, (state, action) => {
        state.isLoading = false;
        state.fareEstimate = action.payload;
      })
      .addCase(getFareEstimate.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Request Ride
    builder
      .addCase(requestRide.pending, (state) => {
        state.isFindingDriver = true;
        state.error = null;
      })
      .addCase(requestRide.fulfilled, (state, action) => {
        state.currentRide = action.payload;
        state.rideStatus = RIDE_STATUS.REQUESTED;
        // isFindingDriver stays true until driver accepts
      })
      .addCase(requestRide.rejected, (state, action) => {
        state.isFindingDriver = false;
        state.error = action.payload;
      });

    // Cancel Ride
    builder
      .addCase(cancelRide.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(cancelRide.fulfilled, (state) => {
        state.isLoading = false;
        state.currentRide = null;
        state.rideStatus = RIDE_STATUS.CANCELLED;
        state.driver = null;
        state.driverLocation = null;
        state.isFindingDriver = false;
      })
      .addCase(cancelRide.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Rate Ride
    builder
      .addCase(rateRide.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(rateRide.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentRide = action.payload;
      })
      .addCase(rateRide.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Get Active Ride
    builder
      .addCase(getActiveRide.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getActiveRide.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.currentRide = action.payload;
          state.rideStatus = action.payload.status;
          state.driver = action.payload.driver;
          state.pickup = action.payload.pickup;
          state.dropoff = action.payload.dropoff;
        }
      })
      .addCase(getActiveRide.rejected, (state, action) => {
        state.isLoading = false;
      });

    // Get Ride History
    builder
      .addCase(getRideHistory.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getRideHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.refresh) {
          state.rideHistory = action.payload.rides;
        } else {
          state.rideHistory = [...state.rideHistory, ...action.payload.rides];
        }
        state.historyPage = action.payload.page;
        state.hasMoreHistory = action.payload.rides.length === 20;
      })
      .addCase(getRideHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setPickup,
  setDropoff,
  clearLocations,
  setRideType,
  setPaymentMethod,
  updateRideStatus,
  setDriverInfo,
  updateDriverLocation,
  updateETA,
  rideAccepted,
  driverArriving,
  rideStarted,
  rideCompleted,
  resetRide,
  clearError,
} = rideSlice.actions;

// Selectors
export const selectCurrentRide = (state) => state.ride.currentRide;
export const selectRideStatus = (state) => state.ride.rideStatus;
export const selectPickup = (state) => state.ride.pickup;
export const selectDropoff = (state) => state.ride.dropoff;
export const selectFareEstimate = (state) => state.ride.fareEstimate;
export const selectSelectedRideType = (state) => state.ride.selectedRideType;
export const selectDriver = (state) => state.ride.driver;
export const selectDriverLocation = (state) => state.ride.driverLocation;
export const selectETAToPickup = (state) => state.ride.etaToPickup;
export const selectETAToDropoff = (state) => state.ride.etaToDropoff;
export const selectIsFindingDriver = (state) => state.ride.isFindingDriver;
export const selectRideError = (state) => state.ride.error;
export const selectRideHistory = (state) => state.ride.rideHistory;
export const selectIsLoading = (state) => state.ride.isLoading;
export const selectPaymentMethod = (state) => state.ride.selectedPaymentMethod;

export default rideSlice.reducer;
