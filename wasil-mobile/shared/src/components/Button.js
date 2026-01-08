/**
 * Wasil Button Component - Uber-Inspired Design
 * Clean, modern buttons with maroon theme
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme';

/**
 * Button variants:
 * - primary: Maroon background (main CTA)
 * - dark: Black background (Uber-style)
 * - secondary: Light gray background
 * - outline: Transparent with border
 * - ghost: Text only
 */

const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'large',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = true,
  style,
  textStyle,
  ...props
}) => {
  const getButtonStyles = () => {
    const baseStyle = [styles.button, styles[size]];
    
    if (fullWidth) {
      baseStyle.push(styles.fullWidth);
    }
    
    switch (variant) {
      case 'primary':
        baseStyle.push(styles.primary);
        if (disabled) baseStyle.push(styles.primaryDisabled);
        break;
      case 'dark':
        baseStyle.push(styles.dark);
        if (disabled) baseStyle.push(styles.darkDisabled);
        break;
      case 'secondary':
        baseStyle.push(styles.secondary);
        if (disabled) baseStyle.push(styles.secondaryDisabled);
        break;
      case 'outline':
        baseStyle.push(styles.outline);
        if (disabled) baseStyle.push(styles.outlineDisabled);
        break;
      case 'ghost':
        baseStyle.push(styles.ghost);
        break;
      default:
        baseStyle.push(styles.primary);
    }
    
    return baseStyle;
  };

  const getTextStyles = () => {
    const baseTextStyle = [styles.text, styles[`${size}Text`]];
    
    switch (variant) {
      case 'primary':
      case 'dark':
        baseTextStyle.push(styles.lightText);
        break;
      case 'secondary':
        baseTextStyle.push(styles.darkText);
        break;
      case 'outline':
        baseTextStyle.push(styles.darkText);
        break;
      case 'ghost':
        baseTextStyle.push(styles.primaryText);
        break;
      default:
        baseTextStyle.push(styles.lightText);
    }
    
    if (disabled) {
      baseTextStyle.push(styles.disabledText);
    }
    
    return baseTextStyle;
  };

  return (
    <TouchableOpacity
      style={[...getButtonStyles(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'secondary' || variant === 'outline' ? colors.primary : colors.white}
          size="small"
        />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' && (
            <View style={styles.iconLeft}>{icon}</View>
          )}
          <Text style={[...getTextStyles(), textStyle]}>{title}</Text>
          {icon && iconPosition === 'right' && (
            <View style={styles.iconRight}>{icon}</View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Sizes
  small: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    minHeight: 36,
  },
  medium: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 44,
  },
  large: {
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xl,
    minHeight: 52,
  },
  
  // Variants
  primary: {
    backgroundColor: colors.primary, // Maroon
  },
  primaryDisabled: {
    backgroundColor: colors.primary + '60',
  },
  
  dark: {
    backgroundColor: colors.black, // Uber-style black
  },
  darkDisabled: {
    backgroundColor: colors.black + '60',
  },
  
  secondary: {
    backgroundColor: colors.surface,
  },
  secondaryDisabled: {
    backgroundColor: colors.surfaceDark,
  },
  
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  outlineDisabled: {
    borderColor: colors.border + '60',
  },
  
  ghost: {
    backgroundColor: 'transparent',
  },
  
  // Text styles
  text: {
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
  },
  smallText: {
    fontSize: typography.fontSize.sm,
  },
  mediumText: {
    fontSize: typography.fontSize.md,
  },
  largeText: {
    fontSize: typography.fontSize.base,
  },
  
  lightText: {
    color: colors.white,
  },
  darkText: {
    color: colors.text,
  },
  primaryText: {
    color: colors.primary,
  },
  disabledText: {
    opacity: 0.5,
  },
  
  // Icons
  iconLeft: {
    marginRight: spacing.sm,
  },
  iconRight: {
    marginLeft: spacing.sm,
  },
});

export default Button;
