/**
 * Wasil Rider - Home Screen
 * Main screen with map and ride request interface
 */

import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Platform,
  Animated,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DrawerActions } from '@react-navigation/native';

import MapView, { JUBA_REGION } from '../../../../shared/src/components/MapView';
import { colors, spacing, typography, borderRadius, shadows } from '@wasil/shared';
import { selectUser } from '../../store/slices/authSlice';
import {
  selectPickup,
  selectDropoff,
  selectCurrentRide,
  selectRideStatus,
  selectDriverLocation,
  setPickup,
  getActiveRide,
} from '../../store/slices/rideSlice';

const { width, height } = Dimensions.get('window');

// Mock nearby drivers for demo
const MOCK_DRIVERS = [
  { id: 1, latitude: 4.8634, longitude: 31.5753, heading: 45, name: 'Driver 1' },
  { id: 2, latitude: 4.8564, longitude: 31.5683, heading: 120, name: 'Driver 2' },
  { id: 3, latitude: 4.8524, longitude: 31.5793, heading: 270, name: 'Driver 3' },
  { id: 4, latitude: 4.8654, longitude: 31.5643, heading: 180, name: 'Driver 4' },
];

const HomeScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const mapRef = useRef(null);
  
  const user = useSelector(selectUser);
  const pickup = useSelector(selectPickup);
  const dropoff = useSelector(selectDropoff);
  const currentRide = useSelector(selectCurrentRide);
  const rideStatus = useSelector(selectRideStatus);
  const driverLocation = useSelector(selectDriverLocation);
  
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyDrivers, setNearbyDrivers] = useState(MOCK_DRIVERS);
  const bottomSheetAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Check for active ride on mount
    dispatch(getActiveRide());
    
    // Get user's current location
    getCurrentLocation();
    
    // Animate bottom sheet in
    Animated.spring(bottomSheetAnim, {
      toValue: 1,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  const getCurrentLocation = async () => {
    // In production, use Geolocation API
    // For demo, use Juba center
    const mockLocation = {
      latitude: 4.8594,
      longitude: 31.5713,
      address: 'Current Location',
    };
    setUserLocation(mockLocation);
    
    // Set as default pickup
    if (!pickup) {
      dispatch(setPickup(mockLocation));
    }
  };

  const handleOpenDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  const handleSearchPress = (field = 'dropoff') => {
    navigation.navigate('SearchLocation', { focusedField: field });
  };

  const handleMyLocation = () => {
    if (userLocation) {
      mapRef.current?.animateToCoordinate({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      });
    }
  };

  const handleSOSPress = () => {
    // Show SOS options
    navigation.navigate('SOS');
  };

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('home.goodMorning', { defaultValue: 'Good morning' });
    if (hour < 18) return t('home.goodAfternoon', { defaultValue: 'Good afternoon' });
    return t('home.goodEvening', { defaultValue: 'Good evening' });
  };

  // Determine what to show based on ride status
  const hasActiveRide = currentRide && rideStatus && !['completed', 'cancelled'].includes(rideStatus);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={JUBA_REGION}
        showsUserLocation
        driverMarkers={!hasActiveRide ? nearbyDrivers : []}
        pickupLocation={pickup}
        dropoffLocation={dropoff}
        userLocation={userLocation}
        onPress={(e) => {
          // Optional: Set location on map tap
          console.log('Map pressed:', e.nativeEvent.coordinate);
        }}
      />

      {/* Top Bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        {/* Menu Button */}
        <TouchableOpacity
          style={styles.menuButton}
          onPress={handleOpenDrawer}
        >
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>

        {/* Search Bar (for dropoff) */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => handleSearchPress('dropoff')}
        >
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchPlaceholder}>
            {t('home.whereToGo', { defaultValue: 'Where to?' })}
          </Text>
        </TouchableOpacity>

        {/* SOS Button */}
        <TouchableOpacity
          style={styles.sosButton}
          onPress={handleSOSPress}
        >
          <Text style={styles.sosIcon}>🆘</Text>
        </TouchableOpacity>
      </View>

      {/* My Location Button */}
      <TouchableOpacity
        style={[styles.myLocationButton, { bottom: 260 + insets.bottom }]}
        onPress={handleMyLocation}
      >
        <Text style={styles.myLocationIcon}>◎</Text>
      </TouchableOpacity>

      {/* Bottom Sheet */}
      <Animated.View
        style={[
          styles.bottomSheet,
          { paddingBottom: insets.bottom + spacing.md },
          {
            transform: [{
              translateY: bottomSheetAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [300, 0],
              }),
            }],
          },
        ]}
      >
        {!hasActiveRide ? (
          /* Default: Show destination selection */
          <>
            {/* Greeting */}
            <View style={styles.greetingSection}>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.userName}>
                {user?.first_name || t('common.rider', { defaultValue: 'Rider' })}
              </Text>
            </View>

            {/* Location Inputs */}
            <View style={styles.locationSection}>
              {/* Pickup */}
              <TouchableOpacity
                style={styles.locationRow}
                onPress={() => handleSearchPress('pickup')}
              >
                <View style={styles.locationDot}>
                  <View style={styles.pickupDot} />
                </View>
                <View style={styles.locationTextContainer}>
                  <Text style={styles.locationLabel}>
                    {t('ride.pickup', { defaultValue: 'Pickup' })}
                  </Text>
                  <Text style={styles.locationText} numberOfLines={1}>
                    {pickup?.address || t('ride.currentLocation', { defaultValue: 'Current location' })}
                  </Text>
                </View>
                <Text style={styles.editIcon}>✏️</Text>
              </TouchableOpacity>

              {/* Connector */}
              <View style={styles.connector}>
                <View style={styles.connectorDots}>
                  <View style={styles.dot} />
                  <View style={styles.dot} />
                  <View style={styles.dot} />
                </View>
              </View>

              {/* Dropoff */}
              <TouchableOpacity
                style={styles.locationRow}
                onPress={() => handleSearchPress('dropoff')}
              >
                <View style={styles.locationDot}>
                  <View style={styles.dropoffDot} />
                </View>
                <View style={styles.locationTextContainer}>
                  <Text style={styles.locationLabel}>
                    {t('ride.dropoff', { defaultValue: 'Dropoff' })}
                  </Text>
                  <Text
                    style={[
                      styles.locationText,
                      !dropoff && styles.locationPlaceholder,
                    ]}
                    numberOfLines={1}
                  >
                    {dropoff?.address || t('ride.whereTo', { defaultValue: 'Where do you want to go?' })}
                  </Text>
                </View>
                <Text style={styles.arrowIcon}>→</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Destinations */}
            <View style={styles.quickDestinations}>
              <Text style={styles.quickTitle}>
                {t('home.recentPlaces', { defaultValue: 'Recent places' })}
              </Text>
              <View style={styles.quickList}>
                <TouchableOpacity style={styles.quickItem}>
                  <View style={styles.quickIcon}>
                    <Text>🏠</Text>
                  </View>
                  <Text style={styles.quickLabel}>Home</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickItem}>
                  <View style={styles.quickIcon}>
                    <Text>💼</Text>
                  </View>
                  <Text style={styles.quickLabel}>Work</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickItem}>
                  <View style={styles.quickIcon}>
                    <Text>✈️</Text>
                  </View>
                  <Text style={styles.quickLabel}>Airport</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickItem}>
                  <View style={styles.quickIcon}>
                    <Text>🏪</Text>
                  </View>
                  <Text style={styles.quickLabel}>Market</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : (
          /* Active Ride: Show ride status */
          <View style={styles.activeRideSection}>
            <Text style={styles.rideStatusText}>
              {rideStatus === 'requested' && '🔍 Finding your driver...'}
              {rideStatus === 'accepted' && '🚗 Driver is on the way'}
              {rideStatus === 'arriving' && '📍 Driver arriving at pickup'}
              {rideStatus === 'in_progress' && '🚗 On the way to destination'}
            </Text>
            <TouchableOpacity
              style={styles.viewRideButton}
              onPress={() => navigation.navigate('RideTracking')}
            >
              <Text style={styles.viewRideText}>View Ride Details</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },

  // Top Bar
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.sm,
    zIndex: 100,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },
  menuIcon: {
    fontSize: 20,
    color: colors.text,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.full,
    marginHorizontal: spacing.sm,
    paddingHorizontal: spacing.base,
    height: 44,
    ...shadows.md,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  searchPlaceholder: {
    fontSize: typography.fontSize.base,
    color: colors.textMuted,
    flex: 1,
  },
  sosButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },
  sosIcon: {
    fontSize: 18,
  },

  // My Location Button
  myLocationButton: {
    position: 'absolute',
    right: spacing.base,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },
  myLocationIcon: {
    fontSize: 24,
    color: colors.primary,
  },

  // Bottom Sheet
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    ...shadows.lg,
  },

  // Greeting
  greetingSection: {
    marginBottom: spacing.lg,
  },
  greeting: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
  },
  userName: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },

  // Location Section
  locationSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.lg,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  locationDot: {
    width: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickupDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.white,
  },
  dropoffDot: {
    width: 12,
    height: 12,
    backgroundColor: colors.error,
  },
  locationTextContainer: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  locationLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  locationText: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  locationPlaceholder: {
    color: colors.textMuted,
  },
  editIcon: {
    fontSize: 14,
    marginLeft: spacing.sm,
  },
  arrowIcon: {
    fontSize: 18,
    color: colors.primary,
    marginLeft: spacing.sm,
  },
  connector: {
    marginLeft: 11,
    height: 24,
    justifyContent: 'center',
  },
  connectorDots: {
    justifyContent: 'space-between',
    height: 20,
  },
  dot: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.border,
    marginVertical: 2,
  },

  // Quick Destinations
  quickDestinations: {
    marginBottom: spacing.md,
  },
  quickTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textLight,
    marginBottom: spacing.sm,
  },
  quickList: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickItem: {
    alignItems: 'center',
    width: (width - 64) / 4,
  },
  quickIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  quickLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
  },

  // Active Ride Section
  activeRideSection: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  rideStatusText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.base,
  },
  viewRideButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
  },
  viewRideText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
});

export default HomeScreen;
