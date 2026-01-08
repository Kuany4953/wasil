/**
 * Wasil Rider - Ride Complete Screen
 * Beautiful rating screen with tip option
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
  const confettiAnims = useRef([...Array(20)].map(() => ({
    x: new Animated.Value(0),
    y: new Animated.Value(0),
    opacity: new Animated.Value(1),
  }))).current;

  useEffect(() => {
    // Entrance animation
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate stars sequentially
    starAnims.forEach((anim, index) => {
      Animated.sequence([
        Animated.delay(100 + index * 100),
        Animated.spring(anim, {
          toValue: 1,
          tension: 100,
          friction: 5,
          useNativeDriver: true,
        }),
      ]).start();
    });

    // Confetti animation
    confettiAnims.forEach((confetti, index) => {
      const randomX = (Math.random() - 0.5) * 400;
      const randomDelay = Math.random() * 500;
      
      Animated.sequence([
        Animated.delay(randomDelay),
        Animated.parallel([
          Animated.timing(confetti.x, {
            toValue: randomX,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(confetti.y, {
            toValue: 600,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(confetti.opacity, {
            toValue: 0,
            duration: 1500,
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
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(starAnims[star - 1], {
        toValue: 1,
        tension: 100,
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
      1: t('rating.terrible'),
      2: t('rating.poor'),
      3: t('rating.okay'),
      4: t('rating.good'),
      5: t('rating.excellent'),
    };
    return labels[stars] || '';
  };

  const confettiColors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#FF8C94'];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

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
                  { rotate: `${Math.random() * 360}deg` },
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
            <Text style={styles.checkMark}>✓</Text>
          </View>
        </Animated.View>

        {/* Title */}
        <Text style={styles.title}>{t('ride.rideComplete')}</Text>
        <Text style={styles.subtitle}>{t('ride.thanksForRiding')}</Text>

        {/* Fare Card */}
        <Animated.View style={[styles.fareCard, { opacity: fadeAnim }]}>
          <View style={styles.fareHeader}>
            <Text style={styles.fareLabel}>{t('ride.totalFare')}</Text>
            <Text style={styles.fareAmount}>
              {formatCurrency(currentRide?.finalFare || currentRide?.estimatedFare || 0)}
            </Text>
          </View>

          <View style={styles.fareDetails}>
            <View style={styles.fareRow}>
              <Text style={styles.fareDetailLabel}>{t('ride.distance')}</Text>
              <Text style={styles.fareDetailValue}>
                {currentRide?.distance?.toFixed(1) || '0'} km
              </Text>
            </View>
            <View style={styles.fareRow}>
              <Text style={styles.fareDetailLabel}>{t('ride.duration')}</Text>
              <Text style={styles.fareDetailValue}>
                {currentRide?.duration || '0'} min
              </Text>
            </View>
            <View style={styles.fareRow}>
              <Text style={styles.fareDetailLabel}>{t('ride.paymentMethod')}</Text>
              <Text style={styles.fareDetailValue}>
                💵 {currentRide?.paymentMethod || 'Cash'}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Driver Card */}
        <Animated.View style={[styles.driverCard, { opacity: fadeAnim }]}>
          <View style={styles.driverAvatar}>
            <Text style={styles.driverAvatarText}>
              {currentRide?.driver?.firstName?.[0] || '🚗'}
            </Text>
          </View>
          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>
              {currentRide?.driver?.firstName || 'Driver'} {currentRide?.driver?.lastName?.[0] || ''}
            </Text>
            <Text style={styles.vehicleInfo}>
              {currentRide?.driver?.vehicle?.make || 'Toyota'} • {currentRide?.driver?.vehicle?.licensePlate || 'ABC 123'}
            </Text>
          </View>
        </Animated.View>

        {/* Rating Section */}
        <View style={styles.ratingSection}>
          <Text style={styles.ratingTitle}>{t('rating.howWasYourRide')}</Text>
          
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => handleStarPress(star)}
                activeOpacity={0.7}
              >
                <Animated.Text
                  style={[
                    styles.star,
                    star <= rating && styles.starFilled,
                    { transform: [{ scale: starAnims[star - 1] }] },
                  ]}
                >
                  {star <= rating ? '★' : '☆'}
                </Animated.Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <Text style={styles.ratingLabel}>{getRatingLabel(rating)}</Text>
        </View>

        {/* Tip Section */}
        <View style={styles.tipSection}>
          <Text style={styles.tipTitle}>{t('rating.addTip')}</Text>
          <Text style={styles.tipSubtitle}>{t('rating.tipGoesToDriver')}</Text>

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
              >
                <Text
                  style={[
                    styles.tipText,
                    selectedTip === tip && !showCustomTip && styles.tipTextSelected,
                  ]}
                >
                  {tip === 0 ? t('rating.noTip') : formatCurrency(tip)}
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
            >
              <Text
                style={[
                  styles.tipText,
                  showCustomTip && styles.tipTextSelected,
                ]}
              >
                {t('rating.custom')}
              </Text>
            </TouchableOpacity>
          </View>

          {showCustomTip && (
            <View style={styles.customTipInput}>
              <TextInput
                style={styles.customTipField}
                value={customTip}
                onChangeText={setCustomTip}
                placeholder="0"
                keyboardType="number-pad"
                placeholderTextColor={colors.textMuted}
              />
              <Text style={styles.customTipCurrency}>{CURRENCY.code}</Text>
            </View>
          )}
        </View>

        {/* Feedback */}
        <View style={styles.feedbackSection}>
          <TextInput
            style={styles.feedbackInput}
            value={feedback}
            onChangeText={setFeedback}
            placeholder={t('rating.feedbackPlaceholder')}
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Submit Button */}
        <Button
          title={t('rating.submitRating')}
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
        >
          <Text style={styles.skipText}>{t('rating.skip')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    width: 10,
    height: 10,
    borderRadius: 2,
    top: 0,
  },

  // Success Icon
  successIcon: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
  checkMark: {
    fontSize: 40,
    color: colors.white,
    fontWeight: typography.fontWeight.bold,
  },

  // Title
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },

  // Fare Card
  fareCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  fareHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  fareLabel: {
    fontSize: typography.fontSize.lg,
    color: colors.textLight,
  },
  fareAmount: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  fareDetails: {},
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  fareDetailLabel: {
    fontSize: typography.fontSize.md,
    color: colors.textLight,
  },
  fareDetailValue: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },

  // Driver Card
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.xl,
  },
  driverAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  driverAvatarText: {
    fontSize: 24,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  vehicleInfo: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
  },

  // Rating
  ratingSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  ratingTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  star: {
    fontSize: 44,
    marginHorizontal: spacing.xs,
    color: colors.border,
  },
  starFilled: {
    color: colors.secondary,
  },
  ratingLabel: {
    fontSize: typography.fontSize.md,
    color: colors.textLight,
    fontWeight: typography.fontWeight.medium,
  },

  // Tip
  tipSection: {
    marginBottom: spacing.xl,
  },
  tipTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  tipSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    marginBottom: spacing.md,
  },
  tipOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  tipOption: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
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
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  tipTextSelected: {
    color: colors.primary,
  },
  customTipInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
    paddingHorizontal: spacing.base,
  },
  customTipField: {
    flex: 1,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    paddingVertical: spacing.md,
  },
  customTipCurrency: {
    fontSize: typography.fontSize.lg,
    color: colors.textLight,
  },

  // Feedback
  feedbackSection: {
    marginBottom: spacing.xl,
  },
  feedbackInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    fontSize: typography.fontSize.base,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
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
    color: colors.textLight,
  },
});

export default RideCompleteScreen;
