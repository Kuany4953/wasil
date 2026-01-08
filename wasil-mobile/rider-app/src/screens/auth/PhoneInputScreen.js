/**
 * Wasil Rider - Phone Input Screen
 * Clean phone number entry with country code
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
  const slideAnim = useRef(new Animated.Value(30)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Clear any previous errors
    dispatch(clearError());
  }, []);

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
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Title */}
          <Text style={styles.title}>
            {t('auth.enterPhone', { defaultValue: 'Enter your phone number' })}
          </Text>
          <Text style={styles.subtitle}>
            {t('auth.phoneSubtitle', { defaultValue: "We'll send you a verification code" })}
          </Text>

          {/* Phone Input */}
          <TouchableOpacity
            style={[
              styles.phoneInputContainer,
              isFocused && styles.phoneInputFocused,
            ]}
            activeOpacity={1}
            onPress={() => inputRef.current?.focus()}
          >
            {/* Country Code */}
            <View style={styles.countryCode}>
              <Text style={styles.flag}>🇸🇸</Text>
              <Text style={styles.countryCodeText}>{COUNTRY_CODE}</Text>
              <Text style={styles.dropdownIcon}>▼</Text>
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
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                maxLength={11} // 9 digits + 2 spaces
                autoFocus
              />
            </View>
          </TouchableOpacity>

          {/* Helper Text */}
          <View style={styles.helperContainer}>
            <Text style={styles.helperIcon}>ℹ️</Text>
            <Text style={styles.helperText}>
              {t('auth.phoneHelper', { defaultValue: 'Standard SMS rates may apply' })}
            </Text>
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
              <Text style={styles.demoHintText}>
                🧪 Demo mode: Use OTP 123456
              </Text>
            </View>
          )}
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
  
  // Header
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

  // Content
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textLight,
    marginBottom: spacing['2xl'],
  },

  // Phone Input
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    paddingHorizontal: spacing.base,
    height: 60,
  },
  phoneInputFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.white,
    ...shadows.md,
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.base,
  },
  flag: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  countryCodeText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  dropdownIcon: {
    fontSize: 10,
    color: colors.textMuted,
    marginLeft: spacing.xs,
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
    marginRight: spacing.base,
  },
  phoneNumberContainer: {
    flex: 1,
  },
  phoneInput: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    padding: 0,
  },

  // Helper
  helperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  helperIcon: {
    fontSize: 14,
    marginRight: spacing.sm,
  },
  helperText: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
  },

  // Bottom
  bottomSection: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['2xl'],
  },
  demoHint: {
    marginTop: spacing.lg,
    padding: spacing.base,
    backgroundColor: colors.warning + '20',
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  demoHintText: {
    fontSize: typography.fontSize.sm,
    color: colors.warning,
    fontWeight: typography.fontWeight.medium,
  },
});

export default PhoneInputScreen;
