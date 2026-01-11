/**
 * Wasil Rider - Home Screen
 * Main screen with map and ride request interface - Professional Design
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
  const searchBarAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Check for active ride on mount
    dispatch(getActiveRide());
    
    // Get user's current location
    getCurrentLocation();
    
    // Animate bottom sheet in
    Animated.spring(bottomSheetAnim, {
      toValue: 1,
      tension: 40,
      friction: 8,
      useNativeDriver: true,
    }).start();

    // Animate search bar
    setTimeout(() => {
      Animated.spring(searchBarAnim, {
        toValue: 1,
        tension: 40,
        friction: 7,
        useNativeDriver: true,
      }).start();
    }, 200);
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

  const getRideStatusInfo = () => {
    switch (rideStatus) {
      case 'requested':
        return { text: 'Finding your driver...', icon: 'search' };
      case 'accepted':
        return { text: 'Driver is on the way', icon: 'car' };
      case 'arriving':
        return { text: 'Driver arriving at pickup', icon: 'location' };
      case 'in_progress':
        return { text: 'On the way to destination', icon: 'route' };
      default:
        return { text: '', icon: null };
    }
  };

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
      <Animated.View 
        style={[
          styles.topBar, 
          { 
            paddingTop: insets.top + spacing.sm,
            opacity: searchBarAnim,
            transform: [{
              translateY: searchBarAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-20, 0],
              }),
            }],
          }
        ]}
      >
        {/* Menu Button */}
        <TouchableOpacity
          style={styles.menuButton}
          onPress={handleOpenDrawer}
          activeOpacity={0.8}
        >
          <View style={styles.menuIconContainer}>
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
          </View>
        </TouchableOpacity>

        {/* Search Bar (for dropoff) */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => handleSearchPress('dropoff')}
          activeOpacity={0.9}
        >
          <View style={styles.searchIconContainer}>
            <View style={styles.searchIcon} />
          </View>
          <Text style={styles.searchPlaceholder}>
            {t('home.whereToGo', { defaultValue: 'Where to?' })}
          </Text>
        </TouchableOpacity>

        {/* Profile/Notification Button */}
        <TouchableOpacity
          style={styles.profileButton}
          onPress={handleOpenDrawer}
          activeOpacity={0.8}
        >
          <View style={styles.profileIcon}>
            <Text style={styles.profileInitial}>
              {user?.first_name?.[0]?.toUpperCase() || 'U'}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* My Location Button */}
      <TouchableOpacity
        style={[styles.myLocationButton, { bottom: 300 + insets.bottom }]}
        onPress={handleMyLocation}
        activeOpacity={0.8}
      >
        <View style={styles.targetIcon} />
      </TouchableOpacity>

      {/* SOS Button */}
      <TouchableOpacity
        style={[styles.sosButton, { bottom: 360 + insets.bottom }]}
        onPress={handleSOSPress}
        activeOpacity={0.8}
      >
        <View style={styles.sosIconContainer}>
          <View style={styles.sosExclamation} />
        </View>
      </TouchableOpacity>

      {/* Bottom Sheet */}
      <Animated.View
        style={[
          styles.bottomSheet,
          { paddingBottom: insets.bottom + spacing.lg },
          {
            transform: [{
              translateY: bottomSheetAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [400, 0],
              }),
            }],
          },
        ]}
      >
        {/* Handle */}
        <View style={styles.sheetHandle} />

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
                activeOpacity={0.7}
              >
                <View style={styles.locationIconContainer}>
                  <View style={styles.pickupDot} />
                  <View style={styles.pickupRing} />
                </View>
                <View style={styles.locationTextContainer}>
                  <Text style={styles.locationLabel}>
                    {t('ride.pickup', { defaultValue: 'Pickup' })}
                  </Text>
                  <Text style={styles.locationText} numberOfLines={1}>
                    {pickup?.address || t('ride.currentLocation', { defaultValue: 'Current location' })}
                  </Text>
                </View>
                <View style={styles.editIconContainer}>
                  <View style={styles.editIcon} />
                </View>
              </TouchableOpacity>

              {/* Connector */}
              <View style={styles.connector}>
                <View style={styles.connectorLine} />
              </View>

              {/* Dropoff */}
              <TouchableOpacity
                style={styles.locationRow}
                onPress={() => handleSearchPress('dropoff')}
                activeOpacity={0.7}
              >
                <View style={styles.locationIconContainer}>
                  <View style={styles.dropoffSquare} />
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
                <View style={styles.arrowIconContainer}>
                  <View style={styles.arrowIcon} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <TouchableOpacity 
                style={styles.quickActionButton}
                activeOpacity={0.8}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: colors.primary + '15' }]}>
                  <View style={styles.clockIcon} />
                </View>
                <Text style={styles.quickActionLabel}>Schedule</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.quickActionButton}
                activeOpacity={0.8}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: '#FEF3C7' }]}>
                  <View style={styles.packageIcon} />
                </View>
                <Text style={styles.quickActionLabel}>Package</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.quickActionButton}
                activeOpacity={0.8}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: '#DBEAFE' }]}>
                  <View style={styles.rentIcon} />
                </View>
                <Text style={styles.quickActionLabel}>Rent</Text>
              </TouchableOpacity>
            </View>

            {/* Saved Places */}
            <View style={styles.savedPlaces}>
              <View style={styles.savedPlacesHeader}>
                <Text style={styles.savedPlacesTitle}>
                  {t('home.savedPlaces', { defaultValue: 'Saved places' })}
                </Text>
                <TouchableOpacity activeOpacity={0.7}>
                  <Text style={styles.seeAllText}>See all</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.savedPlacesList}>
                <TouchableOpacity 
                  style={styles.savedPlaceItem}
                  activeOpacity={0.7}
                >
                  <View style={[styles.savedPlaceIcon, { backgroundColor: colors.primary + '15' }]}>
                    <View style={styles.homeIcon} />
                  </View>
                  <View style={styles.savedPlaceInfo}>
                    <Text style={styles.savedPlaceLabel}>Home</Text>
                    <Text style={styles.savedPlaceAddress} numberOfLines={1}>
                      Add your home address
                    </Text>
                  </View>
                  <View style={styles.chevronRight} />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.savedPlaceItem}
                  activeOpacity={0.7}
                >
                  <View style={[styles.savedPlaceIcon, { backgroundColor: '#FEF3C7' }]}>
                    <View style={styles.workIcon} />
                  </View>
                  <View style={styles.savedPlaceInfo}>
                    <Text style={styles.savedPlaceLabel}>Work</Text>
                    <Text style={styles.savedPlaceAddress} numberOfLines={1}>
                      Add your work address
                    </Text>
                  </View>
                  <View style={styles.chevronRight} />
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : (
          /* Active Ride: Show ride status */
          <View style={styles.activeRideSection}>
            <View style={styles.rideStatusContainer}>
              <View style={styles.statusIndicator}>
                <View style={styles.statusPulse} />
                <View style={styles.statusDot} />
              </View>
              <Text style={styles.rideStatusText}>
                {getRideStatusInfo().text}
              </Text>
            </View>
            
            <TouchableOpacity
              style={styles.viewRideButton}
              onPress={() => navigation.navigate('RideTracking')}
              activeOpacity={0.8}
            >
              <Text style={styles.viewRideText}>View Ride Details</Text>
              <View style={styles.buttonArrow} />
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
    backgroundColor: '#F8F9FA',
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
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    zIndex: 100,
  },
  menuButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
    elevation: 8,
  },
  menuIconContainer: {
    width: 20,
    height: 14,
    justifyContent: 'space-between',
  },
  menuLine: {
    width: '100%',
    height: 2,
    backgroundColor: '#111827',
    borderRadius: 1,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius['2xl'],
    marginHorizontal: spacing.md,
    paddingHorizontal: spacing.lg,
    height: 48,
    ...shadows.lg,
    elevation: 8,
  },
  searchIconContainer: {
    width: 20,
    height: 20,
    marginRight: spacing.md,
  },
  searchIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#6B7280',
  },
  searchPlaceholder: {
    fontSize: typography.fontSize.base,
    color: '#9CA3AF',
    flex: 1,
    fontWeight: '600',
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
    elevation: 8,
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // My Location Button
  myLocationButton: {
    position: 'absolute',
    right: spacing.lg,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
    elevation: 8,
  },
  targetIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
  },

  // SOS Button
  sosButton: {
    position: 'absolute',
    right: spacing.lg,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
    elevation: 8,
  },
  sosIconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosExclamation: {
    width: 3,
    height: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },

  // Bottom Sheet
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: borderRadius['3xl'],
    borderTopRightRadius: borderRadius['3xl'],
    paddingTop: spacing.md,
    paddingHorizontal: spacing.xl,
    ...shadows.xl,
    elevation: 20,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },

  // Greeting
  greetingSection: {
    marginBottom: spacing.lg,
  },
  greeting: {
    fontSize: typography.fontSize.sm,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 2,
  },
  userName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },

  // Location Section
  locationSection: {
    backgroundColor: '#F9FAFB',
    borderRadius: borderRadius['2xl'],
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIconContainer: {
    width: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickupDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  pickupRing: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.primary + '40',
  },
  dropoffSquare: {
    width: 10,
    height: 10,
    backgroundColor: '#EF4444',
    borderRadius: 2,
  },
  locationTextContainer: {
    flex: 1,
    marginLeft: spacing.md,
  },
  locationLabel: {
    fontSize: typography.fontSize.xs,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
    fontWeight: '700',
  },
  locationText: {
    fontSize: typography.fontSize.base,
    color: '#111827',
    fontWeight: '600',
  },
  locationPlaceholder: {
    color: '#9CA3AF',
    fontWeight: '500',
  },
  editIconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIcon: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    borderColor: '#9CA3AF',
    borderRadius: 2,
  },
  arrowIconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowIcon: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderTopWidth: 5,
    borderBottomWidth: 5,
    borderLeftWidth: 8,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: colors.primary,
  },
  connector: {
    marginLeft: 15,
    height: 24,
    justifyContent: 'center',
    marginVertical: spacing.xs,
  },
  connectorLine: {
    width: 2,
    height: 20,
    backgroundColor: '#E5E7EB',
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  clockIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  packageIcon: {
    width: 20,
    height: 20,
    backgroundColor: '#F59E0B',
    borderRadius: 4,
  },
  rentIcon: {
    width: 22,
    height: 18,
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  quickActionLabel: {
    fontSize: typography.fontSize.xs,
    color: '#6B7280',
    fontWeight: '600',
  },

  // Saved Places
  savedPlaces: {
    marginBottom: spacing.md,
  },
  savedPlacesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  savedPlacesTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: '#111827',
  },
  seeAllText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: '600',
  },
  savedPlacesList: {
    gap: spacing.sm,
  },
  savedPlaceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: spacing.base,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  savedPlaceIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  homeIcon: {
    width: 18,
    height: 16,
    backgroundColor: colors.primary,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  workIcon: {
    width: 16,
    height: 18,
    backgroundColor: '#F59E0B',
    borderRadius: 2,
  },
  savedPlaceInfo: {
    flex: 1,
  },
  savedPlaceLabel: {
    fontSize: typography.fontSize.md,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  savedPlaceAddress: {
    fontSize: typography.fontSize.sm,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  chevronRight: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderTopWidth: 5,
    borderBottomWidth: 5,
    borderLeftWidth: 7,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#D1D5DB',
  },

  // Active Ride Section
  activeRideSection: {
    paddingVertical: spacing.xl,
  },
  rideStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  statusIndicator: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  statusPulse: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '20',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  rideStatusText: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: '#111827',
  },
  viewRideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius['2xl'],
    ...shadows.lg,
  },
  viewRideText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    marginRight: spacing.sm,
  },
  buttonArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderTopWidth: 5,
    borderBottomWidth: 5,
    borderLeftWidth: 8,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#FFFFFF',
  },
});

export default HomeScreen;

