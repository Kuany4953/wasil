/**
 * Wasil Rider - Ride Complete Screen
 * Beautiful rating screen with tip option - Professional Design
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Animated,
  TextInput,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography, borderRadius, shadows, CURRENCY } from '@wasil/shared';
import Button from '../../../../shared/src/components/Button';
import {
  selectCurrentRide,
  rateRide,
  clearRide,
  selectIsLoading,
} from '../../store/slices/rideSlice';

const TIP_OPTIONS = [0, 200, 500, 1000];

const RideCompleteScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const currentRide = useSelector(selectCurrentRide);
  const isLoading = useSelector(selectIsLoading);

  const [rating, setRating] = useState(5);
  const [selectedTip, setSelectedTip] = useState(0);
  const [customTip, setCustomTip] = useState('');
  const [feedback, setFeedback] = useState('');
  const [showCustomTip, setShowCustomTip] = useState(false);

  // Animations
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const starAnims = useRef([...Array(5)].map(() => new Animated.Value(0))).current;
  const confettiAnims = useRef([...Array(15)].map(() => ({
    x: new Animated.Value(0),
    y: new Animated.Value(0),
    opacity: new Animated.Value(1),
    rotate: new Animated.Value(0),
  }))).current;

  useEffect(() => {
    // Entrance animation
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate stars sequentially
    starAnims.forEach((anim, index) => {
      Animated.sequence([
        Animated.delay(200 + index * 80),
        Animated.spring(anim, {
          toValue: 1,
          tension: 80,
          friction: 5,
          useNativeDriver: true,
        }),
      ]).start();
    });

    // Confetti animation
    confettiAnims.forEach((confetti, index) => {
      const randomX = (Math.random() - 0.5) * 300;
      const randomDelay = Math.random() * 400;
      const randomRotate = Math.random() * 720;
      
      Animated.sequence([
        Animated.delay(randomDelay),
        Animated.parallel([
          Animated.timing(confetti.x, {
            toValue: randomX,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(confetti.y, {
            toValue: 700,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(confetti.opacity, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(confetti.rotate, {
            toValue: randomRotate,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    });
  }, []);

  const handleStarPress = (star) => {
    setRating(star);
    
    // Bounce animation
    Animated.sequence([
      Animated.timing(starAnims[star - 1], {
        toValue: 1.4,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(starAnims[star - 1], {
        toValue: 1,
        tension: 80,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSubmit = async () => {
    const tip = showCustomTip ? parseInt(customTip) || 0 : selectedTip;
    
    try {
      await dispatch(rateRide({
        rideId: currentRide?.id,
        rating,
        tip,
        feedback,
      })).unwrap();
      
      dispatch(clearRide());
      navigation.replace('Main');
    } catch (error) {
      console.log('Rating error:', error);
    }
  };

  const formatCurrency = (amount) => {
    return `${amount.toLocaleString()} ${CURRENCY.code}`;
  };

  const getRatingLabel = (stars) => {
    const labels = {
      1: t('rating.terrible', { defaultValue: 'Terrible' }),
      2: t('rating.poor', { defaultValue: 'Poor' }),
      3: t('rating.okay', { defaultValue: 'Okay' }),
      4: t('rating.good', { defaultValue: 'Good' }),
      5: t('rating.excellent', { defaultValue: 'Excellent' }),
    };
    return labels[stars] || '';
  };

  const confettiColors = ['#00A86B', '#10B981', '#FCD34D', '#60A5FA', '#F472B6'];

  const getDriverInitials = () => {
    const first = currentRide?.driver?.firstName?.[0] || '';
    const last = currentRide?.driver?.lastName?.[0] || '';
    return (first + last).toUpperCase() || 'DR';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Confetti */}
      <View style={styles.confettiContainer}>
        {confettiAnims.map((confetti, index) => (
          <Animated.View
            key={index}
            style={[
              styles.confetti,
              {
                backgroundColor: confettiColors[index % confettiColors.length],
                transform: [
                  { translateX: confetti.x },
                  { translateY: confetti.y },
                  { rotate: confetti.rotate.interpolate({
                      inputRange: [0, 720],
                      outputRange: ['0deg', '720deg'],
                    })
                  },
                ],
                opacity: confetti.opacity,
              },
            ]}
          />
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Icon */}
        <Animated.View
          style={[
            styles.successIcon,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <View style={styles.checkCircle}>
            <View style={styles.checkMark} />
          </View>
          <View style={styles.successGlow} />
        </Animated.View>

        {/* Title */}
        <Text style={styles.title}>{t('ride.rideComplete', { defaultValue: 'Trip completed!' })}</Text>
        <Text style={styles.subtitle}>{t('ride.thanksForRiding', { defaultValue: 'Thanks for riding with Wasil' })}</Text>

        {/* Fare Card */}
        <Animated.View style={[styles.fareCard, { opacity: fadeAnim }]}>
          <View style={styles.fareHeader}>
            <View style={styles.fareIconContainer}>
              <View style={styles.receiptIcon} />
            </View>
            <View style={styles.fareHeaderContent}>
              <Text style={styles.fareLabel}>{t('ride.totalFare', { defaultValue: 'Total Fare' })}</Text>
              <Text style={styles.fareAmount}>
                {formatCurrency(currentRide?.finalFare || currentRide?.estimatedFare || 0)}
              </Text>
            </View>
          </View>

          <View style={styles.fareDetails}>
            <View style={styles.fareRow}>
              <View style={styles.fareRowIcon}>
                <View style={styles.distanceIcon} />
              </View>
              <Text style={styles.fareDetailLabel}>{t('ride.distance', { defaultValue: 'Distance' })}</Text>
              <Text style={styles.fareDetailValue}>
                {currentRide?.distance?.toFixed(1) || '0'} km
              </Text>
            </View>
            <View style={styles.fareRow}>
              <View style={styles.fareRowIcon}>
                <View style={styles.timeIcon} />
              </View>
              <Text style={styles.fareDetailLabel}>{t('ride.duration', { defaultValue: 'Duration' })}</Text>
              <Text style={styles.fareDetailValue}>
                {currentRide?.duration || '0'} min
              </Text>
            </View>
            <View style={styles.fareRow}>
              <View style={styles.fareRowIcon}>
                <View style={styles.paymentIcon} />
              </View>
              <Text style={styles.fareDetailLabel}>{t('ride.paymentMethod', { defaultValue: 'Payment' })}</Text>
              <Text style={styles.fareDetailValue}>
                {currentRide?.paymentMethod || 'Cash'}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Driver Card */}
        <Animated.View style={[styles.driverCard, { opacity: fadeAnim }]}>
          <View style={styles.driverAvatar}>
            <Text style={styles.driverAvatarText}>
              {getDriverInitials()}
            </Text>
          </View>
          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>
              {currentRide?.driver?.firstName || 'Driver'} {currentRide?.driver?.lastName?.[0] || ''}
            </Text>
            <View style={styles.vehicleRow}>
              <View style={styles.carIconSmall} />
              <Text style={styles.vehicleInfo}>
                {currentRide?.driver?.vehicle?.make || 'Toyota'} • {currentRide?.driver?.vehicle?.licensePlate || 'ABC 123'}
              </Text>
            </View>
          </View>
          <View style={styles.driverBadge}>
            <View style={styles.starIconSmall} />
            <Text style={styles.driverRating}>
              {currentRide?.driver?.rating?.toFixed(1) || '4.9'}
            </Text>
          </View>
        </Animated.View>

        {/* Rating Section */}
        <View style={styles.ratingSection}>
          <Text style={styles.sectionTitle}>{t('rating.howWasYourRide', { defaultValue: 'How was your trip?' })}</Text>
          
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => handleStarPress(star)}
                activeOpacity={0.7}
                style={styles.starButton}
              >
                <Animated.View
                  style={[
                    styles.starContainer,
                    star <= rating && styles.starContainerFilled,
                    { transform: [{ scale: starAnims[star - 1] }] },
                  ]}
                >
                  <View style={[
                    styles.starShape,
                    star <= rating && styles.starShapeFilled,
                  ]} />
                </Animated.View>
              </TouchableOpacity>
            ))}
          </View>
          
          <Text style={styles.ratingLabel}>{getRatingLabel(rating)}</Text>
        </View>

        {/* Tip Section */}
        <View style={styles.tipSection}>
          <View style={styles.tipHeader}>
            <View style={styles.tipIconContainer}>
              <View style={styles.tipIcon} />
            </View>
            <View>
              <Text style={styles.sectionTitle}>{t('rating.addTip', { defaultValue: 'Add a tip' })}</Text>
              <Text style={styles.tipSubtitle}>{t('rating.tipGoesToDriver', { defaultValue: '100% goes to your driver' })}</Text>
            </View>
          </View>

          <View style={styles.tipOptions}>
            {TIP_OPTIONS.map((tip) => (
              <TouchableOpacity
                key={tip}
                style={[
                  styles.tipOption,
                  selectedTip === tip && !showCustomTip && styles.tipOptionSelected,
                ]}
                onPress={() => {
                  setSelectedTip(tip);
                  setShowCustomTip(false);
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tipText,
                    selectedTip === tip && !showCustomTip && styles.tipTextSelected,
                  ]}
                >
                  {tip === 0 ? t('rating.noTip', { defaultValue: 'No tip' }) : formatCurrency(tip)}
                </Text>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={[
                styles.tipOption,
                showCustomTip && styles.tipOptionSelected,
              ]}
              onPress={() => {
                setShowCustomTip(true);
                setSelectedTip(0);
              }}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tipText,
                  showCustomTip && styles.tipTextSelected,
                ]}
              >
                {t('rating.custom', { defaultValue: 'Custom' })}
              </Text>
            </TouchableOpacity>
          </View>

          {showCustomTip && (
            <View style={styles.customTipInput}>
              <View style={styles.customTipIconContainer}>
                <View style={styles.customTipCurrencyIcon} />
              </View>
              <TextInput
                style={styles.customTipField}
                value={customTip}
                onChangeText={setCustomTip}
                placeholder="0"
                keyboardType="number-pad"
                placeholderTextColor="#9CA3AF"
              />
              <Text style={styles.customTipCurrency}>{CURRENCY.code}</Text>
            </View>
          )}
        </View>

        {/* Feedback */}
        <View style={styles.feedbackSection}>
          <Text style={styles.sectionTitle}>{t('rating.additionalFeedback', { defaultValue: 'Additional feedback' })}</Text>
          <View style={styles.feedbackInputContainer}>
            <TextInput
              style={styles.feedbackInput}
              value={feedback}
              onChangeText={setFeedback}
              placeholder={t('rating.feedbackPlaceholder', { defaultValue: 'Share your experience (optional)' })}
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Submit Button */}
        <Button
          title={t('rating.submitRating', { defaultValue: 'Submit rating' })}
          onPress={handleSubmit}
          loading={isLoading}
          style={styles.submitButton}
        />

        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => {
            dispatch(clearRide());
            navigation.replace('Main');
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.skipText}>{t('rating.skip', { defaultValue: 'Skip for now' })}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: spacing['3xl'],
  },

  // Confetti
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  confetti: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 2,
    top: 100,
  },

  // Success Icon
  successIcon: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.lg,
  },
  checkCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.xl,
    elevation: 12,
  },
  checkMark: {
    width: 40,
    height: 24,
    borderBottomWidth: 6,
    borderLeftWidth: 6,
    borderColor: '#FFFFFF',
    transform: [{ rotate: '-45deg' }],
    marginTop: -8,
    marginLeft: 4,
  },
  successGlow: {
    position: 'absolute',
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: '#10B981' + '20',
    top: -10,
  },

  // Title
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: spacing.xl,
    fontWeight: '500',
  },

  // Fare Card
  fareCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: borderRadius['2xl'],
    padding: spacing.lg,
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  fareHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingBottom: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  fareIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  receiptIcon: {
    width: 20,
    height: 24,
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  fareHeaderContent: {
    flex: 1,
  },
  fareLabel: {
    fontSize: typography.fontSize.sm,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 2,
  },
  fareAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  fareDetails: {},
  fareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  fareRowIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  distanceIcon: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#3B82F6',
  },
  timeIcon: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  paymentIcon: {
    width: 16,
    height: 12,
    backgroundColor: '#F59E0B',
    borderRadius: 2,
  },
  fareDetailLabel: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: '#6B7280',
    fontWeight: '500',
  },
  fareDetailValue: {
    fontSize: typography.fontSize.md,
    color: '#111827',
    fontWeight: '700',
  },

  // Driver Card
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: borderRadius['2xl'],
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  driverAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  driverAvatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: '#111827',
    marginBottom: spacing.xs,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  carIconSmall: {
    width: 16,
    height: 12,
    backgroundColor: '#6B7280',
    borderRadius: 2,
    marginRight: spacing.xs,
  },
  vehicleInfo: {
    fontSize: typography.fontSize.sm,
    color: '#6B7280',
    fontWeight: '500',
  },
  driverBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  starIconSmall: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#F59E0B',
    transform: [{ rotate: '35deg' }],
    marginRight: spacing.xs,
  },
  driverRating: {
    fontSize: typography.fontSize.sm,
    fontWeight: '800',
    color: '#92400E',
  },

  // Rating
  ratingSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    backgroundColor: '#F9FAFB',
    borderRadius: borderRadius['2xl'],
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: '#111827',
    marginBottom: spacing.lg,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: spacing.base,
    gap: spacing.sm,
  },
  starButton: {
    padding: spacing.xs,
  },
  starContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  starContainerFilled: {
    backgroundColor: '#FCD34D',
  },
  starShape: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 18,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#9CA3AF',
    transform: [{ rotate: '35deg' }],
  },
  starShapeFilled: {
    borderBottomColor: '#FFFFFF',
  },
  ratingLabel: {
    fontSize: typography.fontSize.base,
    color: '#6B7280',
    fontWeight: '600',
  },

  // Tip
  tipSection: {
    marginBottom: spacing.xl,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  tipIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  tipIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2.5,
    borderColor: '#F59E0B',
  },
  tipSubtitle: {
    fontSize: typography.fontSize.sm,
    color: '#6B7280',
    fontWeight: '500',
  },
  tipOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  tipOption: {
    backgroundColor: '#F3F4F6',
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    margin: spacing.xs,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tipOptionSelected: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  tipText: {
    fontSize: typography.fontSize.md,
    color: '#6B7280',
    fontWeight: '700',
  },
  tipTextSelected: {
    color: colors.primary,
  },
  customTipInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: borderRadius.xl,
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  customTipIconContainer: {
    marginRight: spacing.sm,
  },
  customTipCurrencyIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  customTipField: {
    flex: 1,
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    paddingVertical: spacing.base,
  },
  customTipCurrency: {
    fontSize: typography.fontSize.lg,
    color: '#6B7280',
    fontWeight: '700',
  },

  // Feedback
  feedbackSection: {
    marginBottom: spacing.xl,
  },
  feedbackInputContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  feedbackInput: {
    padding: spacing.lg,
    fontSize: typography.fontSize.base,
    color: '#111827',
    minHeight: 100,
    textAlignVertical: 'top',
    fontWeight: '500',
  },

  // Submit
  submitButton: {
    marginBottom: spacing.md,
  },
  skipButton: {
    alignItems: 'center',
    padding: spacing.md,
  },
  skipText: {
    fontSize: typography.fontSize.base,
    color: '#9CA3AF',
    fontWeight: '600',
  },
});

export default RideCompleteScreen;

