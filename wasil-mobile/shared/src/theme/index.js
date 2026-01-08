/**
 * Wasil Theme - Uber-Inspired Design with Maroon
 * Clean, modern, and professional
 */

// ============================================
// COLOR PALETTE - Maroon Theme (Uber-Inspired)
// ============================================

export const colors = {
  // Primary - Maroon
  primary: '#800020',          // Maroon (main brand color)
  primaryLight: '#A33447',     // Lighter maroon
  primaryDark: '#5C0015',      // Darker maroon
  
  // Secondary - Gold accent
  secondary: '#C9A227',        // Gold accent
  secondaryLight: '#E4C654',   // Light gold
  
  // Uber-like neutrals
  black: '#000000',            // Pure black (Uber style)
  white: '#FFFFFF',
  
  // Backgrounds (Uber-like clean whites/grays)
  background: '#FFFFFF',       // Clean white background
  surface: '#F6F6F6',          // Light gray surface
  surfaceDark: '#EEEEEE',      // Darker surface
  
  // Text colors (Uber-style high contrast)
  text: '#000000',             // Pure black text
  textSecondary: '#545454',    // Secondary text
  textLight: '#757575',        // Light text
  textMuted: '#9E9E9E',        // Muted text
  
  // Status colors
  success: '#34A853',          // Google green
  warning: '#FBBC04',          // Google yellow
  error: '#EA4335',            // Google red
  info: '#4285F4',             // Google blue
  
  // UI elements
  border: '#E8E8E8',           // Light border
  divider: '#F0F0F0',          // Divider lines
  overlay: 'rgba(0, 0, 0, 0.5)', // Modal overlay
  
  // Ride type colors
  bodaBoda: '#FF6B6B',         // Motorcycle - Red
  standard: '#800020',         // Standard - Maroon
  premium: '#C9A227',          // Premium - Gold
  
  // Wasil specific
  rating: '#FFB800',           // Star rating gold
  online: '#34A853',           // Driver online
  offline: '#757575',          // Driver offline
};

// ============================================
// TYPOGRAPHY - Uber-Style Clean Fonts
// ============================================

export const typography = {
  // Font families (use system fonts for better performance)
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },
  
  // Font sizes (Uber-style hierarchy)
  fontSize: {
    xs: 11,
    sm: 13,
    md: 14,
    base: 15,
    lg: 17,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    hero: 48,
  },
  
  // Font weights
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  
  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
};

// ============================================
// SPACING - 8pt Grid System (Uber-style)
// ============================================

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
};

// ============================================
// BORDER RADIUS - Modern Rounded Corners
// ============================================

export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
};

// ============================================
// SHADOWS - Subtle Uber-Style Elevation
// ============================================

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  // Card shadow (floating cards like Uber)
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  // Bottom sheet shadow
  bottomSheet: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 12,
  },
};

// ============================================
// BUTTON STYLES - Uber-Like Buttons
// ============================================

export const buttonStyles = {
  primary: {
    backgroundColor: colors.primary,
    textColor: colors.white,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xl,
  },
  secondary: {
    backgroundColor: colors.surface,
    textColor: colors.text,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xl,
  },
  outline: {
    backgroundColor: 'transparent',
    textColor: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xl,
  },
  text: {
    backgroundColor: 'transparent',
    textColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  // Uber-style black button
  dark: {
    backgroundColor: colors.black,
    textColor: colors.white,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xl,
  },
};

// ============================================
// INPUT STYLES - Clean Input Fields
// ============================================

export const inputStyles = {
  default: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.base,
    fontSize: typography.fontSize.base,
    color: colors.text,
  },
  outlined: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.base,
    fontSize: typography.fontSize.base,
    color: colors.text,
  },
  focused: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  error: {
    borderColor: colors.error,
    borderWidth: 1,
  },
};

// ============================================
// CARD STYLES - Uber-Style Cards
// ============================================

export const cardStyles = {
  default: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    ...shadows.card,
  },
  flat: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
  },
  outlined: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.base,
  },
};

// ============================================
// RIDE TYPE STYLES
// ============================================

export const rideTypeStyles = {
  boda_boda: {
    color: colors.bodaBoda,
    backgroundColor: colors.bodaBoda + '15',
    icon: '🏍️',
    label: 'Boda Boda',
  },
  standard: {
    color: colors.primary,
    backgroundColor: colors.primary + '15',
    icon: '🚗',
    label: 'Wasil X',
  },
  premium: {
    color: colors.secondary,
    backgroundColor: colors.secondary + '15',
    icon: '🚙',
    label: 'Wasil Premium',
  },
};

// ============================================
// ANIMATION TIMINGS (Uber-style snappy)
// ============================================

export const animation = {
  fast: 150,
  normal: 250,
  slow: 400,
  easing: {
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
};

// ============================================
// Z-INDEX LAYERS
// ============================================

export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  overlay: 30,
  modal: 40,
  popover: 50,
  toast: 60,
};

// ============================================
// DEFAULT EXPORT
// ============================================

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  buttonStyles,
  inputStyles,
  cardStyles,
  rideTypeStyles,
  animation,
  zIndex,
};
