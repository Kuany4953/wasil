/**
 * Wasil Rider - App Navigator
 * Main navigation configuration
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
import { colors, spacing, typography, borderRadius } from '@wasil/shared';

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
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
    <Text style={{ fontSize: 24, marginBottom: 8 }}>🚧</Text>
    <Text style={{ fontSize: 18, fontWeight: '600', color: '#333' }}>{route.name}</Text>
    <Text style={{ fontSize: 14, color: '#666', marginTop: 8 }}>Coming soon...</Text>
  </View>
);

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
    { icon: '🏠', label: 'Home', route: 'Home' },
    { icon: '📜', label: 'Ride History', route: 'RideHistory' },
    { icon: '💳', label: 'Payment Methods', route: 'PaymentMethods' },
    { icon: '📍', label: 'Saved Places', route: 'SavedPlaces' },
    { icon: '⚙️', label: 'Settings', route: 'Settings' },
    { icon: '❓', label: 'Help & Support', route: 'Help' },
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
    return '👤';
  };

  return (
    <View style={drawerStyles.container}>
      {/* Profile Header */}
      <View style={drawerStyles.header}>
        <TouchableOpacity
          style={drawerStyles.profileSection}
          onPress={() => handleNavigation('Profile')}
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
                <Text style={drawerStyles.ratingText}>⭐ {user.rating.toFixed(1)}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={drawerStyles.editButton}
          onPress={() => handleNavigation('Profile')}
        >
          <Text style={drawerStyles.editText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* Menu Items */}
      <View style={drawerStyles.menu}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={drawerStyles.menuItem}
            onPress={() => handleNavigation(item.route)}
          >
            <Text style={drawerStyles.menuIcon}>{item.icon}</Text>
            <Text style={drawerStyles.menuLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Footer */}
      <View style={drawerStyles.footer}>
        <TouchableOpacity style={drawerStyles.logoutButton} onPress={handleLogout}>
          <Text style={drawerStyles.logoutIcon}>🚪</Text>
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
  header: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    paddingTop: 60,
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
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.base,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  phone: {
    fontSize: typography.fontSize.sm,
    color: colors.white,
    opacity: 0.8,
    marginTop: 2,
  },
  ratingBadge: {
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
  },
  ratingText: {
    fontSize: typography.fontSize.sm,
    color: colors.white,
    fontWeight: typography.fontWeight.medium,
  },
  editButton: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: borderRadius.full,
  },
  editText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  menu: {
    flex: 1,
    paddingTop: spacing.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xl,
  },
  menuIcon: {
    fontSize: 22,
    marginRight: spacing.base,
    width: 30,
    textAlign: 'center',
  },
  menuLabel: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  footer: {
    padding: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  logoutIcon: {
    fontSize: 20,
    marginRight: spacing.base,
  },
  logoutText: {
    fontSize: typography.fontSize.base,
    color: colors.error,
    fontWeight: typography.fontWeight.medium,
  },
  version: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.lg,
    textAlign: 'center',
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
