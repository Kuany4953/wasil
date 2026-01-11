/**
2 * Wasil Driver - Main App Entry Point
3 * Enhanced with professional UI and better state management
4 */
5
6import React, { useEffect } from 'react';
7import { Provider, useDispatch, useSelector } from 'react-redux';
8import { GestureHandlerRootView } from 'react-native-gesture-handler';
9import { SafeAreaProvider } from 'react-native-safe-area-context';
10import { I18nextProvider } from 'react-i18next';
11import { StatusBar, LogBox, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
12import { NavigationContainer } from '@react-navigation/native';
13import { createStackNavigator } from '@react-navigation/stack';
14import { createDrawerNavigator } from '@react-navigation/drawer';
15
16import store from './src/store/store';
17import HomeScreen from './src/screens/home/HomeScreen';
18import EarningsScreen from './src/screens/earnings/EarningsScreen';
19import { i18n, colors, spacing, typography, borderRadius, shadows } from '@wasil/shared';
20import { PageLoading } from './shared/src/components/Loading';
21import { selectIsAuthenticated, selectAuthProfile } from './src/store/store';
22
23// Ignore specific warnings in development
24LogBox.ignoreLogs([
25  'Non-serializable values were found',
26  'VirtualizedLists should never be nested',
27]);
28
29const Stack = createStackNavigator();
30const Drawer = createDrawerNavigator();
31
32// Placeholder screens
33const PlaceholderScreen = ({ route }) => (
34  <View style={placeholderStyles.container}>
35    <View style={placeholderStyles.iconContainer}>
36      <View style={placeholderStyles.icon} />
37    </View>
38    <Text style={placeholderStyles.title}>{route.name}</Text>
39    <Text style={placeholderStyles.subtitle}>This feature is coming soon</Text>
40  </View>
41);
42
43const placeholderStyles = StyleSheet.create({
44  container: {
45    flex: 1,
46    justifyContent: 'center',
47    alignItems: 'center',
48    backgroundColor: '#F8F9FA',
49    padding: spacing.xl,
50  },
51  iconContainer: {
52    width: 80,
53    height: 80,
54    borderRadius: 40,
55    backgroundColor: colors.primary + '15',
56    justifyContent: 'center',
57    alignItems: 'center',
58    marginBottom: spacing.xl,
59  },
60  icon: {
61    width: 40,
62    height: 40,
63    borderRadius: 20,
64    backgroundColor: colors.primary,
65  },
66  title: {
67    fontSize: typography.fontSize['2xl'],
68    fontWeight: '700',
69    color: '#111827',
70    marginBottom: spacing.sm,
71  },
72  subtitle: {
73    fontSize: typography.fontSize.md,
74    color: '#6B7280',
75    fontWeight: '500',
76  },
77});
78
79// Enhanced Drawer Content
80const DrawerContent = ({ navigation }) => {
81  const profile = useSelector(selectAuthProfile);
82  
83  const menuItems = [
84    { 
85      icon: 'home',
86      label: 'Home',
87      route: 'Home',
88      screen: 'Home',
89    },
90    {
91      icon: 'earnings',
92      label: 'Earnings',
93      route: 'Earnings',
94      screen: 'Earnings',
95    },
96    {
97      icon: 'history',
98      label: 'Ride History',
99      route: 'RideHistory',
100      screen: 'RideHistory',
101    },
102    {
103      icon: 'documents',
104      label: 'Documents',
105      route: 'Documents',
106      screen: 'Documents',
107    },
108    {
109      icon: 'settings',
110      label: 'Settings',
111      route: 'Settings',
112      screen: 'Settings',
113    },
114    {
115      icon: 'help',
116      label: 'Help & Support',
117      route: 'Help',
118      screen: 'Help',
119    },
120  ];
121
122  const renderIcon = (iconType) => {
123    const iconStyles = {
124      home: styles.homeIcon,
125      earnings: styles.earningsIcon,
126      history: styles.historyIcon,
127      documents: styles.documentsIcon,
128      settings: styles.settingsIcon,
129      help: styles.helpIcon,
130    };
131
132    return (
133      <View style={styles.menuIconContainer}>
134        <View style={iconStyles[iconType] || styles.defaultIcon} />
135      </View>
136    );
137  };
138
139  return (
140    <View style={styles.drawerContainer}>
141      {/* Header */}
142      <View style={styles.drawerHeader}>
143        <View style={styles.avatarContainer}>
144          <Text style={styles.avatarText}>
145            {profile?.firstName?.[0]?.toUpperCase() || 'D'}
146          </Text>
147        </View>
148        <Text style={styles.driverName}>
149          {profile?.firstName || 'Driver'} {profile?.lastName || 'Name'}
150        </Text>
151        <Text style={styles.driverPhone}>{profile?.phone || '+211 9XX XXX XXX'}</Text>
152        
153        {/* Rating Badge */}
154        <View style={styles.ratingBadge}>
155          <View style={styles.starIconDrawer} />
156          <Text style={styles.ratingText}>{profile?.rating?.toFixed(1) || '4.8'}</Text>
157        </View>
158      </View>
159
160      {/* Menu Items */}
161      <View style={styles.drawerMenu}>
162        {menuItems.map((item, index) => (
163          <TouchableOpacity
164            key={index}
165            style={styles.drawerMenuItem}
166            onPress={() => navigation.navigate('MainStack', { screen: item.screen })}
167            activeOpacity={0.7}
168          >
169            {renderIcon(item.icon)}
170            <Text style={styles.drawerMenuLabel}>{item.label}</Text>
171            <View style={styles.chevronRight} />
172          </TouchableOpacity>
173        ))}
174      </View>
175
176      {/* Footer */}
177      <View style={styles.drawerFooter}>
178        <TouchableOpacity style={styles.logoutButton} activeOpacity={0.7}>
179          <View style={styles.logoutIconContainer}>
180            <View style={styles.logoutIcon} />
181          </View>
182          <Text style={styles.logoutText}>Logout</Text>
183        </TouchableOpacity>
184        <Text style={styles.versionText}>Wasil Driver v1.0.0</Text>
185      </View>
186    </View>
187  );
188};
189
190// Main Stack Navigator
191const MainStackNavigator = () => (
192  <Stack.Navigator screenOptions={{ headerShown: false }}>
193    <Stack.Screen name="Home" component={HomeScreen} />
194    <Stack.Screen name="Earnings" component={EarningsScreen} />
195    <Stack.Screen name="RideHistory" component={PlaceholderScreen} />
196    <Stack.Screen name="Documents" component={PlaceholderScreen} />
197    <Stack.Screen name="Settings" component={PlaceholderScreen} />
198    <Stack.Screen name="Help" component={PlaceholderScreen} />
199    <Stack.Screen name="RideNavigation" component={PlaceholderScreen} />
200    <Stack.Screen name="RideComplete" component={PlaceholderScreen} />
201    <Stack.Screen name="RideDetail" component={PlaceholderScreen} />
202  </Stack.Navigator>
203);
204
205// Main Drawer Navigator
206const MainNavigator = () => (
207  <Drawer.Navigator
208    drawerContent={(props) => <DrawerContent {...props} />}
209    screenOptions={{
210      headerShown: false,
211      drawerType: 'front',
212      drawerStyle: {
213        width: 300,
214      },
215    }}
216  >
217    <Drawer.Screen name="MainStack" component={MainStackNavigator} />
218  </Drawer.Navigator>
219);
220
221// App Navigator
222const AppNavigator = () => {
223  // In production, check auth status here
224  const isAuthenticated = true; // For demo
225
226  return (
227    <NavigationContainer>
228      <Stack.Navigator screenOptions={{ headerShown: false }}>
229        {isAuthenticated ? (
230          <Stack.Screen name="Main" component={MainNavigator} />
231        ) : (
232          <Stack.Screen name="Auth" component={PlaceholderScreen} />
233        )}
234      </Stack.Navigator>
235    </NavigationContainer>
236  );
237};
238
239const App = () => {
240  return (
241    <GestureHandlerRootView style={{ flex: 1 }}>
242      <Provider store={store}>
243        <SafeAreaProvider>
244          <I18nextProvider i18n={i18n}>
245            <StatusBar
246              barStyle="dark-content"
247              backgroundColor="transparent"
248              translucent
249            />
250            <AppNavigator />
251          </I18nextProvider>
252        </SafeAreaProvider>
253      </Provider>
254    </GestureHandlerRootView>
255  );
256};
257
258const styles = StyleSheet.create({
259  // Drawer Container
260  drawerContainer: {
261    flex: 1,
262    backgroundColor: '#FFFFFF',
263  },
264
265  // Drawer Header
266  drawerHeader: {
267    backgroundColor: colors.primary,
268    paddingHorizontal: spacing.xl,
269    paddingTop: spacing['3xl'] + spacing.xl,
270    paddingBottom: spacing.xl,
271    alignItems: 'center',
272  },
273  avatarContainer: {
274    width: 80,
275    height: 80,
276    borderRadius: 40,
277    backgroundColor: '#FFFFFF',
278    justifyContent: 'center',
279    alignItems: 'center',
280    marginBottom: spacing.md,
281    ...shadows.lg,
282  },
283  avatarText: {
284    fontSize: 32,
285    fontWeight: '800',
286    color: colors.primary,
287  },
288  driverName: {
289    fontSize: typography.fontSize.xl,
290    fontWeight: '700',
291    color: '#FFFFFF',
292    marginBottom: spacing.xs,
293    letterSpacing: -0.3,
294  },
295  driverPhone: {
296    fontSize: typography.fontSize.md,
297    color: '#FFFFFF',
298    opacity: 0.9,
299    fontWeight: '500',
300  },
301  ratingBadge: {
302    flexDirection: 'row',
303    alignItems: 'center',
304    backgroundColor: 'rgba(255, 255, 255, 0.25)',
305    paddingHorizontal: spacing.base,
306    paddingVertical: spacing.sm,
307    borderRadius: borderRadius.full,
308    marginTop: spacing.md,
309  },
310  starIconDrawer: {
311    width: 0,
312    height: 0,
313    backgroundColor: 'transparent',
314    borderStyle: 'solid',
315    borderLeftWidth: 6,
316    borderRightWidth: 6,
317    borderBottomWidth: 10,
318    borderLeftColor: 'transparent',
319    borderRightColor: 'transparent',
320    borderBottomColor: '#FCD34D',
321    transform: [{ rotate: '35deg' }],
322    marginRight: spacing.sm,
323  },
324  ratingText: {
325    color: '#FFFFFF',
326    fontSize: typography.fontSize.md,
327    fontWeight: '700',
328  },
329
330  // Drawer Menu
331  drawerMenu: {
332    flex: 1,
333    paddingTop: spacing.lg,
334  },
335  drawerMenuItem: {
336    flexDirection: 'row',
337    alignItems: 'center',
338    paddingVertical: spacing.base,
339    paddingHorizontal: spacing.xl,
340    marginHorizontal: spacing.md,
341    borderRadius: borderRadius.lg,
342  },
343  menuIconContainer: {
344    width: 40,
345    height: 40,
346    borderRadius: 20,
347    backgroundColor: '#F3F4F6',
348    justifyContent: 'center',
349    alignItems: 'center',
350    marginRight: spacing.md,
351  },
352  drawerMenuLabel: {
353    flex: 1,
354    fontSize: typography.fontSize.md,
355    color: '#374151',
356    fontWeight: '600',
357  },
358  chevronRight: {
359    width: 0,
360    height: 0,
361    backgroundColor: 'transparent',
362    borderStyle: 'solid',
363    borderTopWidth: 5,
364    borderBottomWidth: 5,
365    borderLeftWidth: 7,
366    borderTopColor: 'transparent',
367    borderBottomColor: 'transparent',
368    borderLeftColor: '#D1D5DB',
369  },
370
371  // Menu Icons (CSS-based)
372  homeIcon: {
373    width: 20,
374    height: 18,
375    backgroundColor: colors.primary,
376    borderTopLeftRadius: 3,
377    borderTopRightRadius: 3,
378  },
379  earningsIcon: {
380    width: 18,
381    height: 18,
382    borderRadius: 9,
383    borderWidth: 2,
384    borderColor: colors.primary,
385  },
386  historyIcon: {
387    width: 18,
388    height: 18,
389    borderRadius: 2,
390    borderWidth: 2,
391    borderColor: colors.primary,
392  },
393  documentsIcon: {
394    width: 16,
395    height: 20,
396    backgroundColor: colors.primary,
397    borderRadius: 2,
398  },
399  settingsIcon: {
400    width: 20,
401    height: 20,
402    borderRadius: 10,
403    borderWidth: 2,
404    borderColor: colors.primary,
405  },
406  helpIcon: {
407    width: 20,
408    height: 20,
409    borderRadius: 10,
410    borderWidth: 2,
411    borderColor: colors.primary,
412  },
413  defaultIcon: {
414    width: 18,
415    height: 18,
416    backgroundColor: colors.primary,
417    borderRadius: 4,
418  },
419
420  // Drawer Footer
421  drawerFooter: {
422    padding: spacing.xl,
423    borderTopWidth: 1,
424    borderTopColor: '#F3F4F6',
425  },
426  logoutButton: {
427    flexDirection: 'row',
428    alignItems: 'center',
429    paddingVertical: spacing.md,
430  },
431  logoutIconContainer: {
432    width: 20,
433    height: 20,
434    justifyContent: 'center',
435    alignItems: 'center',
436    marginRight: spacing.md,
437  },
438  logoutIcon: {
439    width: 0,
440    height: 0,
441    backgroundColor: 'transparent',
442    borderStyle: 'solid',
443    borderTopWidth: 7,
444    borderBottomWidth: 7,
445    borderLeftWidth: 10,
446    borderTopColor: 'transparent',
447    borderBottomColor: 'transparent',
448    borderLeftColor: '#EF4444',
449  },
450  logoutText: {
451    fontSize: typography.fontSize.md,
452    color: '#EF4444',
453    fontWeight: '600',
454  },
455  versionText: {
456    fontSize: typography.fontSize.xs,
457    color: '#9CA3AF',
458    marginTop: spacing.md,
459    textAlign: 'center',
460    fontWeight: '500',
461  },
462});
463
464export default App;
465
