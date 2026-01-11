/**
 * Wasil Rider - App Navigator
 * Main navigation configuration - Professional Design
 */

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useDispatch, useSelector } from 'react-redux';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

import {
  selectIsAuthenticated,
  selectIsInitialized,
  selectUser,
  initializeAuth,
  logout,
} from '../store/slices/authSlice';

import { PageLoading } from '../../../shared/src/components/Loading';
import { colors, spacing, typography, borderRadius, shadows } from '@wasil/shared';

// Auth Screens
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import PhoneInputScreen from '../screens/auth/PhoneInputScreen';
import OTPScreen from '../screens/auth/OTPScreen';
import ProfileSetupScreen from '../screens/auth/ProfileSetupScreen';

// Main Screens
import HomeScreen from '../screens/home/HomeScreen';

// Ride Screens
import SearchLocationScreen from '../screens/ride/SearchLocationScreen';
import RideConfirmScreen from '../screens/ride/RideConfirmScreen';
import FindingDriverScreen from '../screens/ride/FindingDriverScreen';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

// Placeholder screen for development
const PlaceholderScreen = ({ route }) => (
  <View style={placeholderStyles.container}>
    <View style={placeholderStyles.iconContainer}>
      <View style={placeholderStyles.icon} />
    </View>
    <Text style={placeholderStyles.title}>{route.name}</Text>
    <Text style={placeholderStyles.subtitle}>This feature is coming soon</Text>
  </View>
);

const placeholderStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: spacing.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: '700',
    color: '#111827',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    color: '#6B7280',
    fontWeight: '500',
  },
});

// Auth Stack Navigator
const AuthNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: 'white' },
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="PhoneInput" component={PhoneInputScreen} />
      <Stack.Screen name="OTP" component={OTPScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
    </Stack.Navigator>
  );
};

// Main Stack Navigator (inside drawer)
const MainStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="SearchLocation" component={SearchLocationScreen} />
      <Stack.Screen name="RideConfirm" component={RideConfirmScreen} />
      <Stack.Screen name="FindingDriver" component={FindingDriverScreen} />
      <Stack.Screen name="RideTracking" component={PlaceholderScreen} />
      <Stack.Screen name="RideComplete" component={PlaceholderScreen} />
      <Stack.Screen name="RideHistory" component={PlaceholderScreen} />
      <Stack.Screen name="PaymentMethods" component={PlaceholderScreen} />
      <Stack.Screen name="SavedPlaces" component={PlaceholderScreen} />
      <Stack.Screen name="Profile" component={PlaceholderScreen} />
      <Stack.Screen name="Settings" component={PlaceholderScreen} />
      <Stack.Screen name="Help" component={PlaceholderScreen} />
      <Stack.Screen name="SOS" component={PlaceholderScreen} />
    </Stack.Navigator>
  );
};

