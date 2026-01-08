/**
 * Wasil Rider - Profile Setup Screen
 * User profile completion after OTP verification
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
  ScrollView,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography, borderRadius, shadows } from '@wasil/shared';
import Button from '../../../../shared/src/components/Button';
import { 
  completeProfile, 
  selectIsLoading, 
  selectAuthError, 
  selectUser,
  clearError 
} from '../../store/slices/authSlice';

const ProfileSetupScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectAuthError);
  const user = useSelector(selectUser);
  
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [focusedField, setFocusedField] = useState(null);
  
  const lastNameRef = useRef(null);
  const emailRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

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

  const isValidEmail = (email) => {
    if (!email) return true; // Email is optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isFormValid = () => {
    return firstName.trim().length >= 2 && isValidEmail(email);
  };

  const handleComplete = async () => {
    if (!isFormValid()) return;
    
    Keyboard.dismiss();
    
    try {
      await dispatch(completeProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim() || undefined,
      })).unwrap();
      
      // Navigation will be handled automatically by auth state change
      // The AppNavigator will redirect to the main app
    } catch (err) {
      console.log('Profile setup error:', err);
    }
  };

  const handleSkip = () => {
    // Allow skipping profile setup - navigate directly to main app
    navigation.replace('Main');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
            >
              <Text style={styles.skipText}>
                {t('common.skip', { defaultValue: 'Skip' })}
              </Text>
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
            {/* Avatar */}
            <View style={styles.avatarSection}>
              <TouchableOpacity style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarEmoji}>👤</Text>
                </View>
                <View style={styles.cameraButton}>
                  <Text style={styles.cameraIcon}>📷</Text>
                </View>
              </TouchableOpacity>
              <Text style={styles.avatarHint}>
                {t('profile.addPhoto', { defaultValue: 'Add a photo' })}
              </Text>
            </View>

            {/* Title */}
            <Text style={styles.title}>
              {t('profile.setupTitle', { defaultValue: 'Complete your profile' })}
            </Text>
            <Text style={styles.subtitle}>
              {t('profile.setupSubtitle', { defaultValue: 'Help drivers recognize you and provide better service' })}
            </Text>

            {/* Form */}
            <View style={styles.form}>
              {/* First Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  {t('profile.firstName', { defaultValue: 'First name' })} *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    focusedField === 'firstName' && styles.inputFocused,
                  ]}
                  value={firstName}
                  onChangeText={setFirstName}
                  onFocus={() => setFocusedField('firstName')}
                  onBlur={() => setFocusedField(null)}
                  placeholder={t('profile.firstNamePlaceholder', { defaultValue: 'Enter your first name' })}
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="words"
                  returnKeyType="next"
                  onSubmitEditing={() => lastNameRef.current?.focus()}
                />
              </View>

              {/* Last Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  {t('profile.lastName', { defaultValue: 'Last name' })}
                </Text>
                <TextInput
                  ref={lastNameRef}
                  style={[
                    styles.input,
                    focusedField === 'lastName' && styles.inputFocused,
                  ]}
                  value={lastName}
                  onChangeText={setLastName}
                  onFocus={() => setFocusedField('lastName')}
                  onBlur={() => setFocusedField(null)}
                  placeholder={t('profile.lastNamePlaceholder', { defaultValue: 'Enter your last name' })}
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="words"
                  returnKeyType="next"
                  onSubmitEditing={() => emailRef.current?.focus()}
                />
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  {t('profile.email', { defaultValue: 'Email' })}
                  <Text style={styles.optionalTag}> ({t('common.optional', { defaultValue: 'optional' })})</Text>
                </Text>
                <TextInput
                  ref={emailRef}
                  style={[
                    styles.input,
                    focusedField === 'email' && styles.inputFocused,
                    email && !isValidEmail(email) && styles.inputError,
                  ]}
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholder={t('profile.emailPlaceholder', { defaultValue: 'Enter your email' })}
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleComplete}
                />
                {email && !isValidEmail(email) && (
                  <Text style={styles.errorText}>
                    {t('profile.invalidEmail', { defaultValue: 'Please enter a valid email' })}
                  </Text>
                )}
              </View>
            </View>

            {/* Benefits */}
            <View style={styles.benefits}>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitIcon}>✓</Text>
                <Text style={styles.benefitText}>
                  {t('profile.benefit1', { defaultValue: 'Personalized ride experience' })}
                </Text>
              </View>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitIcon}>✓</Text>
                <Text style={styles.benefitText}>
                  {t('profile.benefit2', { defaultValue: 'Digital receipts via email' })}
                </Text>
              </View>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitIcon}>✓</Text>
                <Text style={styles.benefitText}>
                  {t('profile.benefit3', { defaultValue: 'Easier driver identification' })}
                </Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>

        {/* Bottom Section */}
        <View style={styles.bottomSection}>
          <Button
            title={t('profile.complete', { defaultValue: 'Complete profile' })}
            onPress={handleComplete}
            loading={isLoading}
            disabled={!isFormValid()}
          />
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
  scrollContent: {
    flexGrow: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  skipButton: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  skipText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },

  // Avatar
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.border,
  },
  avatarEmoji: {
    fontSize: 48,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.white,
  },
  cameraIcon: {
    fontSize: 16,
  },
  avatarHint: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
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
    marginBottom: spacing['2xl'],
  },

  // Form
  form: {
    marginBottom: spacing.xl,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  optionalTag: {
    fontWeight: typography.fontWeight.normal,
    color: colors.textMuted,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text,
  },
  inputFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    color: colors.error,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
  },

  // Benefits
  benefits: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  benefitIcon: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
    marginRight: spacing.sm,
  },
  benefitText: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
  },

  // Bottom
  bottomSection: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['2xl'],
    paddingTop: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});

export default ProfileSetupScreen;
