/**
 * Wasil Rider - Phone Input Screen
 * Clean phone number entry with country code - Professional Design
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TextInput,
  TouchableOpacity,
  Animated,
  Keyboard,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography, borderRadius, shadows } from '@wasil/shared';
import Button from '../../../../shared/src/components/Button';
import { sendOTP, selectIsLoading, selectAuthError, clearError } from '../../store/slices/authSlice';

const COUNTRY_CODE = '+211'; // South Sudan
const PHONE_LENGTH = 9; // South Sudan phone numbers are 9 digits after country code

const PhoneInputScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectAuthError);
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  
  const inputRef = useRef(null);
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Clear any previous errors
    dispatch(clearError());
  }, []);

  useEffect(() => {
    // Pulse animation for focused state
    if (isFocused) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.02,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isFocused]);

  useEffect(() => {
    if (error) {
      Alert.alert(
        t('common.error', { defaultValue: 'Error' }),
        error,
        [{ text: t('common.ok', { defaultValue: 'OK' }), onPress: () => dispatch(clearError()) }]
      );
    }
  }, [error]);

  const formatPhoneNumber = (text) => {
    // Remove non-digits
    const digits = text.replace(/\D/g, '');
    // Remove leading zero if present
    const cleaned = digits.startsWith('0') ? digits.slice(1) : digits;
    // Limit to max length
    return cleaned.slice(0, PHONE_LENGTH);
  };

  const handlePhoneChange = (text) => {
    setPhoneNumber(formatPhoneNumber(text));
  };

  const getFormattedDisplay = () => {
    if (phoneNumber.length === 0) return '';
    // Format as: 9XX XXX XXX
    let formatted = phoneNumber;
    if (phoneNumber.length > 3) {
      formatted = phoneNumber.slice(0, 3) + ' ' + phoneNumber.slice(3);
    }
    if (phoneNumber.length > 6) {
      formatted = phoneNumber.slice(0, 3) + ' ' + phoneNumber.slice(3, 6) + ' ' + phoneNumber.slice(6);
    }
    return formatted;
  };

  const isValidPhone = phoneNumber.length === PHONE_LENGTH;

  const handleContinue = async () => {
    if (!isValidPhone) return;
    
    Keyboard.dismiss();
    
    const fullPhoneNumber = COUNTRY_CODE + phoneNumber;
    
    try {
      await dispatch(sendOTP(fullPhoneNumber)).unwrap();
      navigation.navigate('OTP', { phoneNumber: fullPhoneNumber });
    } catch (err) {
      // Error is handled by the useEffect above
      console.log('Send OTP error:', err);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <View style={styles.backArrow} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
              ],
            },
          ]}
        >
          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.phoneIconCircle}>
              <View style={styles.phoneIcon} />
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>
            {t('auth.enterPhone', { defaultValue: 'Enter your phone number' })}
          </Text>
          <Text style={styles.subtitle}>
            {t('auth.phoneSubtitle', { defaultValue: "We'll send you a verification code" })}
          </Text>

          {/* Phone Input */}
          <Animated.View
            style={[
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.phoneInputContainer,
                isFocused && styles.phoneInputFocused,
                isValidPhone && styles.phoneInputValid,
              ]}
              activeOpacity={1}
              onPress={() => inputRef.current?.focus()}
            >
              {/* Country Code */}
              <View style={styles.countryCode}>
                <View style={styles.flagContainer}>
                  <View style={styles.flagTop} />
                  <View style={styles.flagMiddle} />
                  <View style={styles.flagBottom} />
                </View>
                <Text style={styles.countryCodeText}>{COUNTRY_CODE}</Text>
                <View style={styles.dropdownIcon} />
              </View>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Phone Number */}
              <View style={styles.phoneNumberContainer}>
                <TextInput
                  ref={inputRef}
                  style={styles.phoneInput}
                  value={getFormattedDisplay()}
                  onChangeText={handlePhoneChange}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder={t('auth.phonePlaceholder', { defaultValue: '9XX XXX XXX' })}
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  maxLength={11} // 9 digits + 2 spaces
                  autoFocus
                />
              </View>

              {/* Validation Check */}
              {isValidPhone && (
                <View style={styles.validCheckContainer}>
                  <View style={styles.validCheck} />
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Helper Text */}
          <View style={styles.helperContainer}>
            <View style={styles.infoIcon} />
            <Text style={styles.helperText}>
              {t('auth.phoneHelper', { defaultValue: 'Standard SMS rates may apply' })}
            </Text>
          </View>

          {/* Phone Number Format Guide */}
          <View style={styles.formatGuide}>
            <View style={styles.guideItem}>
              <View style={styles.guideDot} />
              <Text style={styles.guideText}>Enter 9 digits</Text>
            </View>
            <View style={styles.guideItem}>
              <View style={styles.guideDot} />
              <Text style={styles.guideText}>No need for leading 0</Text>
            </View>
          </View>
        </Animated.View>

        {/* Bottom Section */}
        <View style={styles.bottomSection}>
          <Button
            title={t('common.continue', { defaultValue: 'Continue' })}
            onPress={handleContinue}
            loading={isLoading}
            disabled={!isValidPhone}
          />

          {/* Demo Mode Hint */}
          {__DEV__ && (
            <View style={styles.demoHint}>
              <View style={styles.demoIcon} />
              <Text style={styles.demoHintText}>
                Demo mode: Use OTP 123456
              </Text>
            </View>
          )}

          {/* Security Note */}
          <View style={styles.securityNote}>
            <View style={styles.lockIcon} />
            <Text style={styles.securityText}>
              Your phone number is secure and private
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  
  // Header
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
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

  // Content
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  phoneIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: '#6B7280',
    marginBottom: spacing['2xl'],
    fontWeight: '500',
    lineHeight: 24,
  },

  // Phone Input
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    paddingHorizontal: spacing.lg,
    height: 64,
    marginBottom: spacing.lg,
  },
  phoneInputFocused: {
    borderColor: colors.primary,
    backgroundColor: '#FFFFFF',
    ...shadows.lg,
    elevation: 8,
  },
  phoneInputValid: {
    borderColor: '#10B981',
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.md,
  },
  flagContainer: {
    width: 28,
    height: 20,
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  flagTop: {
    flex: 1,
    backgroundColor: '#000000',
  },
  flagMiddle: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flagBottom: {
    flex: 1,
    backgroundColor: '#D90000',
  },
  countryCodeText: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: 0.3,
  },
  dropdownIcon: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderTopWidth: 5,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopColor: '#9CA3AF',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginLeft: spacing.xs,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: '#E5E7EB',
    marginRight: spacing.md,
  },
  phoneNumberContainer: {
    flex: 1,
  },
  phoneInput: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: '#111827',
    padding: 0,
    letterSpacing: 1,
  },
  validCheckContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  validCheck: {
    width: 12,
    height: 8,
    borderBottomWidth: 2.5,
    borderLeftWidth: 2.5,
    borderColor: '#FFFFFF',
    transform: [{ rotate: '-45deg' }],
    marginTop: -2,
  },

  // Helper
  helperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  infoIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.primary,
    marginRight: spacing.sm,
  },
  helperText: {
    fontSize: typography.fontSize.sm,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Format Guide
  formatGuide: {
    backgroundColor: '#F9FAFB',
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  guideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  guideDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginRight: spacing.md,
  },
  guideText: {
    fontSize: typography.fontSize.sm,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Bottom
  bottomSection: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['2xl'],
  },
  demoHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    padding: spacing.base,
    backgroundColor: '#FEF3C7',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  demoIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#F59E0B',
    marginRight: spacing.sm,
  },
  demoHintText: {
    fontSize: typography.fontSize.sm,
    color: '#92400E',
    fontWeight: '600',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.base,
    paddingVertical: spacing.md,
  },
  lockIcon: {
    width: 12,
    height: 14,
    borderRadius: 3,
    borderWidth: 2,
    borderColor: '#10B981',
    borderTopWidth: 0,
    marginRight: spacing.sm,
  },
  securityText: {
    fontSize: typography.fontSize.xs,
    color: '#9CA3AF',
    fontWeight: '500',
  },
});

export default PhoneInputScreen;

