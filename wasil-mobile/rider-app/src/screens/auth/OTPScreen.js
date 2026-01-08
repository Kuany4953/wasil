/**
 * Wasil Rider - OTP Verification Screen
 * Beautiful animated OTP input with auto-submit
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

  useEffect(() => {
    // Animate OTP boxes on mount
    fadeAnims.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 200,
        delay: index * 100,
        useNativeDriver: true,
      }).start();
    });
    
    // Focus first input
    setTimeout(() => inputRefs.current[0]?.focus(), 500);
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
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Text style={styles.icon}>📱</Text>
            </View>
            <View style={styles.iconPulse} />
          </View>

          {/* Title */}
          <Text style={styles.title}>{t('auth.verifyPhone')}</Text>
          <Text style={styles.subtitle}>
            {t('auth.otpSentTo')}
          </Text>
          <Text style={styles.phoneNumber}>{formatPhone(phoneNumber)}</Text>

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
                  { opacity: fadeAnims[index] },
                ]}
              >
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
                  <View style={styles.cursor} />
                )}
              </Animated.View>
            ))}
          </Animated.View>

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Verify Button */}
          <Button
            title={t('auth.verify')}
            onPress={handleVerify}
            loading={isLoading}
            disabled={otp.some(d => !d)}
            style={styles.verifyButton}
          />

          {/* Resend */}
          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>
              {t('auth.didntReceive')}{' '}
            </Text>
            {canResend ? (
              <TouchableOpacity onPress={handleResend}>
                <Text style={styles.resendLink}>{t('auth.resend')}</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.countdownText}>
                {t('auth.resendIn', { seconds: countdown })}
              </Text>
            )}
          </View>
        </View>

        {/* Security Note */}
        <View style={styles.footer}>
          <View style={styles.securityNote}>
            <Text style={styles.securityIcon}>🔒</Text>
            <Text style={styles.securityText}>
              {t('auth.securityNote')}
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
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  
  // Icon
  iconContainer: {
    marginBottom: spacing['2xl'],
    position: 'relative',
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconPulse: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary + '08',
    top: -10,
    left: -10,
  },
  icon: {
    fontSize: 50,
  },
  
  // Title
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  phoneNumber: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
    marginBottom: spacing['2xl'],
  },
  
  // OTP Input
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  otpBoxWrapper: {
    marginHorizontal: spacing.xs,
    position: 'relative',
  },
  otpBox: {
    width: 52,
    height: 60,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    textAlign: 'center',
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  otpBoxFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.white,
    ...shadows.md,
  },
  otpBoxFilled: {
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary,
  },
  otpBoxError: {
    borderColor: colors.error,
    backgroundColor: colors.error + '10',
  },
  cursor: {
    position: 'absolute',
    width: 2,
    height: 24,
    backgroundColor: colors.primary,
    top: 18,
    left: '50%',
    marginLeft: -1,
  },
  
  // Error
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error + '10',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  errorIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  errorText: {
    fontSize: typography.fontSize.md,
    color: colors.error,
    flex: 1,
  },
  
  verifyButton: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  
  // Resend
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resendText: {
    fontSize: typography.fontSize.base,
    color: colors.textLight,
  },
  resendLink: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
  countdownText: {
    fontSize: typography.fontSize.base,
    color: colors.textMuted,
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
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  securityIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  securityText: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    textAlign: 'center',
  },
});

export default OTPScreen;
