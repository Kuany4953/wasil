/**
 * Wasil Rider - Welcome Screen
 * Uber-Inspired Clean Design with Maroon Theme
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
  Dimensions,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing, borderRadius } from '@wasil/shared';
import Button from '../../../../shared/src/components/Button';

const { width, height } = Dimensions.get('window');

const WelcomeScreen = ({ navigation }) => {
  const { t } = useTranslation();
  
  // Animations
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(50)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const buttonSlide = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    // Logo animation
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Content animation (delayed)
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(contentSlide, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }, 200);

    // Button animation (delayed)
    setTimeout(() => {
      Animated.spring(buttonSlide, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }, 400);
  }, []);

  const handleGetStarted = () => {
    navigation.navigate('PhoneInput');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
      
      {/* Background Pattern */}
      <View style={styles.backgroundTop}>
        <View style={styles.patternCircle1} />
        <View style={styles.patternCircle2} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.languageButton}>
            <Text style={styles.languageText}>EN</Text>
          </TouchableOpacity>
        </View>

        {/* Logo Section */}
        <View style={styles.logoSection}>
          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: logoOpacity,
                transform: [{ scale: logoScale }],
              },
            ]}
          >
            <View style={styles.logoBox}>
              <Text style={styles.logoText}>W</Text>
            </View>
          </Animated.View>
          
          <Animated.Text
            style={[
              styles.brandName,
              {
                opacity: logoOpacity,
              },
            ]}
          >
            Wasil
          </Animated.Text>
        </View>

        {/* Content Section */}
        <Animated.View
          style={[
            styles.contentSection,
            {
              opacity: contentOpacity,
              transform: [{ translateY: contentSlide }],
            },
          ]}
        >
          <Text style={styles.headline}>
            {t('welcome.headline', { defaultValue: 'Move with ease' })}
          </Text>
          <Text style={styles.subheadline}>
            {t('welcome.subheadline', { defaultValue: 'Request a ride, hop in, and go.' })}
          </Text>

          {/* Features */}
          <View style={styles.features}>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Text style={styles.featureEmoji}>🚗</Text>
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Reliable rides</Text>
                <Text style={styles.featureDesc}>Professional drivers at your service</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Text style={styles.featureEmoji}>💰</Text>
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Transparent pricing</Text>
                <Text style={styles.featureDesc}>Know your fare before you ride</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Text style={styles.featureEmoji}>🔒</Text>
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Safe journeys</Text>
                <Text style={styles.featureDesc}>24/7 safety features & support</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Bottom Section */}
        <Animated.View
          style={[
            styles.bottomSection,
            {
              transform: [{ translateY: buttonSlide }],
            },
          ]}
        >
          <Button
            title={t('welcome.getStarted', { defaultValue: 'Get started' })}
            variant="dark"
            onPress={handleGetStarted}
          />

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>
              {t('welcome.haveAccount', { defaultValue: 'Already have an account?' })}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('PhoneInput')}>
              <Text style={styles.loginLink}>
                {t('welcome.signIn', { defaultValue: 'Sign in' })}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.termsText}>
            {t('welcome.terms', { defaultValue: 'By continuing, you agree to our Terms of Service and Privacy Policy' })}
          </Text>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  safeArea: {
    flex: 1,
  },
  
  // Background
  backgroundTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.4,
    overflow: 'hidden',
  },
  patternCircle1: {
    position: 'absolute',
    top: -100,
    right: -50,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: colors.primary + '08',
  },
  patternCircle2: {
    position: 'absolute',
    top: 50,
    left: -100,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.primary + '05',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  languageButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
  },
  languageText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },

  // Logo
  logoSection: {
    alignItems: 'center',
    marginTop: spacing['3xl'],
    marginBottom: spacing['2xl'],
  },
  logoContainer: {
    marginBottom: spacing.md,
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logoText: {
    fontSize: 48,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  brandName: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    letterSpacing: -1,
  },

  // Content
  contentSection: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  headline: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subheadline: {
    fontSize: typography.fontSize.lg,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: spacing['2xl'],
  },

  // Features
  features: {
    marginTop: spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.base,
  },
  featureEmoji: {
    fontSize: 24,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
  },

  // Bottom
  bottomSection: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['2xl'],
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.base,
  },
  loginText: {
    fontSize: typography.fontSize.md,
    color: colors.textLight,
    marginRight: spacing.xs,
  },
  loginLink: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
  termsText: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default WelcomeScreen;
