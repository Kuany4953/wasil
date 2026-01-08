/**
 * Wasil Rider - Finding Driver Screen
 * Animated searching screen while looking for a driver
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
  const dotAnim1 = useRef(new Animated.Value(0)).current;
  const dotAnim2 = useRef(new Animated.Value(0)).current;
  const dotAnim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start pulse animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    // Start rotation animation
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
    const dotsAnimation = () => {
      Animated.loop(
        Animated.stagger(200, [
          Animated.sequence([
            Animated.timing(dotAnim1, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.timing(dotAnim1, { toValue: 0.3, duration: 300, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(dotAnim2, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.timing(dotAnim2, { toValue: 0.3, duration: 300, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(dotAnim3, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.timing(dotAnim3, { toValue: 0.3, duration: 300, useNativeDriver: true }),
          ]),
        ])
      ).start();
    };
    dotsAnimation();

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
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        {/* Center Animation */}
        <View style={styles.centerSection}>
          {/* Pulse rings */}
          <Animated.View
            style={[
              styles.pulseRing,
              {
                transform: [{ scale: pulseAnim }],
                opacity: pulseAnim.interpolate({
                  inputRange: [1, 1.3],
                  outputRange: [0.5, 0],
                }),
              },
            ]}
          />
          <Animated.View
            style={[
              styles.pulseRingInner,
              {
                transform: [{ scale: pulseAnim.interpolate({
                  inputRange: [1, 1.3],
                  outputRange: [0.8, 1.1],
                }) }],
                opacity: pulseAnim.interpolate({
                  inputRange: [1, 1.3],
                  outputRange: [0.3, 0],
                }),
              },
            ]}
          />

          {/* Rotating search icon */}
          <Animated.View
            style={[
              styles.searchIconContainer,
              { transform: [{ rotate: spin }] },
            ]}
          >
            <View style={styles.searchIcon}>
              <Text style={styles.searchEmoji}>🔍</Text>
            </View>
          </Animated.View>

          {/* Car icon */}
          <View style={styles.carContainer}>
            <Text style={styles.carIcon}>🚗</Text>
          </View>
        </View>

        {/* Bottom Sheet */}
        <View style={[styles.bottomSheet, { paddingBottom: insets.bottom + spacing.md }]}>
          {/* Status */}
          <View style={styles.statusSection}>
            <View style={styles.statusRow}>
              <Text style={styles.statusTitle}>
                {t('ride.findingDriver', { defaultValue: 'Finding your driver' })}
              </Text>
              <View style={styles.dotsContainer}>
                <Animated.View style={[styles.dot, { opacity: dotAnim1 }]} />
                <Animated.View style={[styles.dot, { opacity: dotAnim2 }]} />
                <Animated.View style={[styles.dot, { opacity: dotAnim3 }]} />
              </View>
            </View>
            <Text style={styles.statusSubtitle}>
              {t('ride.searchingNearby', { defaultValue: 'Searching for nearby drivers' })}
            </Text>
            <Text style={styles.searchTimer}>{formatTime(searchTime)}</Text>
          </View>

          {/* Trip Info */}
          <View style={styles.tripInfo}>
            <View style={styles.tripRow}>
              <View style={styles.locationIndicator}>
                <View style={styles.pickupDot} />
                <View style={styles.locationLine} />
                <View style={styles.dropoffDot} />
              </View>
              <View style={styles.locationTexts}>
                <Text style={styles.locationText} numberOfLines={1}>
                  {pickup?.address || 'Pickup'}
                </Text>
                <Text style={styles.locationText} numberOfLines={1}>
                  {dropoff?.address || 'Dropoff'}
                </Text>
              </View>
            </View>
          </View>

          {/* Cancel Button */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
          >
            <Text style={styles.cancelButtonText}>
              {t('ride.cancelRequest', { defaultValue: 'Cancel Request' })}
            </Text>
          </TouchableOpacity>

          {/* Tips */}
          <View style={styles.tipsSection}>
            <Text style={styles.tipIcon}>💡</Text>
            <Text style={styles.tipText}>
              {t('ride.searchTip', { defaultValue: 'This usually takes 1-3 minutes during regular hours' })}
            </Text>
          </View>
        </View>
      </SafeAreaView>
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  content: {
    flex: 1,
  },

  // Back Button
  backButton: {
    position: 'absolute',
    left: spacing.base,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    ...shadows.md,
  },
  backIcon: {
    fontSize: 22,
    color: colors.text,
  },

  // Center Animation
  centerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.primary,
  },
  pulseRingInner: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.primary,
  },
  searchIconContainer: {
    position: 'absolute',
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    top: 0,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },
  searchEmoji: {
    fontSize: 24,
  },
  carContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
  carIcon: {
    fontSize: 40,
  },

  // Bottom Sheet
  bottomSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.lg,
  },

  // Status
  statusSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  dotsContainer: {
    flexDirection: 'row',
    marginLeft: spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginHorizontal: 2,
  },
  statusSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textLight,
    marginTop: spacing.xs,
  },
  searchTimer: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },

  // Trip Info
  tripInfo: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.lg,
  },
  tripRow: {
    flexDirection: 'row',
  },
  locationIndicator: {
    alignItems: 'center',
    marginRight: spacing.sm,
    paddingVertical: spacing.xs,
  },
  pickupDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  locationLine: {
    width: 2,
    height: 24,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  dropoffDot: {
    width: 10,
    height: 10,
    backgroundColor: colors.error,
  },
  locationTexts: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  locationText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    marginBottom: spacing.md,
  },

  // Cancel Button
  cancelButton: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  cancelButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.error,
  },

  // Tips
  tipsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.sm,
  },
  tipIcon: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  tipText: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
});

export default FindingDriverScreen;
