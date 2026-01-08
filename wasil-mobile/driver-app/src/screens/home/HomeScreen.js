/**
 * Wasil Driver - Home Screen
 * Main dashboard with online/offline toggle
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  Platform,
  Switch,
  Animated,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
  JUBA_CENTER,
  LocationService,
  SocketService,
  CURRENCY,
} from '@wasil/shared';
import Button from '../../../../shared/src/components/Button';
import {
  goOnline,
  goOffline,
  selectIsOnline,
  selectTodayEarnings,
  selectTodayRides,
  selectIncomingRequest,
  selectCurrentRide,
  getEarnings,
  acceptRide,
  declineRide,
  selectRequestTimer,
  updateRequestTimer,
} from '../../store/slices/driverSlice';

const { width, height } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const mapRef = useRef(null);

  const isOnline = useSelector(selectIsOnline);
  const todayEarnings = useSelector(selectTodayEarnings);
  const todayRides = useSelector(selectTodayRides);
  const incomingRequest = useSelector(selectIncomingRequest);
  const currentRide = useSelector(selectCurrentRide);
  const requestTimer = useSelector(selectRequestTimer);

  const [currentLocation, setCurrentLocation] = useState(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    initializeLocation();
    dispatch(getEarnings());
  }, []);

  useEffect(() => {
    // Pulse animation for online status
    if (isOnline) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isOnline]);

  useEffect(() => {
    // Request timer countdown
    let interval;
    if (incomingRequest && requestTimer > 0) {
      interval = setInterval(() => {
        dispatch(updateRequestTimer());
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [incomingRequest, requestTimer]);

  const initializeLocation = async () => {
    try {
      const location = await LocationService.getCurrentLocation();
      setCurrentLocation(location);
    } catch (error) {
      console.log('Location error:', error);
      setCurrentLocation({
        latitude: JUBA_CENTER.latitude,
        longitude: JUBA_CENTER.longitude,
      });
    }
  };

  const handleToggleOnline = () => {
    if (isOnline) {
      dispatch(goOffline());
    } else {
      dispatch(goOnline());
    }
  };

  const handleAcceptRide = () => {
    if (incomingRequest) {
      dispatch(acceptRide(incomingRequest.id));
    }
  };

  const handleDeclineRide = () => {
    if (incomingRequest) {
      dispatch(declineRide({ rideId: incomingRequest.id, reason: 'not_available' }));
    }
  };

  const formatCurrency = (amount) => {
    return `${amount.toLocaleString()} ${CURRENCY.code}`;
  };

  const renderMarkerLocation = currentLocation || {
    latitude: JUBA_CENTER.latitude,
    longitude: JUBA_CENTER.longitude,
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          ...renderMarkerLocation,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        showsUserLocation
        showsMyLocationButton={false}
      />

      {/* Header */}
      <SafeAreaView style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.openDrawer()}
        >
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>

        <View style={styles.statusContainer}>
          <Animated.View
            style={[
              styles.statusDot,
              { backgroundColor: isOnline ? colors.success : colors.error },
              isOnline && { transform: [{ scale: pulseAnim }] },
            ]}
          />
          <Text style={styles.statusText}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.earningsButton}
          onPress={() => navigation.navigate('Earnings')}
        >
          <Text style={styles.earningsIcon}>💰</Text>
        </TouchableOpacity>
      </SafeAreaView>

      {/* Bottom Panel */}
      <View style={styles.bottomPanel}>
        {/* Online/Offline Toggle */}
        <View style={styles.toggleContainer}>
          <Text style={styles.toggleLabel}>
            {isOnline ? 'You are Online' : 'You are Offline'}
          </Text>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              { backgroundColor: isOnline ? colors.success : colors.textMuted },
            ]}
            onPress={handleToggleOnline}
          >
            <Text style={styles.toggleButtonText}>
              {isOnline ? 'Go Offline' : 'Go Online'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Today's Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatCurrency(todayEarnings)}</Text>
            <Text style={styles.statLabel}>Today's Earnings</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{todayRides}</Text>
            <Text style={styles.statLabel}>Rides</Text>
          </View>
        </View>

        {/* Offline Message */}
        {!isOnline && (
          <View style={styles.offlineMessage}>
            <Text style={styles.offlineIcon}>🚗</Text>
            <Text style={styles.offlineText}>
              Go online to start receiving ride requests
            </Text>
          </View>
        )}

        {/* Online Message */}
        {isOnline && !incomingRequest && !currentRide && (
          <View style={styles.onlineMessage}>
            <Text style={styles.onlineIcon}>📡</Text>
            <Text style={styles.onlineText}>
              Waiting for ride requests...
            </Text>
          </View>
        )}
      </View>

      {/* Incoming Ride Request Modal */}
      {incomingRequest && (
        <View style={styles.requestOverlay}>
          <View style={styles.requestCard}>
            {/* Timer */}
            <View style={styles.timerContainer}>
              <Text style={styles.timerText}>{requestTimer}</Text>
              <Text style={styles.timerLabel}>seconds</Text>
            </View>

            {/* Rider Info */}
            <View style={styles.riderInfo}>
              <View style={styles.riderAvatar}>
                <Text style={styles.riderAvatarText}>
                  {incomingRequest.rider?.firstName?.[0] || '👤'}
                </Text>
              </View>
              <View style={styles.riderDetails}>
                <Text style={styles.riderName}>
                  {incomingRequest.rider?.firstName || 'Rider'}
                </Text>
                <Text style={styles.riderRating}>
                  ⭐ {incomingRequest.rider?.rating?.toFixed(1) || '4.5'}
                </Text>
              </View>
              <View style={styles.fareContainer}>
                <Text style={styles.fareAmount}>
                  {formatCurrency(incomingRequest.estimatedFare || 0)}
                </Text>
                <Text style={styles.fareLabel}>Est. Fare</Text>
              </View>
            </View>

            {/* Trip Details */}
            <View style={styles.tripDetails}>
              <View style={styles.tripLocation}>
                <View style={[styles.locationDot, { backgroundColor: colors.primary }]} />
                <View style={styles.locationInfo}>
                  <Text style={styles.locationLabel}>Pickup</Text>
                  <Text style={styles.locationAddress} numberOfLines={1}>
                    {incomingRequest.pickup?.address || 'Pickup location'}
                  </Text>
                </View>
                <Text style={styles.distanceText}>
                  {incomingRequest.distanceToPickup?.toFixed(1) || '1.2'} km
                </Text>
              </View>

              <View style={styles.tripDivider} />

              <View style={styles.tripLocation}>
                <View style={[styles.locationDot, { backgroundColor: colors.error }]} />
                <View style={styles.locationInfo}>
                  <Text style={styles.locationLabel}>Dropoff</Text>
                  <Text style={styles.locationAddress} numberOfLines={1}>
                    {incomingRequest.dropoff?.address || 'Dropoff location'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.declineButton]}
                onPress={handleDeclineRide}
              >
                <Text style={styles.declineText}>✕ Decline</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.acceptButton]}
                onPress={handleAcceptRide}
              >
                <Text style={styles.acceptText}>✓ Accept</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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

  // Header
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + spacing.sm : spacing.sm,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },
  menuIcon: {
    fontSize: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    ...shadows.md,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  statusText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
  },
  earningsButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },
  earningsIcon: {
    fontSize: 20,
  },

  // Bottom Panel
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xl,
    paddingBottom: spacing['2xl'],
    ...shadows.lg,
  },

  // Toggle
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  toggleLabel: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  toggleButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
  },
  toggleButtonText: {
    color: colors.white,
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.md,
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  statValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    marginTop: spacing.xs,
  },

  // Offline Message
  offlineMessage: {
    alignItems: 'center',
    marginTop: spacing.lg,
    padding: spacing.base,
  },
  offlineIcon: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  offlineText: {
    fontSize: typography.fontSize.base,
    color: colors.textLight,
    textAlign: 'center',
  },

  // Online Message
  onlineMessage: {
    alignItems: 'center',
    marginTop: spacing.lg,
    padding: spacing.base,
  },
  onlineIcon: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  onlineText: {
    fontSize: typography.fontSize.base,
    color: colors.textLight,
    textAlign: 'center',
  },

  // Request Overlay
  requestOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  requestCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xl,
  },

  // Timer
  timerContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  timerText: {
    fontSize: 48,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  timerLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
  },

  // Rider Info
  riderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  riderAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  riderAvatarText: {
    fontSize: 24,
  },
  riderDetails: {
    flex: 1,
    marginLeft: spacing.md,
  },
  riderName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  riderRating: {
    fontSize: typography.fontSize.md,
    color: colors.secondary,
  },
  fareContainer: {
    alignItems: 'flex-end',
  },
  fareAmount: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  fareLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
  },

  // Trip Details
  tripDetails: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.lg,
  },
  tripLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.md,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
  },
  locationAddress: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  distanceText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  tripDivider: {
    height: 20,
    width: 2,
    backgroundColor: colors.border,
    marginLeft: 5,
    marginVertical: spacing.xs,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing.base,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
  },
  declineButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  acceptButton: {
    backgroundColor: colors.primary,
  },
  declineText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  acceptText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});

export default HomeScreen;
