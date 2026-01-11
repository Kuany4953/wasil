/**
 * Wasil Rider - OTP Verification Screen
 * Professional animated OTP input with auto-submit - Uber-like Design
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
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography, borderRadius, shadows } from '@wasil/shared';
import Button from '../../../../shared/src/components/Button';
import { verifyOTP, selectIsLoading, selectAuthError, resendOTP } from '../../store/slices/authSlice';

const OTP_LENGTH = 6;

const OTPScreen = ({ route, navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { phoneNumber } = route.params || {};
  
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectAuthError);
  
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  const inputRefs = useRef([]);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnims = useRef(Array(OTP_LENGTH).fill(0).map(() => new Animated.Value(0))).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 8,
        delay: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate OTP boxes on mount
    fadeAnims.forEach((anim, index) => {
      Animated.spring(anim, {
        toValue: 1,
        tension: 40,
        friction: 7,
        delay: 200 + index * 50,
        useNativeDriver: true,
      }).start();
    });
    
    // Focus first input
    setTimeout(() => inputRefs.current[0]?.focus(), 600);
  }, []);

  useEffect(() => {
    // Countdown timer
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  useEffect(() => {
    // Auto-submit when all digits entered
    if (otp.every(digit => digit !== '')) {
      handleVerify();
    }
  }, [otp]);

  useEffect(() => {
    // Shake animation on error
    if (error) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
  }, [error]);

  const handleOtpChange = (text, index) => {
    const newOtp = [...otp];
    
    // Handle paste (multiple digits)
    if (text.length > 1) {
      const digits = text.replace(/\D/g, '').slice(0, OTP_LENGTH);
      digits.split('').forEach((digit, i) => {
        if (index + i < OTP_LENGTH) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + digits.length, OTP_LENGTH - 1);
      inputRefs.current[nextIndex]?.focus();
      return;
    }
    
    // Single digit
    newOtp[index] = text.replace(/\D/g, '');
    setOtp(newOtp);
    
    // Auto-focus next input
    if (text && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    if (otpString.length !== OTP_LENGTH) return;
    
    Keyboard.dismiss();
    
    try {
      await dispatch(verifyOTP({ phoneNumber, otp: otpString })).unwrap();
      navigation.replace('ProfileSetup');
    } catch (err) {
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    
    setCanResend(false);
    setCountdown(60);
    setOtp(Array(OTP_LENGTH).fill(''));
    
    try {
      await dispatch(resendOTP(phoneNumber)).unwrap();
      inputRefs.current[0]?.focus();
    } catch (err) {
      console.log('Resend error:', err);
    }
  };

  const formatPhone = (phone) => {
    if (!phone) return '';
    return phone.replace(/(\+211)(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4');
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
        <View style={styles.content}>
          {/* Icon */}
          <Animated.View
            style={[
              styles.iconContainer,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View style={styles.iconCircle}>
              <View style={styles.phoneIcon} />
            </View>
            <View style={styles.iconRing1} />
            <View style={styles.iconRing2} />
          </Animated.View>

          {/* Title */}
          <Animated.View
            style={[
              styles.titleContainer,
              {
                opacity: scaleAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.title}>Enter verification code</Text>
            <Text style={styles.subtitle}>
              We've sent a 6-digit code to
            </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.phoneNumber}>{formatPhone(phoneNumber)}</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* OTP Input */}
          <Animated.View
            style={[
              styles.otpContainer,
              { transform: [{ translateX: shakeAnim }] },
            ]}
          >
            {otp.map((digit, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.otpBoxWrapper,
                  {
                    opacity: fadeAnims[index],
                    transform: [
                      {
                        scale: fadeAnims[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <View style={styles.otpBoxContainer}>
                  <TextInput
                    ref={ref => inputRefs.current[index] = ref}
                    style={[
                      styles.otpBox,
                      focusedIndex === index && styles.otpBoxFocused,
                      digit && styles.otpBoxFilled,
                      error && styles.otpBoxError,
                    ]}
                    value={digit}
                    onChangeText={(text) => handleOtpChange(text, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    onFocus={() => setFocusedIndex(index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                    caretHidden
                  />
                  {focusedIndex === index && !digit && (
                    <Animated.View style={styles.cursor} />
                  )}
                  {digit && (
                    <View style={styles.checkmark} />
                  )}
                </View>
              </Animated.View>
            ))}
          </Animated.View>

          {/* Error Message */}
          {error && (
            <Animated.View 
              style={styles.errorContainer}
              entering="fadeIn"
            >
              <View style={styles.errorIconContainer}>
                <View style={styles.errorIcon} />
              </View>
              <Text style={styles.errorText}>{error}</Text>
            </Animated.View>
          )}

          {/* Verify Button - Only show if manual submission needed */}
          {!otp.every(d => d !== '') && (
            <Button
              title="Verify Code"
              onPress={handleVerify}
              loading={isLoading}
              disabled={otp.some(d => !d)}
              style={styles.verifyButton}
            />
          )}

          {/* Resend Section */}
          <View style={styles.resendSection}>
            <Text style={styles.resendText}>
              Didn't receive a code?
            </Text>
            {canResend ? (
              <TouchableOpacity 
                onPress={handleResend}
                activeOpacity={0.7}
                style={styles.resendButton}
              >
                <Text style={styles.resendLink}>Resend Code</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.countdownContainer}>
                <View style={styles.timerIcon} />
                <Text style={styles.countdownText}>
                  Resend in {countdown}s
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.securityNote}>
            <View style={styles.lockIcon} />
            <Text style={styles.securityText}>
              Your information is encrypted and secure
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
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    paddingTop: spacing['2xl'],
  },
  
  // Icon
  iconContainer: {
    marginBottom: spacing['3xl'],
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
  phoneIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: colors.primary,
    backgroundColor: 'transparent',
  },
  iconRing1: {
    position: 'absolute',
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 2,
    borderColor: colors.primary + '20',
  },
  iconRing2: {
    position: 'absolute',
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 1,
    borderColor: colors.primary + '10',
  },
  
  // Title
  titleContainer: {
    alignItems: 'center',
    marginBottom: spacing['3xl'],
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: spacing.md,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: spacing.xs,
    fontWeight: '500',
  },
  phoneNumber: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  
  // OTP Input
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  otpBoxWrapper: {
    position: 'relative',
  },
  otpBoxContainer: {
    position: 'relative',
  },
  otpBox: {
    width: 48,
    height: 64,
    borderRadius: borderRadius.xl,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    paddingTop: Platform.OS === 'android' ? 12 : 0,
  },
  otpBoxFocused: {
    borderColor: colors.primary,
    backgroundColor: '#FFFFFF',
    ...shadows.md,
    elevation: 4,
  },
  otpBoxFilled: {
    backgroundColor: colors.primary + '08',
    borderColor: colors.primary,
  },
  otpBoxError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEE2E2',
  },
  cursor: {
    position: 'absolute',
    width: 2,
    height: 28,
    backgroundColor: colors.primary,
    top: 18,
    left: '50%',
    marginLeft: -1,
    opacity: 0.8,
  },
  checkmark: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  
  // Error
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.lg,
    width: '100%',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  errorIcon: {
    width: 3,
    height: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  errorText: {
    fontSize: typography.fontSize.md,
    color: '#991B1B',
    flex: 1,
    fontWeight: '600',
  },
  
  verifyButton: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  
  // Resend Section
  resendSection: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  resendText: {
    fontSize: typography.fontSize.md,
    color: '#6B7280',
    marginBottom: spacing.sm,
    fontWeight: '500',
  },
  resendButton: {
    paddingVertical: spacing.sm,
  },
  resendLink: {
    fontSize: typography.fontSize.md,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.2,
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  timerIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    marginRight: spacing.xs,
  },
  countdownText: {
    fontSize: typography.fontSize.sm,
    color: '#6B7280',
    fontWeight: '600',
  },
  
  // Footer
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['2xl'],
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  lockIcon: {
    width: 14,
    height: 16,
    borderRadius: 3,
    borderWidth: 2,
    borderColor: '#10B981',
    borderTopWidth: 0,
    marginRight: spacing.md,
  },
  securityText: {
    fontSize: typography.fontSize.sm,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default OTPScreen;

