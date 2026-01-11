
/**
 * Wasil Rider - Profile Setup Screen
 * User profile completion after OTP verification - Professional Design
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
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const avatarScale = useRef(new Animated.Value(0)).current;

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

    // Avatar pop-in animation
    Animated.spring(avatarScale, {
      toValue: 1,
      tension: 50,
      friction: 7,
      delay: 200,
      useNativeDriver: true,
    }).start();

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

  const getInitials = () => {
    const first = firstName.trim()[0]?.toUpperCase() || '';
    const last = lastName.trim()[0]?.toUpperCase() || '';
    return first + last || 'U';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
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
            <View style={styles.headerLeft} />
            <Text style={styles.stepIndicator}>Step 3 of 3</Text>
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
              activeOpacity={0.7}
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
                transform: [
                  { translateY: slideAnim },
                  { scale: scaleAnim },
                ],
              },
            ]}
          >
            {/* Avatar */}
            <View style={styles.avatarSection}>
              <Animated.View
                style={[
                  styles.avatarContainer,
                  { transform: [{ scale: avatarScale }] },
                ]}
              >
                <TouchableOpacity 
                  style={styles.avatar}
                  activeOpacity={0.8}
                >
                  {firstName || lastName ? (
                    <Text style={styles.avatarInitials}>{getInitials()}</Text>
                  ) : (
                    <View style={styles.defaultAvatarIcon} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.cameraButton}
                  activeOpacity={0.8}
                >
                  <View style={styles.cameraIcon} />
                </TouchableOpacity>
              </Animated.View>
              <Text style={styles.avatarHint}>
                {t('profile.addPhoto', { defaultValue: 'Add a photo' })}
              </Text>
            </View>

            {/* Title */}
            <Text style={styles.title}>
              {t('profile.setupTitle', { defaultValue: 'Complete your profile' })}
            </Text>
            <Text style={styles.subtitle}>
              {t('profile.setupSubtitle', { defaultValue: 'Help drivers recognize you easier' })}
            </Text>

            {/* Form */}
            <View style={styles.form}>
              {/* First Name */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>
                    {t('profile.firstName', { defaultValue: 'First name' })}
                  </Text>
                  <View style={styles.requiredBadge}>
                    <Text style={styles.requiredText}>Required</Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.inputContainer,
                    focusedField === 'firstName' && styles.inputContainerFocused,
                    firstName.trim().length >= 2 && styles.inputContainerValid,
                  ]}
                >
                  <View style={styles.inputIcon}>
                    <View style={styles.personIcon} />
                  </View>
                  <TextInput
                    style={styles.input}
                    value={firstName}
                    onChangeText={setFirstName}
                    onFocus={() => setFocusedField('firstName')}
                    onBlur={() => setFocusedField(null)}
                    placeholder={t('profile.firstNamePlaceholder', { defaultValue: 'Enter your first name' })}
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="words"
                    returnKeyType="next"
                    onSubmitEditing={() => lastNameRef.current?.focus()}
                  />
                  {firstName.trim().length >= 2 && (
                    <View style={styles.validIcon}>
                      <View style={styles.checkmark} />
                    </View>
                  )}
                </View>
              </View>

              {/* Last Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  {t('profile.lastName', { defaultValue: 'Last name' })}
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    focusedField === 'lastName' && styles.inputContainerFocused,
                  ]}
                >
                  <View style={styles.inputIcon}>
                    <View style={styles.personIcon} />
                  </View>
                  <TextInput
                    ref={lastNameRef}
                    style={styles.input}
                    value={lastName}
                    onChangeText={setLastName}
                    onFocus={() => setFocusedField('lastName')}
                    onBlur={() => setFocusedField(null)}
                    placeholder={t('profile.lastNamePlaceholder', { defaultValue: 'Enter your last name' })}
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="words"
                    returnKeyType="next"
                    onSubmitEditing={() => emailRef.current?.focus()}
                  />
                </View>
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>
                    {t('profile.email', { defaultValue: 'Email' })}
                  </Text>
                  <Text style={styles.optionalTag}>
                    ({t('common.optional', { defaultValue: 'Optional' })})
                  </Text>
                </View>
                <View
                  style={[
                    styles.inputContainer,
                    focusedField === 'email' && styles.inputContainerFocused,
                    email && !isValidEmail(email) && styles.inputContainerError,
                    email && isValidEmail(email) && styles.inputContainerValid,
                  ]}
                >
                  <View style={styles.inputIcon}>
                    <View style={styles.emailIcon} />
                  </View>
                  <TextInput
                    ref={emailRef}
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    placeholder={t('profile.emailPlaceholder', { defaultValue: 'your@email.com' })}
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleComplete}
                  />
                  {email && isValidEmail(email) && (
                    <View style={styles.validIcon}>
                      <View style={styles.checkmark} />
                    </View>
                  )}
                </View>
                {email && !isValidEmail(email) && (
                  <View style={styles.errorContainer}>
                    <View style={styles.errorIconSmall} />
                    <Text style={styles.errorText}>
                      {t('profile.invalidEmail', { defaultValue: 'Please enter a valid email' })}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Benefits */}
            <View style={styles.benefitsCard}>
              <View style={styles.benefitsHeader}>
                <View style={styles.benefitsIconContainer}>
                  <View style={styles.benefitsIcon} />
                </View>
                <Text style={styles.benefitsTitle}>Why add this info?</Text>
              </View>
              
              <View style={styles.benefitsList}>
                <View style={styles.benefitItem}>
                  <View style={styles.checkIconContainer}>
                    <View style={styles.checkIconSmall} />
                  </View>
                  <Text style={styles.benefitText}>
                    {t('profile.benefit1', { defaultValue: 'Personalized ride experience' })}
                  </Text>
                </View>
                <View style={styles.benefitItem}>
                  <View style={styles.checkIconContainer}>
                    <View style={styles.checkIconSmall} />
                  </View>
                  <Text style={styles.benefitText}>
                    {t('profile.benefit2', { defaultValue: 'Digital receipts via email' })}
                  </Text>
                </View>
                <View style={styles.benefitItem}>
                  <View style={styles.checkIconContainer}>
                    <View style={styles.checkIconSmall} />
                  </View>
                  <Text style={styles.benefitText}>
                    {t('profile.benefit3', { defaultValue: 'Easier driver identification' })}
                  </Text>
                </View>
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
          <Text style={styles.privacyText}>
            By continuing, you agree that your information is secure
          </Text>
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerLeft: {
    width: 60,
  },
  stepIndicator: {
    fontSize: typography.fontSize.sm,
    color: '#6B7280',
    fontWeight: '600',
  },
  skipButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: '#F3F4F6',
  },
  skipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: colors.primary,
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },

  // Avatar
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    ...shadows.lg,
  },
  avatarInitials: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -1,
  },
  defaultAvatarIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    opacity: 0.5,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    ...shadows.md,
  },
  cameraIcon: {
    width: 18,
    height: 14,
    borderRadius: 3,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarHint: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: '600',
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
    marginBottom: spacing['2xl'],
    fontWeight: '500',
    paddingHorizontal: spacing.lg,
    lineHeight: 24,
  },

  // Form
  form: {
    marginBottom: spacing.xl,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: 0.2,
  },
  requiredBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    marginLeft: spacing.sm,
  },
  requiredText: {
    fontSize: typography.fontSize.xs,
    color: '#DC2626',
    fontWeight: '700',
  },
  optionalTag: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: '#9CA3AF',
    marginLeft: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    paddingHorizontal: spacing.base,
    height: 56,
  },
  inputContainerFocused: {
    borderColor: colors.primary,
    backgroundColor: '#FFFFFF',
    ...shadows.md,
    elevation: 4,
  },
  inputContainerValid: {
    borderColor: '#10B981',
  },
  inputContainerError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  inputIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  personIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#9CA3AF',
  },
  emailIcon: {
    width: 18,
    height: 14,
    borderRadius: 3,
    backgroundColor: '#9CA3AF',
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: '#111827',
    fontWeight: '600',
    padding: 0,
  },
  validIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  checkmark: {
    width: 10,
    height: 6,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderColor: '#FFFFFF',
    transform: [{ rotate: '-45deg' }],
    marginTop: -2,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  errorIconSmall: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    marginRight: spacing.xs,
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    color: '#DC2626',
    fontWeight: '600',
  },

  // Benefits
  benefitsCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: borderRadius['2xl'],
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  benefitsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  benefitsIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  benefitsIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  benefitsTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: '#111827',
  },
  benefitsList: {
    marginTop: spacing.sm,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  checkIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  checkIconSmall: {
    width: 8,
    height: 5,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderColor: '#FFFFFF',
    transform: [{ rotate: '-45deg' }],
    marginTop: -1,
  },
  benefitText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: '#6B7280',
    fontWeight: '500',
    lineHeight: 20,
  },

  // Bottom
  bottomSection: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing['2xl'],
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  privacyText: {
    fontSize: typography.fontSize.xs,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: spacing.md,
    fontWeight: '500',
  },
});

export default ProfileSetupScreen;
