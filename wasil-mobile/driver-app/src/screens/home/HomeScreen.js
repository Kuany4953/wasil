/**
 * Wasil Driver - Home Screen
 * Main dashboard with online/offline toggle - Professional Design
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
  const slideAnim = useRef(new Animated.Value(300)).current;

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
            toValue: 1.3,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isOnline]);

  useEffect(() => {
    // Request modal slide in animation
    if (incomingRequest) {
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 10,
        useNativeDriver: true,
      }).start();
    } else {
      slideAnim.setValue(300);
    }
  }, [incomingRequest]);

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
          <View style={styles.menuIconContainer}>
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statusContainer}
          onPress={handleToggleOnline}
          activeOpacity={0.8}
        >
          <View style={styles.statusIndicator}>
            <Animated.View
              style={[
                styles.statusDot,
                { backgroundColor: isOnline ? '#10B981' : '#6B7280' },
                isOnline && { transform: [{ scale: pulseAnim }] },
              ]}
            />
            <View style={[styles.statusRing, { borderColor: isOnline ? '#10B981' : '#6B7280' }]} />
          </View>
          <Text style={[styles.statusText, { color: isOnline ? '#10B981' : '#6B7280' }]}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.earningsButton}
          onPress={() => navigation.navigate('Earnings')}
        >
          <View style={styles.walletIcon} />
          <Text style={styles.earningsAmount}>{(todayEarnings / 1000).toFixed(0)}k</Text>
        </TouchableOpacity>
      </SafeAreaView>

      {/* Quick Actions - Top Right */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickActionButton}>
          <View style={styles.targetIcon} />
        </TouchableOpacity>
      </View>

      {/* Bottom Panel */}
      <View style={styles.bottomPanel}>
        {/* Main Toggle Switch */}
        <View style={styles.mainToggleContainer}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>
              {isOnline ? 'You're Online' : 'You're Offline'}
            </Text>
            <Text style={styles.toggleSubtitle}>
              {isOnline 
                ? 'Ready to accept trips' 
                : 'Tap to start accepting trips'}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.mainToggleSwitch,
              { backgroundColor: isOnline ? '#10B981' : '#E5E7EB' },
            ]}
            onPress={handleToggleOnline}
            activeOpacity={0.8}
          >
            <Animated.View
              style={[
                styles.toggleThumb,
                {
                  transform: [{
                    translateX: isOnline ? 28 : 2,
                  }],
                },
              ]}
            />
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <View style={styles.statIconContainer}>
              <View style={styles.currencyIcon} />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statValue}>{formatCurrency(todayEarnings)}</Text>
              <Text style={styles.statLabel}>Today's Earnings</Text>
            </View>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statBox}>
            <View style={styles.statIconContainer}>
              <View style={styles.tripIcon} />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statValue}>{todayRides}</Text>
              <Text style={styles.statLabel}>Trips</Text>
            </View>
          </View>
        </View>

        {/* Status Message */}
        {!isOnline && (
          <View style={styles.statusMessage}>
            <View style={styles.messageIconContainer}>
              <View style={styles.infoIcon} />
            </View>
            <Text style={styles.statusMessageText}>
              Go online to start receiving trip requests
            </Text>
          </View>
        )}

        {isOnline && !incomingRequest && !currentRide && (
          <View style={[styles.statusMessage, styles.activeMessage]}>
            <View style={styles.searchingAnimation}>
              <View style={styles.radarCircle} />
              <View style={[styles.radarCircle, styles.radarCircle2]} />
              <View style={[styles.radarCircle, styles.radarCircle3]} />
            </View>
            <Text style={styles.activeMessageText}>
              Searching for trips nearby...
            </Text>
          </View>
        )}
      </View>

      {/* Incoming Ride Request Modal */}
      {incomingRequest && (
        <View style={styles.requestOverlay}>
          <TouchableOpacity 
            style={styles.overlayBackground}
            activeOpacity={1}
            onPress={handleDeclineRide}
          />
          
          <Animated.View 
            style={[
              styles.requestCard,
              { transform: [{ translateY: slideAnim }] }
            ]}
          >
            {/* Timer Circle */}
            <View style={styles.timerSection}>
              <View style={styles.timerCircle}>
                <Text style={styles.timerNumber}>{requestTimer}</Text>
                <Text style={styles.timerLabel}>sec</Text>
              </View>
              <Text style={styles.requestTitle}>New Trip Request</Text>
            </View>

            {/* Rider Info */}
            <View style={styles.riderSection}>
              <View style={styles.riderAvatar}>
                <Text style={styles.riderInitial}>
                  {incomingRequest.rider?.firstName?.[0]?.toUpperCase() || 'R'}
                </Text>
              </View>
              <View style={styles.riderDetails}>
                <Text style={styles.riderName}>
                  {incomingRequest.rider?.firstName || 'Rider'}
                </Text>
                <View style={styles.ratingContainer}>
                  <View style={styles.starIconSmall} />
                  <Text style={styles.ratingText}>
                    {incomingRequest.rider?.rating?.toFixed(1) || '4.5'}
                  </Text>
                </View>
              </View>
              <View style={styles.fareBox}>
                <Text style={styles.fareLabel}>Est. Earnings</Text>
                <Text style={styles.fareAmount}>
                  {formatCurrency(incomingRequest.estimatedFare || 0)}
                </Text>
              </View>
            </View>

            {/* Trip Route */}
            <View style={styles.routeContainer}>
              <View style={styles.routeLine}>
                <View style={styles.routeDots}>
                  <View style={styles.pickupDot} />
                  <View style={styles.routePath} />
                  <View style={styles.dropoffDot} />
                </View>
                <View style={styles.routeAddresses}>
                  <View style={styles.addressRow}>
                    <Text style={styles.addressLabel}>Pickup</Text>
                    <Text style={styles.addressText} numberOfLines={1}>
                      {incomingRequest.pickup?.address || 'Pickup location'}
                    </Text>
                    <View style={styles.distanceBadge}>
                      <View style={styles.carIconSmall} />
                      <Text style={styles.distanceText}>
                        {incomingRequest.distanceToPickup?.toFixed(1) || '1.2'} km
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.addressRow, styles.dropoffRow]}>
                    <Text style={styles.addressLabel}>Dropoff</Text>
                    <Text style={styles.addressText} numberOfLines={1}>
                      {incomingRequest.dropoff?.address || 'Dropoff location'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={styles.declineButton}
                onPress={handleDeclineRide}
                activeOpacity={0.8}
              >
                <View style={styles.closeIcon} />
                <Text style={styles.declineButtonText}>Decline</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.acceptButton}
                onPress={handleAcceptRide}
                activeOpacity={0.8}
              >
                <View style={styles.checkIcon} />
                <Text style={styles.acceptButtonText}>Accept Trip</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
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
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + spacing.md : spacing.md,
    zIndex: 10,
  },
  menuButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
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
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    ...shadows.lg,
    elevation: 8,
  },
  statusIndicator: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    position: 'absolute',
  },
  statusRing: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    opacity: 0.3,
  },
  statusText: {
    fontSize: typography.fontSize.md,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  earningsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    ...shadows.lg,
    elevation: 8,
  },
  walletIcon: {
    width: 18,
    height: 14,
    backgroundColor: colors.primary,
    borderRadius: 3,
    marginRight: spacing.xs,
  },
  earningsAmount: {
    fontSize: typography.fontSize.md,
    fontWeight: '700',
    color: '#111827',
  },

  // Quick Actions
  quickActions: {
    position: 'absolute',
    right: spacing.base,
    top: Platform.OS === 'android' 
      ? StatusBar.currentHeight + spacing.md + 60 
      : spacing.md + 60,
    zIndex: 10,
  },
  quickActionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
    elevation: 8,
  },
  targetIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.primary,
    position: 'relative',
  },

  // Bottom Panel
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? spacing['2xl'] : spacing.xl,
    ...shadows.xl,
    elevation: 20,
  },

  // Main Toggle
  mainToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  toggleInfo: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: '#111827',
    marginBottom: spacing.xs,
    letterSpacing: -0.3,
  },
  toggleSubtitle: {
    fontSize: typography.fontSize.sm,
    color: '#6B7280',
    fontWeight: '500',
  },
  mainToggleSwitch: {
    width: 58,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    padding: 2,
  },
  toggleThumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.white,
    ...shadows.md,
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    marginBottom: spacing.base,
  },
  statBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  currencyIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  tripIcon: {
    width: 18,
    height: 12,
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: '#6B7280',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: spacing.base,
  },

  // Status Messages
  statusMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: spacing.base,
    borderRadius: borderRadius.lg,
  },
  messageIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  infoIcon: {
    width: 3,
    height: 12,
    backgroundColor: '#6B7280',
    borderRadius: 2,
  },
  statusMessageText: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeMessage: {
    backgroundColor: '#ECFDF5',
  },
  searchingAnimation: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  radarCircle: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
  },
  radarCircle2: {
    width: 20,
    height: 20,
    borderRadius: 10,
    opacity: 0.4,
  },
  radarCircle3: {
    width: 28,
    height: 28,
    borderRadius: 14,
    opacity: 0.2,
  },
  activeMessageText: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: '#10B981',
    fontWeight: '600',
  },

  // Request Overlay
  requestOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  overlayBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  requestCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    paddingHorizontal: spacing.xl,
    paddingTop: spacing['2xl'],
    paddingBottom: Platform.OS === 'ios' ? spacing['3xl'] : spacing.xl,
    ...shadows.xl,
  },

  // Timer Section
  timerSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  timerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF3C7',
    borderWidth: 3,
    borderColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  timerNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: '#F59E0B',
    letterSpacing: -1,
  },
  timerLabel: {
    fontSize: typography.fontSize.xs,
    color: '#D97706',
    fontWeight: '600',
  },
  requestTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.3,
  },

  // Rider Section
  riderSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: spacing.base,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.lg,
  },
  riderAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  riderInitial: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
  },
  riderDetails: {
    flex: 1,
  },
  riderName: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: '#111827',
    marginBottom: spacing.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIconSmall: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FCD34D',
    transform: [{ rotate: '35deg' }],
    marginRight: spacing.xs,
  },
  ratingText: {
    fontSize: typography.fontSize.md,
    fontWeight: '700',
    color: '#111827',
  },
  fareBox: {
    alignItems: 'flex-end',
  },
  fareLabel: {
    fontSize: typography.fontSize.xs,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 2,
  },
  fareAmount: {
    fontSize: typography.fontSize.xl,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.5,
  },

  // Route Container
  routeContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  routeLine: {
    flexDirection: 'row',
  },
  routeDots: {
    width: 24,
    alignItems: 'center',
    marginRight: spacing.md,
    paddingTop: 2,
  },
  pickupDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.white,
  },
  routePath: {
    width: 2,
    flex: 1,
    backgroundColor: '#D1D5DB',
    marginVertical: spacing.xs,
  },
  dropoffDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: colors.white,
  },
  routeAddresses: {
    flex: 1,
  },
  addressRow: {
    marginBottom: spacing.lg,
  },
  dropoffRow: {
    marginBottom: 0,
  },
  addressLabel: {
    fontSize: typography.fontSize.xs,
    color: '#9CA3AF',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  addressText: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: '#111827',
    marginBottom: spacing.sm,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  carIconSmall: {
    width: 12,
    height: 8,
    backgroundColor: colors.primary,
    borderRadius: 2,
    marginRight: spacing.xs,
  },
  distanceText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: colors.primary,
  },

  // Action Buttons
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  declineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  closeIcon: {
    width: 14,
    height: 14,
    position: 'relative',
    marginRight: spacing.sm,
  },
  declineButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: '#374151',
  },
  acceptButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
    ...shadows.lg,
  },
  checkIcon: {
    width: 16,
    height: 12,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: colors.white,
    transform: [{ rotate: '45deg' }],
    marginRight: spacing.sm,
    marginBottom: 4,
  },
  acceptButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.3,
  },
});

export default HomeScreen;

