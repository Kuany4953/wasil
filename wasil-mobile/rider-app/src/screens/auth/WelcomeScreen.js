/**
 * Wasil Rider - Welcome Screen
 * Professional Clean Design - Uber-Inspired
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
  const featureAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    // Logo animation
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 40,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Content animation (delayed)
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(contentSlide, {
          toValue: 0,
          tension: 40,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }, 200);

    // Feature items animation (staggered)
    featureAnims.forEach((anim, index) => {
      Animated.spring(anim, {
        toValue: 1,
        tension: 40,
        friction: 7,
        delay: 400 + (index * 100),
        useNativeDriver: true,
      }).start();
    });

    // Button animation (delayed)
    setTimeout(() => {
      Animated.spring(buttonSlide, {
        toValue: 0,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }, 600);
  }, []);

  const handleGetStarted = () => {
    navigation.navigate('PhoneInput');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Background Pattern */}
      <View style={styles.backgroundTop}>
        <View style={styles.patternCircle1} />
        <View style={styles.patternCircle2} />
        <View style={styles.patternCircle3} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.languageButton} activeOpacity={0.7}>
            <View style={styles.globeIcon} />
            <Text style={styles.languageText}>EN</Text>
            <View style={styles.dropdownArrow} />
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
            <View style={styles.logoGlow} />
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
          <Animated.Text
            style={[
              styles.brandTagline,
              {
                opacity: logoOpacity,
              },
            ]}
          >
            Your trusted ride partner
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
            {/* Feature 1: Reliable Rides */}
            <Animated.View
              style={[
                styles.featureItem,
                {
                  opacity: featureAnims[0],
                  transform: [
                    {
                      translateX: featureAnims[0].interpolate({
                        inputRange: [0, 1],
                        outputRange: [-20, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={[styles.featureIconContainer, { backgroundColor: colors.primary + '15' }]}>
                <View style={styles.carIcon} />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Reliable rides</Text>
                <Text style={styles.featureDesc}>Professional drivers at your service</Text>
              </View>
            </Animated.View>

            {/* Feature 2: Transparent Pricing */}
            <Animated.View
              style={[
                styles.featureItem,
                {
                  opacity: featureAnims[1],
                  transform: [
                    {
                      translateX: featureAnims[1].interpolate({
                        inputRange: [0, 1],
                        outputRange: [-20, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={[styles.featureIconContainer, { backgroundColor: '#FEF3C7' }]}>
                <View style={styles.dollarIcon} />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Transparent pricing</Text>
                <Text style={styles.featureDesc}>Know your fare before you ride</Text>
              </View>
            </Animated.View>

            {/* Feature 3: Safe Journeys */}
            <Animated.View
              style={[
                styles.featureItem,
                {
                  opacity: featureAnims[2],
                  transform: [
                    {
                      translateX: featureAnims[2].interpolate({
                        inputRange: [0, 1],
                        outputRange: [-20, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={[styles.featureIconContainer, { backgroundColor: '#DBEAFE' }]}>
                <View style={styles.shieldIcon} />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Safe journeys</Text>
                <Text style={styles.featureDesc}>24/7 safety features & support</Text>
              </View>
            </Animated.View>
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
            <TouchableOpacity 
              onPress={() => navigation.navigate('PhoneInput')}
              activeOpacity={0.7}
            >
              <Text style={styles.loginLink}>
                {t('welcome.signIn', { defaultValue: 'Sign in' })}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.termsContainer}>
            <View style={styles.lockIconSmall} />
            <Text style={styles.termsText}>
              {t('welcome.terms', { defaultValue: 'By continuing, you agree to our Terms of Service and Privacy Policy' })}
            </Text>
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    height: height * 0.5,
    overflow: 'hidden',
  },
  patternCircle1: {
    position: 'absolute',
    top: -120,
    right: -60,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: colors.primary + '08',
  },
  patternCircle2: {
    position: 'absolute',
    top: 60,
    left: -120,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: colors.primary + '05',
  },
  patternCircle3: {
    position: 'absolute',
    top: -40,
    right: 40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.primary + '03',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    backgroundColor: '#F3F4F6',
    borderRadius: borderRadius.full,
  },
  globeIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#6B7280',
    marginRight: spacing.xs,
  },
  languageText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: '#111827',
    marginRight: spacing.xs,
  },
  dropdownArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderTopWidth: 4,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderTopColor: '#6B7280',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },

  // Logo
  logoSection: {
    alignItems: 'center',
    marginTop: spacing['3xl'],
    marginBottom: spacing['2xl'],
  },
  logoContainer: {
    marginBottom: spacing.md,
    position: 'relative',
  },
  logoBox: {
    width: 96,
    height: 96,
    borderRadius: borderRadius['2xl'],
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  logoGlow: {
    position: 'absolute',
    width: 116,
    height: 116,
    borderRadius: borderRadius['2xl'],
    backgroundColor: colors.primary + '20',
    top: -10,
    left: -10,
    zIndex: -1,
  },
  logoText: {
    fontSize: 56,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -2,
  },
  brandName: {
    fontSize: 40,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -1.5,
    marginBottom: spacing.xs,
  },
  brandTagline: {
    fontSize: typography.fontSize.sm,
    color: '#6B7280',
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // Content
  contentSection: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  headline: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },
  subheadline: {
    fontSize: typography.fontSize.lg,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: spacing['2xl'],
    fontWeight: '500',
    lineHeight: 28,
  },

  // Features
  features: {
    marginTop: spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    backgroundColor: '#F9FAFB',
    padding: spacing.base,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  featureIconContainer: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.base,
  },
  carIcon: {
    width: 24,
    height: 16,
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  dollarIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2.5,
    borderColor: '#F59E0B',
  },
  shieldIcon: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderTopWidth: 20,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#3B82F6',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  featureDesc: {
    fontSize: typography.fontSize.sm,
    color: '#6B7280',
    fontWeight: '500',
    lineHeight: 20,
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
    marginBottom: spacing.lg,
  },
  loginText: {
    fontSize: typography.fontSize.md,
    color: '#6B7280',
    marginRight: spacing.xs,
    fontWeight: '500',
  },
  loginLink: {
    fontSize: typography.fontSize.md,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.2,
  },
  termsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.md,
  },
  lockIconSmall: {
    width: 10,
    height: 12,
    borderRadius: 2,
    borderWidth: 1.5,
    borderColor: '#9CA3AF',
    borderTopWidth: 0,
    marginRight: spacing.xs,
    marginTop: 2,
  },
  termsText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '500',
  },
});

export default WelcomeScreen;

