/**
 * Wasil Driver - Main App Entry Point
 */

import React, { useEffect } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nextProvider } from 'react-i18next';
import { StatusBar, LogBox, View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';

import store from './src/store/store';
import HomeScreen from './src/screens/home/HomeScreen';
import { i18n, colors, spacing, typography } from '@wasil/shared';
import { PageLoading } from './shared/src/components/Loading';

// Ignore specific warnings in development
LogBox.ignoreLogs([
  'Non-serializable values were found',
  'VirtualizedLists should never be nested',
]);

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

// Placeholder screens
const PlaceholderScreen = ({ route }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ fontSize: 18 }}>{route.name} Screen</Text>
    <Text style={{ fontSize: 14, color: '#666', marginTop: 8 }}>Coming soon...</Text>
  </View>
);

// Drawer Content
const DrawerContent = ({ navigation }) => {
  const menuItems = [
    { icon: '🏠', label: 'Home', route: 'Home' },
    { icon: '💰', label: 'Earnings', route: 'Earnings' },
    { icon: '📜', label: 'Ride History', route: 'RideHistory' },
    { icon: '📄', label: 'Documents', route: 'Documents' },
    { icon: '⚙️', label: 'Settings', route: 'Settings' },
    { icon: '❓', label: 'Help & Support', route: 'Help' },
  ];

  return (
    <View style={drawerStyles.container}>
      <View style={drawerStyles.header}>
        <View style={drawerStyles.avatar}>
          <Text style={drawerStyles.avatarText}>🚗</Text>
        </View>
        <Text style={drawerStyles.name}>Driver Name</Text>
        <Text style={drawerStyles.phone}>+211 9XX XXX XXX</Text>
        <View style={drawerStyles.ratingContainer}>
          <Text style={drawerStyles.rating}>⭐ 4.8</Text>
        </View>
      </View>

      <View style={drawerStyles.menu}>
        {menuItems.map((item, index) => (
          <View
            key={index}
            style={drawerStyles.menuItem}
          >
            <Text style={drawerStyles.menuIcon}>{item.icon}</Text>
            <Text style={drawerStyles.menuLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      <View style={drawerStyles.footer}>
        <View style={drawerStyles.logoutButton}>
          <Text style={drawerStyles.logoutText}>🚪 Logout</Text>
        </View>
        <Text style={drawerStyles.version}>Wasil Driver v1.0.0</Text>
      </View>
    </View>
  );
};

const drawerStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    backgroundColor: '#00A86B',
    padding: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 32 },
  name: { fontSize: 18, fontWeight: '600', color: '#fff' },
  phone: { fontSize: 14, color: '#fff', opacity: 0.8, marginTop: 4 },
  ratingContainer: {
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  rating: { color: '#fff', fontSize: 14, fontWeight: '600' },
  menu: { flex: 1, paddingTop: 16 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  menuIcon: { fontSize: 20, marginRight: 16 },
  menuLabel: { fontSize: 16, color: '#333' },
  footer: { padding: 24, borderTopWidth: 1, borderTopColor: '#eee' },
  logoutButton: { paddingVertical: 12 },
  logoutText: { fontSize: 16, color: '#E31C23' },
  version: { fontSize: 12, color: '#999', marginTop: 12, textAlign: 'center' },
});

// Main Stack Navigator
const MainStackNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Home" component={HomeScreen} />
    <Stack.Screen name="Earnings" component={PlaceholderScreen} />
    <Stack.Screen name="RideHistory" component={PlaceholderScreen} />
    <Stack.Screen name="RideNavigation" component={PlaceholderScreen} />
    <Stack.Screen name="RideComplete" component={PlaceholderScreen} />
  </Stack.Navigator>
);

// Main Drawer Navigator
const MainNavigator = () => (
  <Drawer.Navigator
    drawerContent={(props) => <DrawerContent {...props} />}
    screenOptions={{
      headerShown: false,
      drawerType: 'front',
      drawerStyle: { width: 300 },
    }}
  >
    <Drawer.Screen name="MainStack" component={MainStackNavigator} />
  </Drawer.Navigator>
);

// App Navigator
const AppNavigator = () => {
  // In production, check auth status here
  const isAuthenticated = true; // For demo

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const App = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <SafeAreaProvider>
          <I18nextProvider i18n={i18n}>
            <StatusBar
              barStyle="dark-content"
              backgroundColor="transparent"
              translucent
            />
            <AppNavigator />
          </I18nextProvider>
        </SafeAreaProvider>
      </Provider>
    </GestureHandlerRootView>
  );
};

export default App;
