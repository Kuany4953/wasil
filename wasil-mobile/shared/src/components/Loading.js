/**
 * Wasil Mobile - Loading Components
 * Various loading states and indicators
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Modal,
  Dimensions,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../theme';

const { width } = Dimensions.get('window');

/**
 * Simple loading spinner
 */
export const LoadingSpinner = ({ 
  size = 'large', 
  color = colors.primary,
  style 
}) => (
  <ActivityIndicator size={size} color={color} style={style} />
);

/**
 * Full screen loading overlay
 */
export const LoadingOverlay = ({ 
  visible, 
  message = 'Loading...', 
  transparent = true 
}) => (
  <Modal
    visible={visible}
    transparent={transparent}
    animationType="fade"
    statusBarTranslucent
  >
    <View style={styles.overlayContainer}>
      <View style={styles.overlayContent}>
        <ActivityIndicator size="large" color={colors.primary} />
        {message && <Text style={styles.overlayMessage}>{message}</Text>}
      </View>
    </View>
  </Modal>
);

/**
 * Finding Driver Animation
 */
export const FindingDriverLoader = ({ message = 'Finding you a driver...' }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    // Rotation animation
    const rotate = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    );

    pulse.start();
    rotate.start();

    return () => {
      pulse.stop();
      rotate.stop();
    };
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.findingContainer}>
      <Animated.View
        style={[
          styles.radarContainer,
          {
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <View style={styles.radarOuter} />
        <View style={styles.radarMiddle} />
        <View style={styles.radarInner} />
        <Animated.View
          style={[
            styles.radarLine,
            { transform: [{ rotate: spin }] },
          ]}
        />
        <Text style={styles.carIcon}>🚗</Text>
      </Animated.View>
      
      <Text style={styles.findingMessage}>{message}</Text>
      
      <View style={styles.dotsContainer}>
        <PulsingDots />
      </View>
    </View>
  );
};

/**
 * Pulsing dots animation
 */
const PulsingDots = () => {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animateDot = (dot, delay) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const anim1 = animateDot(dot1, 0);
    const anim2 = animateDot(dot2, 200);
    const anim3 = animateDot(dot3, 400);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, []);

  return (
    <View style={styles.dots}>
      <Animated.View style={[styles.dot, { opacity: dot1 }]} />
      <Animated.View style={[styles.dot, { opacity: dot2 }]} />
      <Animated.View style={[styles.dot, { opacity: dot3 }]} />
    </View>
  );
};

/**
 * Skeleton loading placeholder
 */
export const Skeleton = ({ 
  width: w = '100%', 
  height: h = 20, 
  borderRadius: br = borderRadius.sm,
  style 
}) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width: w, height: h, borderRadius: br, opacity },
        style,
      ]}
    />
  );
};

/**
 * Card skeleton for ride history
 */
export const RideCardSkeleton = () => (
  <View style={styles.cardSkeleton}>
    <View style={styles.cardSkeletonHeader}>
      <Skeleton width={40} height={40} borderRadius={20} />
      <View style={styles.cardSkeletonInfo}>
        <Skeleton width={120} height={16} />
        <Skeleton width={80} height={12} style={{ marginTop: 4 }} />
      </View>
      <Skeleton width={60} height={20} />
    </View>
    <View style={styles.cardSkeletonBody}>
      <Skeleton width="70%" height={14} />
      <Skeleton width="50%" height={14} style={{ marginTop: 8 }} />
    </View>
  </View>
);

/**
 * Page loading state
 */
export const PageLoading = ({ message }) => (
  <View style={styles.pageLoading}>
    <LoadingSpinner size="large" />
    {message && <Text style={styles.pageLoadingMessage}>{message}</Text>}
  </View>
);

const styles = StyleSheet.create({
  // Overlay
  overlayContainer: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayContent: {
    backgroundColor: colors.white,
    padding: spacing['2xl'],
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    minWidth: 150,
  },
  overlayMessage: {
    marginTop: spacing.base,
    fontSize: typography.fontSize.base,
    color: colors.text,
    textAlign: 'center',
  },

  // Finding Driver
  findingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['2xl'],
  },
  radarContainer: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radarOuter: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
    borderColor: colors.primary + '20',
  },
  radarMiddle: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: colors.primary + '40',
  },
  radarInner: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary + '20',
    borderWidth: 2,
    borderColor: colors.primary + '60',
  },
  radarLine: {
    position: 'absolute',
    width: 2,
    height: 75,
    backgroundColor: colors.primary,
    top: 0,
    left: '50%',
    marginLeft: -1,
    transformOrigin: 'bottom',
  },
  carIcon: {
    fontSize: 30,
    position: 'absolute',
  },
  findingMessage: {
    marginTop: spacing.xl,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    textAlign: 'center',
  },
  dotsContainer: {
    marginTop: spacing.base,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginHorizontal: 4,
  },

  // Skeleton
  skeleton: {
    backgroundColor: colors.border,
  },
  cardSkeleton: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.md,
  },
  cardSkeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardSkeletonInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  cardSkeletonBody: {
    marginTop: spacing.base,
  },

  // Page Loading
  pageLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  pageLoadingMessage: {
    marginTop: spacing.base,
    fontSize: typography.fontSize.base,
    color: colors.textLight,
  },
});

export default {
  LoadingSpinner,
  LoadingOverlay,
  FindingDriverLoader,
  Skeleton,
  RideCardSkeleton,
  PageLoading,
};
