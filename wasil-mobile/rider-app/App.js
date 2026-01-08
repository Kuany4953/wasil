/**
 * Wasil Rider - Main App Entry Point
 */

import React from 'react';
import { Provider } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nextProvider } from 'react-i18next';
import { StatusBar, LogBox } from 'react-native';

import store from './src/store/store';
import AppNavigator from './src/navigation/AppNavigator';
import { i18n } from '@wasil/shared';

// Ignore specific warnings in development
LogBox.ignoreLogs([
  'Non-serializable values were found',
  'VirtualizedLists should never be nested',
]);

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
