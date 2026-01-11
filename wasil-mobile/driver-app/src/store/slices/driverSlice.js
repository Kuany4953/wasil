1/**
2 * Wasil Driver - Driver Redux Slice
3 * Manages driver status, rides, and earnings
4 * Enhanced for professional UI
5 */
6
7import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
8import { RideService, RIDE_STATUS } from '@wasil/shared';
9import { post, get } from '@wasil/shared';
10
11// Initial state
12const initialState = {
13  // Driver status
14  isOnline: false,
15  isAvailable: true,
16  
17  // Current ride
18  currentRide: null,
19  rideStatus: null,
20  riderLocation: null,
21  
22  // Incoming ride request
23  incomingRequest: null,
24  requestTimer: 15,
25  
26  // Earnings
27  todayEarnings: 0,
28  todayRides: 0,
29  weeklyEarnings: 0,
30  weeklyRides: 0,
31  monthlyEarnings: 0,
32  monthlyRides: 0,
33  
34  // Daily stats
35  todayStats: {
36    hoursOnline: 0,
37    distanceCovered: 0,
38    averageRating: 0,
39    totalTrips: 0,
40    acceptanceRate: 0,
41  },
42  
43  // Weekly breakdown for chart
44  weeklyBreakdown: [
45    { day: 'Mon', earnings: 0, trips: 0 },
46    { day: 'Tue', earnings: 0, trips: 0 },
47    { day: 'Wed', earnings: 0, trips: 0 },
48    { day: 'Thu', earnings: 0, trips: 0 },
49    { day: 'Fri', earnings: 0, trips: 0 },
50    { day: 'Sat', earnings: 0, trips: 0 },
51    { day: 'Sun', earnings: 0, trips: 0 },
52  ],
53  
54  // Ride history
55  rideHistory: [],
56  historyPage: 1,
57  hasMoreHistory: true,
58  
59  // UI state
60  isLoading: false,
61  error: null,
62  
63  // Session tracking
64  sessionStartTime: null,
65  sessionStats: {
66    earnings: 0,
67    trips: 0,
68    distance: 0,
69  },
70};
71
72// Async Thunks
73export const goOnline = createAsyncThunk(
74  'driver/goOnline',
75  async (_, { rejectWithValue }) => {
76    try {
77      const result = await post('/drivers/status', { status: 'online' });
78      return { ...result, timestamp: Date.now() };
79    } catch (error) {
80      return rejectWithValue(error.message);
81    }
82  }
83);
84
85export const goOffline = createAsyncThunk(
86  'driver/goOffline',
87  async (_, { rejectWithValue }) => {
88    try {
89      const result = await post('/drivers/status', { status: 'offline' });
90      return { ...result, timestamp: Date.now() };
91    } catch (error) {
92      return rejectWithValue(error.message);
93    }
94  }
95);
96
97export const acceptRide = createAsyncThunk(
98  'driver/acceptRide',
99  async (rideId, { rejectWithValue }) => {
100    try {
101      const ride = await post(`/rides/${rideId}/accept`);
102      return ride;
103    } catch (error) {
104      return rejectWithValue(error.message);
105    }
106  }
107);
108
109export const declineRide = createAsyncThunk(
110  'driver/declineRide',
111  async ({ rideId, reason }, { rejectWithValue }) => {
112    try {
113      await post(`/rides/${rideId}/decline`, { reason });
114      return { rideId };
115    } catch (error) {
116      return rejectWithValue(error.message);
117    }
118  }
119);
120
121export const arrivedAtPickup = createAsyncThunk(
122  'driver/arrivedAtPickup',
123  async (rideId, { rejectWithValue }) => {
124    try {
125      const ride = await post(`/rides/${rideId}/arrived`);
126      return ride;
127    } catch (error) {
128      return rejectWithValue(error.message);
129    }
130  }
131);
132
133export const startRide = createAsyncThunk(
134  'driver/startRide',
135  async (rideId, { rejectWithValue }) => {
136    try {
137      const ride = await post(`/rides/${rideId}/start`);
138      return ride;
139    } catch (error) {
140      return rejectWithValue(error.message);
141    }
142  }
143);
144
145export const completeRide = createAsyncThunk(
146  'driver/completeRide',
147  async ({ rideId, finalFare }, { rejectWithValue }) => {
148    try {
149      const ride = await post(`/rides/${rideId}/complete`, { finalFare });
150      return ride;
151    } catch (error) {
152      return rejectWithValue(error.message);
153    }
154  }
155);
156
157export const cancelRide = createAsyncThunk(
158  'driver/cancelRide',
159  async ({ rideId, reason }, { rejectWithValue }) => {
160    try {
161      const result = await post(`/rides/${rideId}/cancel`, { reason });
162      return result;
163    } catch (error) {
164      return rejectWithValue(error.message);
165    }
166  }
167);
168
169export const getEarnings = createAsyncThunk(
170  'driver/getEarnings',
171  async (_, { rejectWithValue }) => {
172    try {
173      const earnings = await get('/drivers/earnings');
174      return earnings;
175    } catch (error) {
176      return rejectWithValue(error.message);
177    }
178  }
179);
180
181export const getRideHistory = createAsyncThunk(
182  'driver/getRideHistory',
183  async ({ page = 1, refresh = false }, { rejectWithValue }) => {
184    try {
185      const result = await get('/drivers/rides', { params: { page, limit: 20 } });
186      return { ...result, page, refresh };
187    } catch (error) {
188      return rejectWithValue(error.message);
189    }
190  }
191);
192
193export const getDailyStats = createAsyncThunk(
194  'driver/getDailyStats',
195  async (_, { rejectWithValue }) => {
196    try {
197      const stats = await get('/drivers/stats/today');
198      return stats;
199    } catch (error) {
200      return rejectWithValue(error.message);
201    }
202  }
203);
204
205export const getWeeklyBreakdown = createAsyncThunk(
206  'driver/getWeeklyBreakdown',
207  async (_, { rejectWithValue }) => {
208    try {
209      const breakdown = await get('/drivers/earnings/weekly-breakdown');
210      return breakdown;
211    } catch (error) {
212      return rejectWithValue(error.message);
213    }
214  }
215);
216
217// Slice
218const driverSlice = createSlice({
219  name: 'driver',
220  initialState,
221  reducers: {
222    // New ride request received via socket
223    newRideRequest: (state, action) => {
224      state.incomingRequest = action.payload;
225      state.requestTimer = 15;
226    },
227    
228    // Update request timer
229    updateRequestTimer: (state) => {
230      if (state.requestTimer > 0) {
231        state.requestTimer -= 1;
232      } else {
233        // Auto-decline when timer reaches 0
234        state.incomingRequest = null;
235        state.requestTimer = 15;
236      }
237    },
238    
239    // Clear incoming request
240    clearIncomingRequest: (state) => {
241      state.incomingRequest = null;
242      state.requestTimer = 15;
243    },
244    
245    // Update ride status from socket
246    updateRideStatus: (state, action) => {
247      state.rideStatus = action.payload.status;
248      if (action.payload.ride) {
249        state.currentRide = action.payload.ride;
250      }
251    },
252    
253    // Rider cancelled ride
254    riderCancelled: (state) => {
255      state.currentRide = null;
256      state.rideStatus = null;
257      state.isAvailable = true;
258    },
259    
260    // Update rider location
261    updateRiderLocation: (state, action) => {
262      state.riderLocation = action.payload;
263    },
264    
265    // Update session stats
266    updateSessionStats: (state, action) => {
267      const { earnings, distance } = action.payload;
268      if (earnings) state.sessionStats.earnings += earnings;
269      if (distance) state.sessionStats.distance += distance;
270    },
271    
272    // Increment session trips
273    incrementSessionTrips: (state) => {
274      state.sessionStats.trips += 1;
275    },
276    
277    // Calculate hours online
278    updateHoursOnline: (state) => {
279      if (state.sessionStartTime && state.isOnline) {
280        const hoursOnline = (Date.now() - state.sessionStartTime) / (1000 * 60 * 60);
281        state.todayStats.hoursOnline = hoursOnline;
282      }
283    },
284    
285    // Reset driver state
286    resetDriverState: (state) => {
287      return { ...initialState, isOnline: state.isOnline };
288    },
289    
290    // Reset session stats
291    resetSessionStats: (state) => {
292      state.sessionStats = {
293        earnings: 0,
294        trips: 0,
295        distance: 0,
296      };
297      state.sessionStartTime = null;
298    },
299    
300    clearError: (state) => {
301      state.error = null;
302    },
303  },
304  extraReducers: (builder) => {
305    // Go Online
306    builder
307      .addCase(goOnline.pending, (state) => {
308        state.isLoading = true;
309      })
310      .addCase(goOnline.fulfilled, (state, action) => {
311        state.isLoading = false;
312        state.isOnline = true;
313        state.isAvailable = true;
314        state.sessionStartTime = action.payload.timestamp;
315      })
316      .addCase(goOnline.rejected, (state, action) => {
317        state.isLoading = false;
318        state.error = action.payload;
319      });
320
321    // Go Offline
322    builder
323      .addCase(goOffline.pending, (state) => {
324        state.isLoading = true;
325      })
326      .addCase(goOffline.fulfilled, (state, action) => {
327        state.isLoading = false;
328        state.isOnline = false;
329        state.isAvailable = false;
330        // Calculate final session hours
331        if (state.sessionStartTime) {
332          const hoursOnline = (action.payload.timestamp - state.sessionStartTime) / (1000 * 60 * 60);
333          state.todayStats.hoursOnline = hoursOnline;
334        }
335      })
336      .addCase(goOffline.rejected, (state, action) => {
337        state.isLoading = false;
338        state.error = action.payload;
339      });
340
341    // Accept Ride
342    builder
343      .addCase(acceptRide.pending, (state) => {
344        state.isLoading = true;
345      })
346      .addCase(acceptRide.fulfilled, (state, action) => {
347        state.isLoading = false;
348        state.currentRide = action.payload;
349        state.rideStatus = RIDE_STATUS.ACCEPTED;
350        state.incomingRequest = null;
351        state.isAvailable = false;
352        state.requestTimer = 15;
353      })
354      .addCase(acceptRide.rejected, (state, action) => {
355        state.isLoading = false;
356        state.error = action.payload;
357        state.incomingRequest = null;
358        state.requestTimer = 15;
359      });
360
361    // Decline Ride
362    builder
363      .addCase(declineRide.fulfilled, (state) => {
364        state.incomingRequest = null;
365        state.isAvailable = true;
366        state.requestTimer = 15;
367      });
368
369    // Arrived at Pickup
370    builder
371      .addCase(arrivedAtPickup.fulfilled, (state, action) => {
372        state.currentRide = action.payload;
373        state.rideStatus = RIDE_STATUS.ARRIVED;
374      });
375
376    // Start Ride
377    builder
378      .addCase(startRide.fulfilled, (state, action) => {
379        state.currentRide = action.payload;
380        state.rideStatus = RIDE_STATUS.IN_PROGRESS;
381      });
382
383    // Complete Ride
384    builder
385      .addCase(completeRide.pending, (state) => {
386        state.isLoading = true;
387      })
388      .addCase(completeRide.fulfilled, (state, action) => {
389        state.isLoading = false;
390        state.currentRide = action.payload;
391        state.rideStatus = RIDE_STATUS.COMPLETED;
392        
393        // Update earnings and stats
394        const earnings = action.payload.driverEarnings || 0;
395        const distance = action.payload.distance || 0;
396        
397        state.todayEarnings += earnings;
398        state.todayRides += 1;
399        state.todayStats.totalTrips += 1;
400        state.todayStats.distanceCovered += distance;
401        
402        // Update session stats
403        state.sessionStats.earnings += earnings;
404        state.sessionStats.trips += 1;
405        state.sessionStats.distance += distance;
406        
407        // Update weekly breakdown for current day
408        const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
409        const dayIndex = today === 0 ? 6 : today - 1; // Convert to Mon=0, Sun=6
410        if (state.weeklyBreakdown[dayIndex]) {
411          state.weeklyBreakdown[dayIndex].earnings += earnings;
412          state.weeklyBreakdown[dayIndex].trips += 1;
413        }
414        
415        state.isAvailable = true;
416      })
417      .addCase(completeRide.rejected, (state, action) => {
418        state.isLoading = false;
419        state.error = action.payload;
420      });
421
422    // Cancel Ride
423    builder
424      .addCase(cancelRide.fulfilled, (state) => {
425        state.currentRide = null;
426        state.rideStatus = null;
427        state.isAvailable = true;
428      });
429
430    // Get Earnings
431    builder
432      .addCase(getEarnings.pending, (state) => {
433        state.isLoading = true;
434      })
435      .addCase(getEarnings.fulfilled, (state, action) => {
436        state.isLoading = false;
437        state.todayEarnings = action.payload.today?.earnings || 0;
438        state.todayRides = action.payload.today?.rides || 0;
439        state.weeklyEarnings = action.payload.weekly?.earnings || 0;
440        state.weeklyRides = action.payload.weekly?.rides || 0;
441        state.monthlyEarnings = action.payload.monthly?.earnings || 0;
442        state.monthlyRides = action.payload.monthly?.rides || 0;
443      })
444      .addCase(getEarnings.rejected, (state, action) => {
445        state.isLoading = false;
446        state.error = action.payload;
447      });
448
449    // Get Ride History
450    builder
451      .addCase(getRideHistory.pending, (state) => {
452        state.isLoading = true;
453      })
454      .addCase(getRideHistory.fulfilled, (state, action) => {
455        state.isLoading = false;
456        if (action.payload.refresh) {
457          state.rideHistory = action.payload.rides || [];
458        } else {
459          state.rideHistory = [...state.rideHistory, ...(action.payload.rides || [])];
460        }
461        state.historyPage = action.payload.page;
462        state.hasMoreHistory = (action.payload.rides?.length || 0) === 20;
463      })
464      .addCase(getRideHistory.rejected, (state, action) => {
465        state.isLoading = false;
466        state.error = action.payload;
467      });
468
469    // Get Daily Stats
470    builder
471      .addCase(getDailyStats.fulfilled, (state, action) => {
472        state.todayStats = {
473          hoursOnline: action.payload.hoursOnline || 0,
474          distanceCovered: action.payload.distanceCovered || 0,
475          averageRating: action.payload.averageRating || 0,
476          totalTrips: action.payload.totalTrips || 0,
477          acceptanceRate: action.payload.acceptanceRate || 0,
478        };
479      });
480
481    // Get Weekly Breakdown
482    builder
483      .addCase(getWeeklyBreakdown.fulfilled, (state, action) => {
484        if (action.payload.breakdown && Array.isArray(action.payload.breakdown)) {
485          state.weeklyBreakdown = action.payload.breakdown;
486        }
487      });
488  },
489});
490
491export const {
492  newRideRequest,
493  updateRequestTimer,
494  clearIncomingRequest,
495  updateRideStatus,
496  riderCancelled,
497  updateRiderLocation,
498  updateSessionStats,
499  incrementSessionTrips,
500  updateHoursOnline,
501  resetDriverState,
502  resetSessionStats,
503  clearError,
504} = driverSlice.actions;
505
506// Selectors
507export const selectIsOnline = (state) => state.driver.isOnline;
508export const selectIsAvailable = (state) => state.driver.isAvailable;
509export const selectCurrentRide = (state) => state.driver.currentRide;
510export const selectRideStatus = (state) => state.driver.rideStatus;
511export const selectIncomingRequest = (state) => state.driver.incomingRequest;
512export const selectRequestTimer = (state) => state.driver.requestTimer;
513export const selectTodayEarnings = (state) => state.driver.todayEarnings;
514export const selectTodayRides = (state) => state.driver.todayRides;
515export const selectWeeklyEarnings = (state) => state.driver.weeklyEarnings;
516export const selectMonthlyEarnings = (state) => state.driver.monthlyEarnings;
517export const selectRideHistory = (state) => state.driver.rideHistory;
518export const selectIsLoading = (state) => state.driver.isLoading;
519export const selectDriverError = (state) => state.driver.error;
520
521// Enhanced selectors for new features
522export const selectTodayStats = (state) => state.driver.todayStats;
523export const selectWeeklyBreakdown = (state) => state.driver.weeklyBreakdown;
524export const selectSessionStats = (state) => state.driver.sessionStats;
525export const selectHoursOnline = (state) => state.driver.todayStats.hoursOnline;
526export const selectDistanceCovered = (state) => state.driver.todayStats.distanceCovered;
527export const selectAverageRating = (state) => state.driver.todayStats.averageRating;
528
529// Computed selectors
530export const selectAverageEarningsPerTrip = (state) => {
531  const { todayEarnings, todayRides } = state.driver;
532  return todayRides > 0 ? todayEarnings / todayRides : 0;
533};
534
535export const selectEarningsPerHour = (state) => {
536  const { todayEarnings, todayStats } = state.driver;
537  const hours = todayStats.hoursOnline;
538  return hours > 0 ? todayEarnings / hours : 0;
539};
540
541export const selectHasActiveRide = (state) => {
542  return state.driver.currentRide !== null;
543};
544
545export const selectCanAcceptRides = (state) => {
546  return state.driver.isOnline && state.driver.isAvailable && !state.driver.currentRide;
547};
548
549// Format helpers (can be used in components)
550export const selectFormattedHoursOnline = (state) => {
551  const hours = state.driver.todayStats.hoursOnline;
552  if (hours < 1) {
553    return `${Math.round(hours * 60)} min`;
554  }
555  return `${hours.toFixed(1)} hrs`;
556};
557
558export const selectFormattedDistance = (state) => {
559  const km = state.driver.todayStats.distanceCovered;
560  return `${Math.round(km)} km`;
561};
562
563export default driverSlice.reducer;
