/**
2 * Wasil Driver - Redux Store Configuration
3 * Enhanced with proper auth management and middleware
4 */
5import { configureStore } from '@reduxjs/toolkit';
6import { createSlice } from '@reduxjs/toolkit';
7import driverReducer from './slices/driverSlice';
8
9// Enhanced Auth Slice
10const authSlice = createSlice({
11  name: 'auth',
12  initialState: {
13    user: null,
14    token: null,
15    isAuthenticated: false,
16    isLoading: false,
17    isInitialized: false,
18    error: null,
19    profile: {
20      firstName: '',
21      lastName: '',
22      phone: '',
23      email: '',
24      photo: null,
25      rating: 0,
26      totalTrips: 0,
27      memberSince: null,
28    },
29  },
30  reducers: {
31    // Sync actions for immediate state updates
32    setUser: (state, action) => {
33      state.user = action.payload;
34    },
35    setToken: (state, action) => {
36      state.token = action.payload;
37    },
38    setAuthenticated: (state, action) => {
39      state.isAuthenticated = action.payload;
40    },
41    updateProfile: (state, action) => {
42      state.profile = { ...state.profile, ...action.payload };
43    },
44    clearAuth: (state) => {
45      state.user = null;
46      state.token = null;
47      state.isAuthenticated = false;
48      state.profile = {
49        firstName: '',
50        lastName: '',
51        phone: '',
52        email: '',
53        photo: null,
54        rating: 0,
55        totalTrips: 0,
56        memberSince: null,
57      };
58    },
59    setError: (state, action) => {
60      state.error = action.payload;
61    },
62    clearError: (state) => {
63      state.error = null;
64    },
65  },
66  extraReducers: (builder) => {
67    // Handle async thunks if you add them later
68    builder
69      .addMatcher(
70        (action) => action.type.endsWith('/pending') && action.type.startsWith('auth/'),
71        (state) => {
72          state.isLoading = true;
73          state.error = null;
74        }
75      )
76      .addMatcher(
77        (action) => action.type.endsWith('/fulfilled') && action.type.startsWith('auth/'),
78        (state, action) => {
79          state.isLoading = false;
80          
81          // Handle initialization
82          if (action.type === 'auth/initialize/fulfilled') {
83            state.isInitialized = true;
84            state.isAuthenticated = action.payload?.isAuthenticated || false;
85            state.user = action.payload?.user || null;
86            state.token = action.payload?.token || null;
87            if (action.payload?.profile) {
88              state.profile = { ...state.profile, ...action.payload.profile };
89            }
90          }
91          
92          // Handle login
93          if (action.type === 'auth/login/fulfilled') {
94            state.isAuthenticated = true;
95            state.user = action.payload.user;
96            state.token = action.payload.token;
97            if (action.payload.profile) {
98              state.profile = { ...state.profile, ...action.payload.profile };
99            }
100          }
101          
102          // Handle register
103          if (action.type === 'auth/register/fulfilled') {
104            state.isAuthenticated = true;
105            state.user = action.payload.user;
106            state.token = action.payload.token;
107            if (action.payload.profile) {
108              state.profile = { ...state.profile, ...action.payload.profile };
109            }
110          }
111          
112          // Handle logout
113          if (action.type === 'auth/logout/fulfilled') {
114            state.user = null;
115            state.token = null;
116            state.isAuthenticated = false;
117            state.isInitialized = true;
118            state.profile = {
119              firstName: '',
120              lastName: '',
121              phone: '',
122              email: '',
123              photo: null,
124              rating: 0,
125              totalTrips: 0,
126              memberSince: null,
127            };
128          }
129        }
130      )
131      .addMatcher(
132        (action) => action.type.endsWith('/rejected') && action.type.startsWith('auth/'),
133        (state, action) => {
134          state.isLoading = false;
135          state.error = action.payload || action.error?.message || 'An error occurred';
136        }
137      );
138  },
139});
140
141// Export auth actions
142export const {
143  setUser,
144  setToken,
145  setAuthenticated,
146  updateProfile,
147  clearAuth,
148  setError: setAuthError,
149  clearError: clearAuthError,
150} = authSlice.actions;
151
152// Auth selectors
153export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
154export const selectUser = (state) => state.auth.user;
155export const selectToken = (state) => state.auth.token;
156export const selectAuthProfile = (state) => state.auth.profile;
157export const selectAuthError = (state) => state.auth.error;
158export const selectAuthLoading = (state) => state.auth.isLoading;
159export const selectIsInitialized = (state) => state.auth.isInitialized;
160
161// Store configuration
162export const store = configureStore({
163  reducer: {
164    auth: authSlice.reducer,
165    driver: driverReducer,
166  },
167  middleware: (getDefaultMiddleware) =>
168    getDefaultMiddleware({
169      serializableCheck: {
170        // Ignore these action types for serialization checks
171        ignoredActions: [
172          'persist/PERSIST',
173          'persist/REHYDRATE',
174          'persist/REGISTER',
175          'persist/PURGE',
176        ],
177        // Ignore these paths in the state
178        ignoredPaths: ['auth.user.lastLogin', 'driver.sessionStartTime'],
179      },
180      // Enable immutability checks in development
181      immutableCheck: __DEV__,
182    }),
183  devTools: __DEV__ && {
184    // Redux DevTools configuration
185    name: 'Wasil Driver',
186    trace: true,
187    traceLimit: 25,
188  },
189});
190
191// Export store type for TypeScript if needed
192export type RootState = ReturnType<typeof store.getState>;
193export type AppDispatch = typeof store.dispatch;
194
195export default store;
196