// Drawer Content Component
const DrawerContent = ({ navigation }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  const menuItems = [
    { icon: 'home', label: 'Home', route: 'Home' },
    { icon: 'history', label: 'Ride History', route: 'RideHistory' },
    { icon: 'payment', label: 'Payment Methods', route: 'PaymentMethods' },
    { icon: 'location', label: 'Saved Places', route: 'SavedPlaces' },
    { icon: 'settings', label: 'Settings', route: 'Settings' },
    { icon: 'help', label: 'Help & Support', route: 'Help' },
  ];

  const handleNavigation = (route) => {
    navigation.closeDrawer();
    if (route === 'Home') {
      navigation.navigate('MainStack', { screen: 'Home' });
    } else {
      navigation.navigate('MainStack', { screen: route });
    }
  };

  const handleLogout = async () => {
    navigation.closeDrawer();
    await dispatch(logout());
  };

  const getInitials = () => {
    if (user?.first_name) {
      return user.first_name[0].toUpperCase();
    }
    return 'R';
  };

  const renderIcon = (iconType) => {
    const iconMap = {
      home: <View style={drawerStyles.homeIcon} />,
      history: <View style={drawerStyles.historyIcon} />,
      payment: <View style={drawerStyles.paymentIcon} />,
      location: <View style={drawerStyles.locationIcon} />,
      settings: <View style={drawerStyles.settingsIcon} />,
      help: <View style={drawerStyles.helpIcon} />,
    };

    return (
      <View style={drawerStyles.menuIconContainer}>
        {iconMap[iconType] || <View style={drawerStyles.defaultIcon} />}
      </View>
    );
  };

  return (
    <View style={drawerStyles.container}>
      {/* Profile Header */}
      <View style={drawerStyles.header}>
        <TouchableOpacity
          style={drawerStyles.profileSection}
          onPress={() => handleNavigation('Profile')}
          activeOpacity={0.8}
        >
          <View style={drawerStyles.avatar}>
            <Text style={drawerStyles.avatarText}>{getInitials()}</Text>
          </View>
          <View style={drawerStyles.profileInfo}>
            <Text style={drawerStyles.name}>
              {user?.first_name || 'Guest'} {user?.last_name || ''}
            </Text>
            <Text style={drawerStyles.phone}>{user?.phone || ''}</Text>
            {user?.rating && (
              <View style={drawerStyles.ratingBadge}>
                <View style={drawerStyles.starIconSmall} />
                <Text style={drawerStyles.ratingText}>{user.rating.toFixed(1)}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={drawerStyles.editButton}
          onPress={() => handleNavigation('Profile')}
          activeOpacity={0.8}
        >
          <View style={drawerStyles.editIcon} />
        </TouchableOpacity>
      </View>

      {/* Menu Items */}
      <View style={drawerStyles.menu}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={drawerStyles.menuItem}
            onPress={() => handleNavigation(item.route)}
            activeOpacity={0.7}
          >
            {renderIcon(item.icon)}
            <Text style={drawerStyles.menuLabel}>{item.label}</Text>
            <View style={drawerStyles.chevronRight} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Footer */}
      <View style={drawerStyles.footer}>
        <TouchableOpacity 
          style={drawerStyles.logoutButton} 
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <View style={drawerStyles.logoutIconContainer}>
            <View style={drawerStyles.logoutIcon} />
          </View>
          <Text style={drawerStyles.logoutText}>Logout</Text>
        </TouchableOpacity>
        <Text style={drawerStyles.version}>Wasil Rider v1.0.0</Text>
      </View>
    </View>
  );
};

const drawerStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },

  // Header
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing['3xl'] + spacing.xl,
    paddingBottom: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    ...shadows.md,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  phone: {
    fontSize: typography.fontSize.sm,
    color: colors.white,
    opacity: 0.9,
    fontWeight: '500',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  starIconSmall: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FCD34D',
    transform: [{ rotate: '35deg' }],
    marginRight: spacing.xs,
  },
  ratingText: {
    fontSize: typography.fontSize.sm,
    color: colors.white,
    fontWeight: '700',
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIcon: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    borderColor: colors.white,
    borderRadius: 2,
  },

  // Menu
  menu: {
    flex: 1,
    paddingTop: spacing.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xl,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  menuLabel: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: '#374151',
    fontWeight: '600',
  },
  chevronRight: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderTopWidth: 5,
    borderBottomWidth: 5,
    borderLeftWidth: 7,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#D1D5DB',
  },

  // Menu Icons
  homeIcon: {
    width: 20,
    height: 18,
    backgroundColor: colors.primary,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  historyIcon: {
    width: 18,
    height: 18,
    borderRadius: 2,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  paymentIcon: {
    width: 18,
    height: 14,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  locationIcon: {
    width: 14,
    height: 20,
    borderRadius: 7,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: 2,
    borderColor: colors.primary,
    borderBottomWidth: 0,
  },
  settingsIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  helpIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  defaultIcon: {
    width: 18,
    height: 18,
    backgroundColor: colors.primary,
    borderRadius: 4,
  },

  // Footer
  footer: {
    padding: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  logoutIconContainer: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  logoutIcon: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderTopWidth: 7,
    borderBottomWidth: 7,
    borderLeftWidth: 10,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#EF4444',
  },
  logoutText: {
    fontSize: typography.fontSize.md,
    color: '#EF4444',
    fontWeight: '600',
  },
  version: {
    fontSize: typography.fontSize.xs,
    color: '#9CA3AF',
    marginTop: spacing.md,
    textAlign: 'center',
    fontWeight: '500',
  },
});

// Main Drawer Navigator
const MainNavigator = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: {
          width: 300,
        },
      }}
    >
      <Drawer.Screen name="MainStack" component={MainStackNavigator} />
    </Drawer.Navigator>
  );
};

// Root App Navigator
const AppNavigator = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isInitialized = useSelector(selectIsInitialized);
  const user = useSelector(selectUser);

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  if (!isInitialized) {
    return <PageLoading message="Loading..." />;
  }

  // Check if user needs to complete profile (is_new_user flag from backend)
  const needsProfileSetup = isAuthenticated && user?.is_new_user;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          needsProfileSetup ? (
            <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
          ) : (
            <Stack.Screen name="Main" component={MainNavigator} />
          )
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
