/**
 * Wasil Rider - Search Location Screen
 * Google Places autocomplete for pickup/dropoff
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TextInput,
  TouchableOpacity,
  FlatList,
  Keyboard,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography, borderRadius, shadows } from '@wasil/shared';
import { setPickup, setDropoff, selectPickup, selectDropoff } from '../../store/slices/rideSlice';

// Google Places API key (should be in env)
const GOOGLE_PLACES_API_KEY = 'YOUR_GOOGLE_PLACES_API_KEY';

// Juba bounds for location biasing
const JUBA_BOUNDS = {
  northeast: { lat: 4.95, lng: 31.70 },
  southwest: { lat: 4.75, lng: 31.45 },
};

// Popular/Saved places
const SAVED_PLACES = [
  { id: 'current', icon: '📍', title: 'Current location', type: 'current' },
  { id: 'set_map', icon: '🗺️', title: 'Set location on map', type: 'map' },
];

const POPULAR_PLACES = [
  {
    id: 'juba_airport',
    icon: '✈️',
    title: 'Juba International Airport',
    address: 'Airport Road, Juba',
    latitude: 4.8721,
    longitude: 31.6012,
  },
  {
    id: 'custom_market',
    icon: '🏪',
    title: 'Custom Market',
    address: 'Hai Custom, Juba',
    latitude: 4.8516,
    longitude: 31.5821,
  },
  {
    id: 'konyo_konyo',
    icon: '🏬',
    title: 'Konyo Konyo Market',
    address: 'Konyo Konyo, Juba',
    latitude: 4.8468,
    longitude: 31.5772,
  },
  {
    id: 'university_juba',
    icon: '🎓',
    title: 'University of Juba',
    address: 'University Road, Juba',
    latitude: 4.8667,
    longitude: 31.5500,
  },
  {
    id: 'juba_teaching_hospital',
    icon: '🏥',
    title: 'Juba Teaching Hospital',
    address: 'Hai Malakal, Juba',
    latitude: 4.8580,
    longitude: 31.5780,
  },
];

const SearchLocationScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  
  const { focusedField = 'dropoff' } = route.params || {};
  
  const pickup = useSelector(selectPickup);
  const dropoff = useSelector(selectDropoff);
  
  const [pickupText, setPickupText] = useState(pickup?.address || '');
  const [dropoffText, setDropoffText] = useState(dropoff?.address || '');
  const [activeField, setActiveField] = useState(focusedField);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  
  const pickupInputRef = useRef(null);
  const dropoffInputRef = useRef(null);
  const searchTimeout = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    // Focus the correct input
    setTimeout(() => {
      if (focusedField === 'pickup') {
        pickupInputRef.current?.focus();
      } else {
        dropoffInputRef.current?.focus();
      }
    }, 300);
  }, []);

  // Search places using Google Places API
  const searchPlaces = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);

    try {
      // For demo, use mock results
      // In production, use Google Places API:
      // const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&location=${JUBA_BOUNDS.southwest.lat},${JUBA_BOUNDS.southwest.lng}&radius=20000&key=${GOOGLE_PLACES_API_KEY}`;
      
      // Mock search results
      const mockResults = [
        {
          id: '1',
          title: query + ' Street, Juba',
          address: 'Near ' + query + ', Juba, South Sudan',
          latitude: 4.8594 + Math.random() * 0.02,
          longitude: 31.5713 + Math.random() * 0.02,
        },
        {
          id: '2',
          title: query + ' Area',
          address: query + ' District, Juba',
          latitude: 4.8594 + Math.random() * 0.02,
          longitude: 31.5713 + Math.random() * 0.02,
        },
        {
          id: '3',
          title: query + ' Junction',
          address: 'Main Road, ' + query + ', Juba',
          latitude: 4.8594 + Math.random() * 0.02,
          longitude: 31.5713 + Math.random() * 0.02,
        },
      ];

      // Filter popular places
      const matchedPopular = POPULAR_PLACES.filter(
        place => place.title.toLowerCase().includes(query.toLowerCase()) ||
                 place.address.toLowerCase().includes(query.toLowerCase())
      );

      setSearchResults([...matchedPopular, ...mockResults]);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (text, field) => {
    if (field === 'pickup') {
      setPickupText(text);
    } else {
      setDropoffText(text);
    }
    setActiveField(field);

    // Debounce search
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    searchTimeout.current = setTimeout(() => {
      searchPlaces(text);
    }, 300);
  };

  const handleSelectLocation = (place) => {
    const location = {
      latitude: place.latitude,
      longitude: place.longitude,
      address: place.title,
      fullAddress: place.address,
    };

    if (activeField === 'pickup') {
      dispatch(setPickup(location));
      setPickupText(place.title);
      // Move focus to dropoff if empty
      if (!dropoffText) {
        setActiveField('dropoff');
        dropoffInputRef.current?.focus();
      }
    } else {
      dispatch(setDropoff(location));
      setDropoffText(place.title);
    }

    setSearchResults([]);
    Keyboard.dismiss();

    // If both locations are set, go to confirm screen
    const newPickup = activeField === 'pickup' ? location : pickup;
    const newDropoff = activeField === 'dropoff' ? location : dropoff;

    if (newPickup && newDropoff) {
      navigation.navigate('RideConfirm');
    }
  };

  const handleCurrentLocation = async () => {
    // Get current location and set as pickup
    // In production, use Geolocation API
    const mockCurrentLocation = {
      latitude: 4.8594,
      longitude: 31.5713,
      address: 'Current Location',
      fullAddress: 'Your current position',
    };

    if (activeField === 'pickup') {
      dispatch(setPickup(mockCurrentLocation));
      setPickupText('Current Location');
      setActiveField('dropoff');
      dropoffInputRef.current?.focus();
    } else {
      dispatch(setDropoff(mockCurrentLocation));
      setDropoffText('Current Location');
    }
    setSearchResults([]);
  };

  const handleSetOnMap = () => {
    navigation.navigate('PickLocationMap', { field: activeField });
  };

  const handleSwapLocations = () => {
    const tempPickup = pickup;
    const tempPickupText = pickupText;
    
    dispatch(setPickup(dropoff));
    dispatch(setDropoff(tempPickup));
    setPickupText(dropoffText);
    setDropoffText(tempPickupText);
  };

  const renderSearchItem = ({ item }) => (
    <TouchableOpacity
      style={styles.searchItem}
      onPress={() => handleSelectLocation(item)}
    >
      <View style={styles.searchItemIcon}>
        <Text style={styles.searchItemEmoji}>{item.icon || '📍'}</Text>
      </View>
      <View style={styles.searchItemContent}>
        <Text style={styles.searchItemTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.searchItemAddress} numberOfLines={1}>
          {item.address}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderSavedItem = ({ item }) => (
    <TouchableOpacity
      style={styles.savedItem}
      onPress={() => {
        if (item.type === 'current') {
          handleCurrentLocation();
        } else if (item.type === 'map') {
          handleSetOnMap();
        }
      }}
    >
      <View style={styles.savedItemIcon}>
        <Text style={styles.savedItemEmoji}>{item.icon}</Text>
      </View>
      <Text style={styles.savedItemTitle}>{item.title}</Text>
    </TouchableOpacity>
  );

  const searchText = activeField === 'pickup' ? pickupText : dropoffText;
  const showResults = searchText.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
      
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Header with inputs */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>

          <View style={styles.inputsContainer}>
            {/* Pickup Input */}
            <View style={styles.inputRow}>
              <View style={styles.inputDot}>
                <View style={styles.pickupDot} />
              </View>
              <TextInput
                ref={pickupInputRef}
                style={[
                  styles.input,
                  activeField === 'pickup' && styles.inputActive,
                ]}
                value={pickupText}
                onChangeText={(text) => handleSearchChange(text, 'pickup')}
                onFocus={() => setActiveField('pickup')}
                placeholder={t('ride.pickupPlaceholder', { defaultValue: 'Pickup location' })}
                placeholderTextColor={colors.textMuted}
                returnKeyType="next"
              />
            </View>

            {/* Connector Line */}
            <View style={styles.connector}>
              <View style={styles.connectorLine} />
            </View>

            {/* Dropoff Input */}
            <View style={styles.inputRow}>
              <View style={styles.inputDot}>
                <View style={styles.dropoffDot} />
              </View>
              <TextInput
                ref={dropoffInputRef}
                style={[
                  styles.input,
                  activeField === 'dropoff' && styles.inputActive,
                ]}
                value={dropoffText}
                onChangeText={(text) => handleSearchChange(text, 'dropoff')}
                onFocus={() => setActiveField('dropoff')}
                placeholder={t('ride.dropoffPlaceholder', { defaultValue: 'Where to?' })}
                placeholderTextColor={colors.textMuted}
                returnKeyType="search"
              />
            </View>
          </View>

          {/* Swap Button */}
          <TouchableOpacity
            style={styles.swapButton}
            onPress={handleSwapLocations}
          >
            <Text style={styles.swapIcon}>⇅</Text>
          </TouchableOpacity>
        </View>

        {/* Search Results */}
        {isSearching ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : showResults ? (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            renderItem={renderSearchItem}
            contentContainerStyle={styles.resultsList}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={styles.emptyResults}>
                <Text style={styles.emptyText}>
                  {t('ride.noResults', { defaultValue: 'No results found' })}
                </Text>
              </View>
            }
          />
        ) : (
          <FlatList
            data={[
              { type: 'header', title: t('ride.savedPlaces', { defaultValue: 'Quick Actions' }) },
              ...SAVED_PLACES.map(p => ({ ...p, type: 'saved' })),
              { type: 'header', title: t('ride.popularPlaces', { defaultValue: 'Popular Places in Juba' }) },
              ...POPULAR_PLACES.map(p => ({ ...p, type: 'popular' })),
            ]}
            keyExtractor={(item, index) => item.id || `header-${index}`}
            renderItem={({ item }) => {
              if (item.type === 'header') {
                return (
                  <Text style={styles.sectionHeader}>{item.title}</Text>
                );
              }
              if (item.type === 'saved') {
                return renderSavedItem({ item });
              }
              return renderSearchItem({ item });
            }}
            contentContainerStyle={styles.resultsList}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  backIcon: {
    fontSize: 20,
    color: colors.text,
  },

  // Inputs
  inputsContainer: {
    flex: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputDot: {
    width: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickupDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  dropoffDot: {
    width: 10,
    height: 10,
    backgroundColor: colors.error,
  },
  connector: {
    marginLeft: 11,
    height: 20,
    width: 2,
    justifyContent: 'center',
  },
  connectorLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
  },
  input: {
    flex: 1,
    height: 44,
    paddingHorizontal: spacing.sm,
    fontSize: typography.fontSize.base,
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginLeft: spacing.xs,
  },
  inputActive: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
  },

  // Swap Button
  swapButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  swapIcon: {
    fontSize: 18,
    color: colors.text,
  },

  // Results List
  resultsList: {
    paddingVertical: spacing.md,
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },

  // Section Header
  sectionHeader: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textMuted,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Search Item
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.white,
  },
  searchItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.base,
  },
  searchItemEmoji: {
    fontSize: 18,
  },
  searchItemContent: {
    flex: 1,
  },
  searchItemTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    marginBottom: 2,
  },
  searchItemAddress: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
  },

  // Saved Item
  savedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.white,
  },
  savedItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.base,
  },
  savedItemEmoji: {
    fontSize: 18,
  },
  savedItemTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
  },

  // Empty Results
  emptyResults: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.textMuted,
  },
});

export default SearchLocationScreen;
