/**
 * Wasil Rider - Ride Confirm Screen
 * Select ride type, view fare estimate, and confirm ride
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import MapView from '../../../../shared/src/components/MapView';
import Button from '../../../../shared/src/components/Button';
import { colors, spacing, typography, borderRadius, shadows, RIDE_TYPES, PAYMENT_METHODS } from '@wasil/shared';
import {
  selectPickup,
  selectDropoff,
  selectFareEstimate,
  selectSelectedRideType,
  selectPaymentMethod,
  selectIsLoading,
  setRideType,
  setPaymentMethod,
  getFareEstimate,
  requestRide,
} from '../../store/slices/rideSlice';

const { width } = Dimensions.get('window');

// Ride type configs with Juba pricing
const RIDE_OPTIONS = [
  {
    id: 'boda',
    name: 'Boda Boda',
    icon: '🏍️',
    description: 'Motorcycle, 1 person',
    multiplier: 0.8,
    eta: '2 min',
    capacity: 1,
  },
  {
    id: 'standard',
    name: 'Standard',
    icon: '🚗',
    description: 'Comfortable car, up to 4',
    multiplier: 1.0,
    eta: '4 min',
    capacity: 4,
  },
  {
    id: 'premium',
    name: 'Premium',
    icon: '🚙',
    description: 'Luxury ride, up to 4',
    multiplier: 1.5,
    eta: '6 min',
    capacity: 4,
  },
];

// Payment options
const PAYMENT_OPTIONS = [
  { id: 'cash', name: 'Cash', icon: '💵' },
  { id: 'mtn_money', name: 'MTN Money', icon: '📱' },
  { id: 'zain_cash', name: 'Zain Cash', icon: '📱' },
];

const RideConfirmScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const mapRef = useRef(null);
  
  const pickup = useSelector(selectPickup);
  const dropoff = useSelector(selectDropoff);
  const fareEstimate = useSelector(selectFareEstimate);
  const selectedRideType = useSelector(selectSelectedRideType);
  const paymentMethod = useSelector(selectPaymentMethod);
  const isLoading = useSelector(selectIsLoading);
  
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fetch fare estimate on mount
    if (pickup && dropoff) {
      dispatch(getFareEstimate({ pickup, dropoff }));
    }

    // Animate in
    Animated.spring(slideAnim, {
      toValue: 1,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleSelectRideType = (rideType) => {
    dispatch(setRideType(rideType));
  };

  const handleSelectPayment = (method) => {
    dispatch(setPaymentMethod(method));
    setShowPaymentSheet(false);
  };

  const handleConfirmRide = async () => {
    try {
      await dispatch(requestRide({
        pickup,
        dropoff,
        rideType: selectedRideType,
        paymentMethod,
        fare: calculateFare(),
      })).unwrap();
      
      navigation.navigate('FindingDriver');
    } catch (error) {
      console.error('Failed to request ride:', error);
    }
  };

  const calculateFare = () => {
    if (!fareEstimate) return 0;
    const option = RIDE_OPTIONS.find(o => o.id === selectedRideType);
    return Math.round(fareEstimate.totalFare * (option?.multiplier || 1));
  };

  const formatCurrency = (amount) => {
    return `${amount.toLocaleString()} SSP`;
  };

  // Mock route coordinates for demo
  const routeCoordinates = pickup && dropoff ? [
    { latitude: pickup.latitude, longitude: pickup.longitude },
    { latitude: (pickup.latitude + dropoff.latitude) / 2, longitude: (pickup.longitude + dropoff.longitude) / 2 + 0.005 },
    { latitude: dropoff.latitude, longitude: dropoff.longitude },
  ] : [];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Map Section */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          pickupLocation={pickup}
          dropoffLocation={dropoff}
          routeCoordinates={routeCoordinates}
          showsUserLocation={false}
        />

        {/* Back Button */}
        <TouchableOpacity
          style={[styles.backButton, { top: insets.top + spacing.sm }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet */}
      <Animated.View
        style={[
          styles.bottomSheet,
          { paddingBottom: insets.bottom + spacing.md },
          {
            transform: [{
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [400, 0],
              }),
            }],
          },
        ]}
      >
        {/* Handle */}
        <View style={styles.handle} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Trip Summary */}
          <View style={styles.tripSummary}>
            <View style={styles.tripLocations}>
              <View style={styles.locationItem}>
                <View style={styles.pickupDot} />
                <Text style={styles.locationText} numberOfLines={1}>
                  {pickup?.address || 'Pickup'}
                </Text>
              </View>
              <View style={styles.locationDivider} />
              <View style={styles.locationItem}>
                <View style={styles.dropoffDot} />
                <Text style={styles.locationText} numberOfLines={1}>
                  {dropoff?.address || 'Dropoff'}
                </Text>
              </View>
            </View>
            <Text style={styles.tripDistance}>
              {fareEstimate?.distance ? `${fareEstimate.distance.toFixed(1)} km` : '--'}
              {' • '}
              {fareEstimate?.duration ? `${Math.round(fareEstimate.duration / 60)} min` : '--'}
            </Text>
          </View>

          {/* Ride Type Selection */}
          <Text style={styles.sectionTitle}>
            {t('ride.selectRide', { defaultValue: 'Select your ride' })}
          </Text>
          
          <View style={styles.rideOptions}>
            {RIDE_OPTIONS.map((option) => {
              const isSelected = selectedRideType === option.id;
              const fare = fareEstimate
                ? Math.round(fareEstimate.totalFare * option.multiplier)
                : '--';

              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.rideOption,
                    isSelected && styles.rideOptionSelected,
                  ]}
                  onPress={() => handleSelectRideType(option.id)}
                >
                  <View style={styles.rideOptionLeft}>
                    <Text style={styles.rideIcon}>{option.icon}</Text>
                    <View style={styles.rideInfo}>
                      <Text style={[
                        styles.rideName,
                        isSelected && styles.rideNameSelected,
                      ]}>
                        {option.name}
                      </Text>
                      <Text style={styles.rideDescription}>
                        {option.description}
                      </Text>
                      <Text style={styles.rideETA}>
                        ⏱ {option.eta} away
                      </Text>
                    </View>
                  </View>
                  <View style={styles.rideOptionRight}>
                    <Text style={[
                      styles.rideFare,
                      isSelected && styles.rideFareSelected,
                    ]}>
                      {typeof fare === 'number' ? formatCurrency(fare) : fare}
                    </Text>
                    {isSelected && (
                      <View style={styles.selectedIndicator}>
                        <Text style={styles.checkIcon}>✓</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Payment Method */}
          <TouchableOpacity
            style={styles.paymentSection}
            onPress={() => setShowPaymentSheet(true)}
          >
            <View style={styles.paymentLeft}>
              <Text style={styles.paymentIcon}>
                {PAYMENT_OPTIONS.find(p => p.id === paymentMethod)?.icon || '💵'}
              </Text>
              <Text style={styles.paymentName}>
                {PAYMENT_OPTIONS.find(p => p.id === paymentMethod)?.name || 'Cash'}
              </Text>
            </View>
            <Text style={styles.paymentChange}>Change</Text>
          </TouchableOpacity>

          {/* Promo Code */}
          <TouchableOpacity style={styles.promoSection}>
            <Text style={styles.promoIcon}>🎟️</Text>
            <Text style={styles.promoText}>
              {t('ride.addPromo', { defaultValue: 'Add promo code' })}
            </Text>
            <Text style={styles.promoArrow}>→</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Confirm Button */}
        <View style={styles.confirmSection}>
          <View style={styles.fareRow}>
            <Text style={styles.fareLabel}>Total Fare</Text>
            <Text style={styles.fareAmount}>
              {formatCurrency(calculateFare())}
            </Text>
          </View>
          <Button
            title={t('ride.confirmRide', { defaultValue: 'Confirm Ride' })}
            onPress={handleConfirmRide}
            loading={isLoading}
            disabled={!pickup || !dropoff}
          />
        </View>
      </Animated.View>

      {/* Payment Method Sheet */}
      {showPaymentSheet && (
        <TouchableOpacity
          style={styles.paymentOverlay}
          activeOpacity={1}
          onPress={() => setShowPaymentSheet(false)}
        >
          <View style={[styles.paymentSheet, { paddingBottom: insets.bottom }]}>
            <View style={styles.paymentSheetHandle} />
            <Text style={styles.paymentSheetTitle}>Payment Method</Text>
            {PAYMENT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.paymentOption,
                  paymentMethod === option.id && styles.paymentOptionSelected,
                ]}
                onPress={() => handleSelectPayment(option.id)}
              >
                <Text style={styles.paymentOptionIcon}>{option.icon}</Text>
                <Text style={styles.paymentOptionName}>{option.name}</Text>
                {paymentMethod === option.id && (
                  <Text style={styles.paymentOptionCheck}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Map
  mapContainer: {
    height: '40%',
  },
  map: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    left: spacing.base,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },
  backIcon: {
    fontSize: 22,
    color: colors.text,
  },

  // Bottom Sheet
  bottomSheet: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    marginTop: -20,
    ...shadows.lg,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
  },

  // Trip Summary
  tripSummary: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.lg,
  },
  tripLocations: {
    marginBottom: spacing.sm,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  pickupDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginRight: spacing.sm,
  },
  dropoffDot: {
    width: 10,
    height: 10,
    backgroundColor: colors.error,
    marginRight: spacing.sm,
  },
  locationDivider: {
    width: 2,
    height: 16,
    backgroundColor: colors.border,
    marginLeft: 4,
    marginVertical: 2,
  },
  locationText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.text,
  },
  tripDistance: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    textAlign: 'center',
  },

  // Section Title
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },

  // Ride Options
  rideOptions: {
    marginBottom: spacing.lg,
  },
  rideOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.base,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  rideOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08',
  },
  rideOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rideIcon: {
    fontSize: 32,
    marginRight: spacing.base,
  },
  rideInfo: {
    flex: 1,
  },
  rideName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: 2,
  },
  rideNameSelected: {
    color: colors.primary,
  },
  rideDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    marginBottom: 2,
  },
  rideETA: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },
  rideOptionRight: {
    alignItems: 'flex-end',
  },
  rideFare: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: 4,
  },
  rideFareSelected: {
    color: colors.primary,
  },
  selectedIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkIcon: {
    fontSize: 12,
    color: colors.white,
    fontWeight: typography.fontWeight.bold,
  },

  // Payment Section
  paymentSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.base,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  paymentName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
  },
  paymentChange: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },

  // Promo Section
  promoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
  },
  promoIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  promoText: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.textLight,
  },
  promoArrow: {
    fontSize: 16,
    color: colors.primary,
  },

  // Confirm Section
  confirmSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  fareLabel: {
    fontSize: typography.fontSize.base,
    color: colors.textLight,
  },
  fareAmount: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },

  // Payment Sheet Overlay
  paymentOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  paymentSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  paymentSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  paymentSheetTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  paymentOptionSelected: {
    backgroundColor: colors.primary + '15',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  paymentOptionIcon: {
    fontSize: 24,
    marginRight: spacing.base,
  },
  paymentOptionName: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
  },
  paymentOptionCheck: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
});

export default RideConfirmScreen;
