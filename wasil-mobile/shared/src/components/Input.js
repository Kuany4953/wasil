/**
 * Wasil Mobile - Input Component
 * Text input with phone number support
 */

import React, { useState, forwardRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '../theme';

const Input = forwardRef(({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  helperText,
  leftIcon,
  rightIcon,
  onRightIconPress,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  maxLength,
  multiline = false,
  numberOfLines = 1,
  editable = true,
  style,
  inputStyle,
  containerStyle,
  // Phone input specific
  isPhoneInput = false,
  countryCode = '+211',
  onCountryCodePress,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);

  const getBorderColor = () => {
    if (error) return colors.error;
    if (isFocused) return colors.primary;
    return colors.border;
  };

  const renderPhoneInput = () => (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View
        style={[
          styles.inputContainer,
          { borderColor: getBorderColor() },
          error && styles.inputError,
          !editable && styles.inputDisabled,
        ]}
      >
        <TouchableOpacity
          style={styles.countryCodeContainer}
          onPress={onCountryCodePress}
          disabled={!onCountryCodePress}
        >
          <Text style={styles.countryCode}>{countryCode}</Text>
          {onCountryCodePress && (
            <Text style={styles.dropdownIcon}>▼</Text>
          )}
        </TouchableOpacity>
        
        <View style={styles.phoneDivider} />
        
        <TextInput
          ref={ref}
          style={[styles.input, styles.phoneInput, inputStyle]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder || '9XX XXX XXX'}
          placeholderTextColor={colors.textMuted}
          keyboardType="phone-pad"
          maxLength={maxLength || 9}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          editable={editable}
          {...props}
        />
      </View>
      
      {(error || helperText) && (
        <Text style={[styles.helperText, error && styles.errorText]}>
          {error || helperText}
        </Text>
      )}
    </View>
  );

  if (isPhoneInput) {
    return renderPhoneInput();
  }

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View
        style={[
          styles.inputContainer,
          { borderColor: getBorderColor() },
          error && styles.inputError,
          !editable && styles.inputDisabled,
          multiline && styles.multilineContainer,
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        
        <TextInput
          ref={ref}
          style={[
            styles.input,
            leftIcon && styles.inputWithLeftIcon,
            rightIcon && styles.inputWithRightIcon,
            multiline && styles.multilineInput,
            inputStyle,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          editable={editable}
          textAlignVertical={multiline ? 'top' : 'center'}
          {...props}
        />
        
        {rightIcon && (
          <TouchableOpacity
            style={styles.rightIcon}
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      
      {(error || helperText) && (
        <Text style={[styles.helperText, error && styles.errorText]}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.base,
  },
  label: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    height: 52,
    paddingHorizontal: spacing.base,
  },
  multilineContainer: {
    height: 'auto',
    minHeight: 100,
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.text,
    height: '100%',
  },
  inputWithLeftIcon: {
    paddingLeft: spacing.sm,
  },
  inputWithRightIcon: {
    paddingRight: spacing.sm,
  },
  multilineInput: {
    height: 'auto',
    minHeight: 80,
  },
  inputError: {
    borderColor: colors.error,
    borderWidth: 1.5,
  },
  inputDisabled: {
    backgroundColor: colors.surface,
    opacity: 0.7,
  },
  leftIcon: {
    marginRight: spacing.sm,
  },
  rightIcon: {
    marginLeft: spacing.sm,
    padding: spacing.xs,
  },
  helperText: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    marginTop: spacing.xs,
  },
  errorText: {
    color: colors.error,
  },
  
  // Phone input specific
  countryCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.md,
  },
  countryCode: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
  },
  dropdownIcon: {
    fontSize: 10,
    color: colors.textLight,
    marginLeft: spacing.xs,
  },
  phoneDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
    marginRight: spacing.md,
  },
  phoneInput: {
    letterSpacing: 1,
  },
});

export default Input;
