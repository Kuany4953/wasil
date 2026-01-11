/**
 * Wasil Rider - Finding Driver Screen
 * Animated searching screen while looking for a driver - Professional Design
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Animated,
  Easing,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import MapView from '../../../../shared/src/components/MapView';
import { colors, spacing, typography, borderRadius, shadows } from '@wasil/shared';
import {
  selectPickup,
  selectDropoff,
  selectCurrentRide,
  selectRideStatus,
  selectIsFindingDriver,
  selectDriver,
  cancelRide,
  resetRide,
} from '../../store/slices/rideSlice';

const FindingDriverScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  
  const pickup = useSelector(selectPickup);
  const dropoff = useSelector(selectDropoff);
  const currentRide = useSelector(selectCurrentRide);
  const rideStatus = useSelector(selectRideStatus);
  const isFindingDriver = useSelector(selectIsFindingDriver);
  const driver = useSelector(selectDriver);
  
  const [searchTime, setSearchTime] = useState(0);
  
  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const wave1 = useRef(new Animated.Value(0)).current;
  const wave2 = useRef(new Animated.Value(0)).current;
  const wave3 = useRef(new Animated.Value(0)).current;
  const dotAnim1 = useRef(new Animated.Value(0)).current;
  const dotAnim2 = useRef(new Animated.Value(0)).current;
  const dotAnim3 = useRef(new Animated.Value(0)).current;
  const bottomSheetAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Bottom sheet entrance
    Animated.spring(bottomSheetAnim, {
      toValue: 1,
      tension: 40,
      friction: 8,
      useNativeDriver: true,
    }).start();

    // Start pulse animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1500,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    // Radar wave animations
    const waveAnimation = (anim, delay) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    waveAnimation(wave1, 0);
    waveAnimation(wave2, 600);
    waveAnimation(wave3, 1200);

    // Start rotation animation for search icon
    const rotateAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    rotateAnimation.start();

    // Start dots animation
    const dotsAnimation = Animated.loop(
      Animated.stagger(200, [
        Animated.sequence([
          Animated.timing(dotAnim1, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dotAnim1, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(dotAnim2, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dotAnim2, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(dotAnim3, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dotAnim3, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ]),
      ])
    );
    dotsAnimation.start();

    // Timer for search time
    const timer = setInterval(() => {
      setSearchTime(prev => prev + 1);
    }, 1000);

    return () => {
      pulseAnimation.stop();
      rotateAnimation.stop();
      clearInterval(timer);
    };
  }, []);

  // Watch for ride status changes
  useEffect(() => {
    if (rideStatus === 'accepted' && driver) {
      // Driver found! Navigate to tracking screen
      navigation.replace('RideTracking');
    }
  }, [rideStatus, driver]);

  const handleCancel = () => {
    Alert.alert(
      t('ride.cancelTitle', { defaultValue: 'Cancel Ride?' }),
      t('ride.cancelMessage', { defaultValue: 'Are you sure you want to cancel this ride request?' }),
      [
        { text: t('common.no', { defaultValue: 'No' }), style: 'cancel' },
        {
          text: t('common.yes', { defaultValue: 'Yes' }),
          style: 'destructive',
          onPress: async () => {
            try {
              if (currentRide?.id) {
                await dispatch(cancelRide({ rideId: currentRide.id, reason: 'Cancelled by rider' })).unwrap();
              }
              dispatch(resetRide());
              navigation.navigate('Home');
            } catch (error) {
              console.error('Cancel error:', error);
            }
          },
        },
      ]
    );
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Map Background */}
      <MapView
        style={styles.map}
        pickupLocation={pickup}
        dropoffLocation={dropoff}
        showsUserLocation
        zoomEnabled={false}
        scrollEnabled={false}
      />

      {/* Overlay */}
      <View style={styles.overlay} />

      {/* Content */}
      <SafeAreaView style={styles.content}>
        {/* Back Button */}
        <TouchableOpacity
          style={[styles.backButton, { marginTop: insets.top }]}
          onPress={handleCancel}
          activeOpacity={0.8}
        >
          <View style={styles.backArrow} />
        </TouchableOpacity>

        {/* Center Animation */}
        <View style={styles.centerSection}>
          {/* Radar waves */}
          <Animated.View
            style={[
              styles.radarWave,
              {
                transform: [{ scale: wave1 }],
                opacity: wave1.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 0],
                }),
              },
            ]}
          />
          <Animated.View
            style={[
              styles.radarWave,
              styles.radarWave2,
              {
                transform: [{ scale: wave2 }],
                opacity: wave2.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.4, 0],
                }),
              },
            ]}
          />
          <Animated.View
            style={[
              styles.radarWave,
              styles.radarWave3,
              {
                transform: [{ scale: wave3 }],
                opacity: wave3.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 0],
                }),
              },
            ]}
          />

          {/* Center car icon */}
          <Animated.View
            style={[
              styles.carContainer,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <View style={styles.carIcon} />
          </Animated.View>

          {/* Rotating search indicators */}
          <Animated.View
            style={[
              styles.searchOrbit,
              { transform: [{ rotate: spin }] },
            ]}
          >
            <View style={styles.searchDot} />
            <View style={[styles.searchDot, styles.searchDot2]} />
            <View style={[styles.searchDot, styles.searchDot3]} />
          </Animated.View>
        </View>

        {/* Bottom Sheet */}
        <Animated.View
          style={[
            styles.bottomSheet,
            { 
              paddingBottom: insets.bottom + spacing.lg,
              transform: [{
                translateY: bottomSheetAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [300, 0],
                }),
              }],
            },
          ]}
        >
          {/* Handle */}
          <View style={styles.sheetHandle} />

          {/* Status */}
          <View style={styles.statusSection}>
            <View style={styles.statusRow}>
              <Text style={styles.statusTitle}>
                {t('ride.findingDriver', { defaultValue: 'Finding your driver' })}
              </Text>
              <View style={styles.dotsContainer}>
                <Animated.View style={[styles.loadingDot, { opacity: dotAnim1 }]} />
                <Animated.View style={[styles.loadingDot, { opacity: dotAnim2 }]} />
                <Animated.View style={[styles.loadingDot, { opacity: dotAnim3 }]} />
              </View>
            </View>
            <Text style={styles.statusSubtitle}>
              {t('ride.searchingNearby', { defaultValue: 'Searching for nearby drivers' })}
            </Text>
            
            {/* Timer Badge */}
            <View style={styles.timerBadge}>
              <View style={styles.timerIcon} />
              <Text style={styles.timerText}>{formatTime(searchTime)}</Text>
            </View>
          </View>

          {/* Trip Info Card */}
          <View style={styles.tripInfoCard}>
            <View style={styles.tripHeader}>
              <View style={styles.routeIconContainer}>
                <View style={styles.routeIcon} />
              </View>
              <Text style={styles.tripHeaderText}>Trip Details</Text>
            </View>

            <View style={styles.tripRow}>
              <View style={styles.locationIndicator}>
                <View style={styles.pickupDot} />
                <View style={styles.pickupRing} />
                <View style={styles.locationLine} />
                <View style={styles.dropoffSquare} />
              </View>
              <View style={styles.locationTexts}>
                <View style={styles.locationItem}>
                  <Text style={styles.locationLabel}>PICKUP</Text>
                  <Text style={styles.locationText} numberOfLines={1}>
                    {pickup?.address || 'Pickup location'}
                  </Text>
                </View>
                <View style={styles.locationItem}>
                  <Text style={styles.locationLabel}>DROPOFF</Text>
                  <Text style={styles.locationText} numberOfLines={1}>
                    {dropoff?.address || 'Dropoff location'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Cancel Button */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            activeOpacity={0.8}
          >
            <View style={styles.cancelIconContainer}>
              <View style={styles.cancelIcon} />
            </View>
            <Text style={styles.cancelButtonText}>
              {t('ride.cancelRequest', { defaultValue: 'Cancel Request' })}
            </Text>
          </TouchableOpacity>

          {/* Info Note */}
          <View style={styles.infoNote}>
            <View style={styles.infoIconContainer}>
              <View style={styles.infoIcon} />
            </View>
            <Text style={styles.infoText}>
              {t('ride.searchTip', { defaultValue: 'This usually takes 1-3 minutes during regular hours' })}
            </Text>
          </View>
        </Animated.View>
      </SafeAreaView>
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  content: {
    flex: 1,
  },

  // Back Button
  backButton: {
    position: 'absolute',
    left: spacing.lg,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    ...shadows.lg,
    elevation: 8,
  },
  backArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderRightWidth: 10,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: '#111827',
    marginRight: 2,
  },

  // Center Animation
  centerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radarWave: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  radarWave2: {
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  radarWave3: {
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  carContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.xl,
    elevation: 12,
    borderWidth: 3,
    borderColor: colors.primary + '20',
  },
  carIcon: {
    width: 40,
    height: 28,
    backgroundColor: colors.primary,
    borderRadius: 6,
  },
  searchOrbit: {
    position: 'absolute',
    width: 160,
    height: 160,
  },
  searchDot: {
    position: 'absolute',
    top: 0,
    left: '50%',
    marginLeft: -6,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    ...shadows.md,
  },
  searchDot2: {
    top: 'auto',
    bottom: 0,
    backgroundColor: '#10B981',
  },
  searchDot3: {
    top: '50%',
    left: 0,
    marginTop: -6,
    marginLeft: 0,
    backgroundColor: '#F59E0B',
  },

  // Bottom Sheet
  bottomSheet: {
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

  // Status
  statusSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statusTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.3,
  },
  dotsContainer: {
    flexDirection: 'row',
    marginLeft: spacing.sm,
  },
  loadingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginHorizontal: 2,
  },
  statusSubtitle: {
    fontSize: typography.fontSize.base,
    color: '#6B7280',
    marginBottom: spacing.base,
    fontWeight: '500',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  timerIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.primary,
    marginRight: spacing.xs,
  },
  timerText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: '700',
  },

  // Trip Info Card
  tripInfoCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: borderRadius['2xl'],
    padding: spacing.lg,
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  tripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  routeIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  routeIcon: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.primary,
  },
  tripHeaderText: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: '#111827',
  },
  tripRow: {
    flexDirection: 'row',
  },
  locationIndicator: {
    alignItems: 'center',
    marginRight: spacing.base,
    paddingVertical: spacing.xs,
  },
  pickupDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  pickupRing: {
    position: 'absolute',
    top: spacing.xs,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.primary + '40',
  },
  locationLine: {
    width: 2,
    height: 36,
    backgroundColor: '#E5E7EB',
    marginVertical: spacing.xs,
  },
  dropoffSquare: {
    width: 10,
    height: 10,
    backgroundColor: '#EF4444',
    borderRadius: 2,
  },
  locationTexts: {
    flex: 1,
    justifyContent: 'space-between',
  },
  locationItem: {
    marginBottom: spacing.base,
  },
  locationLabel: {
    fontSize: typography.fontSize.xs,
    color: '#9CA3AF',
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  locationText: {
    fontSize: typography.fontSize.md,
    color: '#111827',
    fontWeight: '600',
  },

  // Cancel Button
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: borderRadius['2xl'],
    paddingVertical: spacing.lg,
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  cancelIconContainer: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  cancelIcon: {
    width: 14,
    height: 14,
    transform: [{ rotate: '45deg' }],
  },
  cancelButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: '#DC2626',
  },

  // Info Note
  infoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: spacing.base,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  infoIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  infoIcon: {
    width: 3,
    height: 12,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: '#6B7280',
    fontWeight: '500',
    lineHeight: 20,
  },
});

export default FindingDriverScreen;

