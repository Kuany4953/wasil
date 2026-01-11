/**
 * Wasil Rider - Ride Confirm Screen
 * Select ride type, view fare estimate, and confirm ride - Professional Design
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
    icon: 'motorcycle',
    description: 'Motorcycle, 1 person',
    multiplier: 0.8,
    eta: '2 min',
    capacity: 1,
  },
  {
    id: 'standard',
    name: 'Standard',
    icon: 'car',
    description: 'Comfortable car, up to 4',
    multiplier: 1.0,
    eta: '4 min',
    capacity: 4,
  },
  {
    id: 'premium',
    name: 'Premium',
    icon: 'premium',
    description: 'Luxury ride, up to 4',
    multiplier: 1.5,
    eta: '6 min',
    capacity: 4,
  },
];

// Payment options
const PAYMENT_OPTIONS = [
  { id: 'cash', name: 'Cash', icon: 'cash' },
  { id: 'mtn_money', name: 'MTN Money', icon: 'mobile' },
  { id: 'zain_cash', name: 'Zain Cash', icon: 'mobile' },
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
  const paymentSheetAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fetch fare estimate on mount
    if (pickup && dropoff) {
      dispatch(getFareEstimate({ pickup, dropoff }));
    }

    // Animate in
    Animated.spring(slideAnim, {
      toValue: 1,
      tension: 40,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (showPaymentSheet) {
      Animated.spring(paymentSheetAnim, {
        toValue: 1,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }).start();
    } else {
      paymentSheetAnim.setValue(0);
    }
  }, [showPaymentSheet]);

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

  const renderRideIcon = (iconType, isSelected) => {
    const iconColor = isSelected ? colors.primary : '#6B7280';
    
    switch (iconType) {
      case 'motorcycle':
        return <View style={[styles.motorcycleIcon, { backgroundColor: iconColor }]} />;
      case 'car':
        return <View style={[styles.carIcon, { backgroundColor: iconColor }]} />;
      case 'premium':
        return <View style={[styles.premiumIcon, { backgroundColor: iconColor }]} />;
      default:
        return <View style={[styles.carIcon, { backgroundColor: iconColor }]} />;
    }
  };

  const renderPaymentIcon = (iconType) => {
    switch (iconType) {
      case 'cash':
        return <View style={styles.cashIcon} />;
      case 'mobile':
        return <View style={styles.mobileIcon} />;
      default:
        return <View style={styles.cashIcon} />;
    }
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
          activeOpacity={0.8}
        >
          <View style={styles.backArrow} />
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
            <View style={styles.tripHeader}>
              <View style={styles.routeIconContainer}>
                <View style={styles.routeIconCircle} />
              </View>
              <Text style={styles.tripHeaderText}>Trip Route</Text>
            </View>

            <View style={styles.tripLocations}>
              <View style={styles.locationRow}>
                <View style={styles.locationDotContainer}>
                  <View style={styles.pickupDot} />
                  <View style={styles.pickupRing} />
                </View>
                <Text style={styles.locationText} numberOfLines={1}>
                  {pickup?.address || 'Pickup'}
                </Text>
              </View>
              <View style={styles.locationDivider} />
              <View style={styles.locationRow}>
                <View style={styles.locationDotContainer}>
                  <View style={styles.dropoffSquare} />
                </View>
                <Text style={styles.locationText} numberOfLines={1}>
                  {dropoff?.address || 'Dropoff'}
                </Text>
              </View>
            </View>

            <View style={styles.tripMetrics}>
              <View style={styles.metricItem}>
                <View style={styles.metricIcon}>
                  <View style={styles.distanceIconSmall} />
                </View>
                <Text style={styles.metricValue}>
                  {fareEstimate?.distance ? `${fareEstimate.distance.toFixed(1)} km` : '--'}
                </Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <View style={styles.metricIcon}>
                  <View style={styles.timeIconSmall} />
                </View>
                <Text style={styles.metricValue}>
                  {fareEstimate?.duration ? `${Math.round(fareEstimate.duration / 60)} min` : '--'}
                </Text>
              </View>
            </View>
          </View>

          {/* Ride Type Selection */}
          <Text style={styles.sectionTitle}>
            {t('ride.selectRide', { defaultValue: 'Choose your ride' })}
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
                  activeOpacity={0.8}
                >
                  <View style={styles.rideOptionContent}>
                    <View style={[
                      styles.rideIconContainer,
                      isSelected && styles.rideIconContainerSelected,
                    ]}>
                      {renderRideIcon(option.icon, isSelected)}
                    </View>
                    
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
                      <View style={styles.rideMetaRow}>
                        <View style={styles.etaBadge}>
                          <View style={styles.etaIcon} />
                          <Text style={styles.rideETA}>{option.eta}</Text>
                        </View>
                        <View style={styles.capacityBadge}>
                          <View style={styles.personIcon} />
                          <Text style={styles.capacityText}>×{option.capacity}</Text>
                        </View>
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
                          <View style={styles.checkIcon} />
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Payment Method */}
          <TouchableOpacity
            style={styles.paymentSection}
            onPress={() => setShowPaymentSheet(true)}
            activeOpacity={0.8}
          >
            <View style={styles.paymentLeft}>
              <View style={styles.paymentIconContainer}>
                {renderPaymentIcon(PAYMENT_OPTIONS.find(p => p.id === paymentMethod)?.icon || 'cash')}
              </View>
              <Text style={styles.paymentName}>
                {PAYMENT_OPTIONS.find(p => p.id === paymentMethod)?.name || 'Cash'}
              </Text>
            </View>
            <View style={styles.chevronContainer}>
              <View style={styles.chevronRight} />
            </View>
          </TouchableOpacity>

          {/* Promo Code */}
          <TouchableOpacity style={styles.promoSection} activeOpacity={0.8}>
            <View style={styles.promoIconContainer}>
              <View style={styles.promoIcon} />
            </View>
            <Text style={styles.promoText}>
              {t('ride.addPromo', { defaultValue: 'Add promo code' })}
            </Text>
            <View style={styles.promoArrowContainer}>
              <View style={styles.promoArrow} />
            </View>
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
          <Animated.View 
            style={[
              styles.paymentSheet,
              { 
                paddingBottom: insets.bottom + spacing.lg,
                transform: [{
                  translateY: paymentSheetAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [300, 0],
                  }),
                }],
              },
            ]}
          >
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
                activeOpacity={0.8}
              >
                <View style={styles.paymentOptionIconContainer}>
                  {renderPaymentIcon(option.icon)}
                </View>
                <Text style={styles.paymentOptionName}>{option.name}</Text>
                {paymentMethod === option.id && (
                  <View style={styles.paymentOptionCheck}>
                    <View style={styles.paymentCheckIcon} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </Animated.View>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
    left: spacing.lg,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
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

  // Bottom Sheet
  bottomSheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: borderRadius['3xl'],
    borderTopRightRadius: borderRadius['3xl'],
    marginTop: -20,
    ...shadows.xl,
    elevation: 20,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 140,
  },

  // Trip Summary
  tripSummary: {
    backgroundColor: '#F9FAFB',
    borderRadius: borderRadius['2xl'],
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  tripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  routeIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  routeIconCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  tripHeaderText: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: '#111827',
  },
  tripLocations: {
    marginBottom: spacing.base,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  locationDotContainer: {
    width: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  pickupDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  pickupRing: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.primary + '40',
  },
  dropoffSquare: {
    width: 10,
    height: 10,
    backgroundColor: '#EF4444',
    borderRadius: 2,
  },
  locationDivider: {
    width: 2,
    height: 20,
    backgroundColor: '#E5E7EB',
    marginLeft: 11,
    marginVertical: 2,
  },
  locationText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: '#111827',
    fontWeight: '600',
  },
  tripMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.base,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricIcon: {
    marginRight: spacing.xs,
  },
  distanceIconSmall: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3B82F6',
  },
  timeIconSmall: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#10B981',
  },
  metricValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: '#6B7280',
  },
  metricDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#E5E7EB',
    marginHorizontal: spacing.base,
  },

  // Section Title
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: '#111827',
    marginBottom: spacing.base,
  },

  // Ride Options
  rideOptions: {
    marginBottom: spacing.lg,
  },
  rideOption: {
    backgroundColor: '#F9FAFB',
    borderRadius: borderRadius['2xl'],
    padding: spacing.base,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: '#F3F4F6',
  },
  rideOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08',
  },
  rideOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rideIconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.xl,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.base,
  },
  rideIconContainerSelected: {
    backgroundColor: colors.primary + '15',
  },
  motorcycleIcon: {
    width: 28,
    height: 20,
    borderRadius: 4,
  },
  carIcon: {
    width: 32,
    height: 22,
    borderRadius: 6,
  },
  premiumIcon: {
    width: 36,
    height: 24,
    borderRadius: 8,
  },
  rideInfo: {
    flex: 1,
  },
  rideName: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  rideNameSelected: {
    color: colors.primary,
  },
  rideDescription: {
    fontSize: typography.fontSize.sm,
    color: '#6B7280',
    marginBottom: spacing.xs,
    fontWeight: '500',
  },
  rideMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  etaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  etaIcon: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    marginRight: 4,
  },
  rideETA: {
    fontSize: typography.fontSize.xs,
    color: '#1E40AF',
    fontWeight: '700',
  },
  capacityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  personIcon: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6B7280',
    marginRight: 3,
  },
  capacityText: {
    fontSize: typography.fontSize.xs,
    color: '#6B7280',
    fontWeight: '700',
  },
  rideOptionRight: {
    alignItems: 'flex-end',
    marginLeft: spacing.sm,
  },
  rideFare: {
    fontSize: typography.fontSize.lg,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  rideFareSelected: {
    color: colors.primary,
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkIcon: {
    width: 12,
    height: 8,
    borderBottomWidth: 2.5,
    borderLeftWidth: 2.5,
    borderColor: '#FFFFFF',
    transform: [{ rotate: '-45deg' }],
    marginTop: -2,
  },

  // Payment Section
  paymentSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.base,
    backgroundColor: '#F9FAFB',
    borderRadius: borderRadius.xl,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  cashIcon: {
    width: 20,
    height: 16,
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  mobileIcon: {
    width: 16,
    height: 22,
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  paymentName: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: '#111827',
  },
  chevronContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
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
    borderLeftColor: '#9CA3AF',
  },

  // Promo Section
  promoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    backgroundColor: '#FEF3C7',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  promoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  promoIcon: {
    width: 18,
    height: 20,
    backgroundColor: '#F59E0B',
    borderRadius: 4,
  },
  promoText: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: '#92400E',
    fontWeight: '600',
  },
  promoArrowContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  promoArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderTopWidth: 5,
    borderBottomWidth: 5,
    borderLeftWidth: 7,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#F59E0B',
  },

  // Confirm Section
  confirmSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.xl,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    ...shadows.xl,
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  fareLabel: {
    fontSize: typography.fontSize.base,
    color: '#6B7280',
    fontWeight: '600',
  },
  fareAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },

  // Payment Sheet Overlay
  paymentOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  paymentSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: borderRadius['3xl'],
    borderTopRightRadius: borderRadius['3xl'],
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  paymentSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },
  paymentSheetTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '800',
    color: '#111827',
    marginBottom: spacing.lg,
    letterSpacing: -0.5,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.sm,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#F3F4F6',
  },
  paymentOptionSelected: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  paymentOptionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.base,
  },
  paymentOptionName: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: '#111827',
  },
  paymentOptionCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentCheckIcon: {
    width: 14,
    height: 10,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#FFFFFF',
    transform: [{ rotate: '-45deg' }],
    marginTop: -2,
  },
});

export default RideConfirmScreen;

