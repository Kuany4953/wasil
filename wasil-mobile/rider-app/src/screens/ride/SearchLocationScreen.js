/**
 * Wasil Rider - Search Location Screen
 * Google Places autocomplete for pickup/dropoff - Professional Design
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
  { id: 'current', icon: 'location', title: 'Current location', type: 'current' },
  { id: 'set_map', icon: 'map', title: 'Set location on map', type: 'map' },
];

const POPULAR_PLACES = [
  {
    id: 'juba_airport',
    icon: 'airport',
    title: 'Juba International Airport',
    address: 'Airport Road, Juba',
    latitude: 4.8721,
    longitude: 31.6012,
  },
  {
    id: 'custom_market',
    icon: 'market',
    title: 'Custom Market',
    address: 'Hai Custom, Juba',
    latitude: 4.8516,
    longitude: 31.5821,
  },
  {
    id: 'konyo_konyo',
    icon: 'shopping',
    title: 'Konyo Konyo Market',
    address: 'Konyo Konyo, Juba',
    latitude: 4.8468,
    longitude: 31.5772,
  },
  {
    id: 'university_juba',
    icon: 'education',
    title: 'University of Juba',
    address: 'University Road, Juba',
    latitude: 4.8667,
    longitude: 31.5500,
  },
  {
    id: 'juba_teaching_hospital',
    icon: 'hospital',
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
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

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
          icon: 'location',
          title: query + ' Street, Juba',
          address: 'Near ' + query + ', Juba, South Sudan',
          latitude: 4.8594 + Math.random() * 0.02,
          longitude: 31.5713 + Math.random() * 0.02,
        },
        {
          id: '2',
          icon: 'location',
          title: query + ' Area',
          address: query + ' District, Juba',
          latitude: 4.8594 + Math.random() * 0.02,
          longitude: 31.5713 + Math.random() * 0.02,
        },
        {
          id: '3',
          icon: 'location',
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

  const renderIcon = (iconType) => {
    switch (iconType) {
      case 'location':
        return <View style={styles.locationIcon} />;
      case 'map':
        return <View style={styles.mapIcon} />;
      case 'airport':
        return <View style={styles.airportIcon} />;
      case 'market':
      case 'shopping':
        return <View style={styles.marketIcon} />;
      case 'education':
        return <View style={styles.educationIcon} />;
      case 'hospital':
        return <View style={styles.hospitalIcon} />;
      default:
        return <View style={styles.locationIcon} />;
    }
  };

  const renderSearchItem = ({ item }) => (
    <TouchableOpacity
      style={styles.searchItem}
      onPress={() => handleSelectLocation(item)}
      activeOpacity={0.7}
    >
      <View style={styles.searchItemIconContainer}>
        {renderIcon(item.icon || 'location')}
      </View>
      <View style={styles.searchItemContent}>
        <Text style={styles.searchItemTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.searchItemAddress} numberOfLines={1}>
          {item.address}
        </Text>
      </View>
      <View style={styles.chevronContainer}>
        <View style={styles.chevronIcon} />
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
      activeOpacity={0.7}
    >
      <View style={styles.savedItemIconContainer}>
        {renderIcon(item.icon)}
      </View>
      <Text style={styles.savedItemTitle}>{item.title}</Text>
      <View style={styles.chevronContainer}>
        <View style={styles.chevronIcon} />
      </View>
    </TouchableOpacity>
  );

  const searchText = activeField === 'pickup' ? pickupText : dropoffText;
  const showResults = searchText.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Header with inputs */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <View style={styles.backArrow} />
          </TouchableOpacity>

          <View style={styles.inputsContainer}>
            {/* Pickup Input */}
            <View style={styles.inputRow}>
              <View style={styles.inputDotContainer}>
                <View style={styles.pickupDot} />
                <View style={styles.pickupRing} />
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
                placeholderTextColor="#9CA3AF"
                returnKeyType="next"
              />
              {pickupText.length > 0 && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => {
                    setPickupText('');
                    dispatch(setPickup(null));
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.clearIcon} />
                </TouchableOpacity>
              )}
            </View>

            {/* Connector Line */}
            <View style={styles.connector}>
              <View style={styles.connectorLine} />
            </View>

            {/* Dropoff Input */}
            <View style={styles.inputRow}>
              <View style={styles.inputDotContainer}>
                <View style={styles.dropoffSquare} />
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
                placeholderTextColor="#9CA3AF"
                returnKeyType="search"
              />
              {dropoffText.length > 0 && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => {
                    setDropoffText('');
                    dispatch(setDropoff(null));
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.clearIcon} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Swap Button */}
          {pickupText && dropoffText && (
            <TouchableOpacity
              style={styles.swapButton}
              onPress={handleSwapLocations}
              activeOpacity={0.8}
            >
              <View style={styles.swapIconTop} />
              <View style={styles.swapIconBottom} />
            </TouchableOpacity>
          )}
        </View>

        {/* Search Results */}
        {isSearching ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        ) : showResults ? (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            renderItem={renderSearchItem}
            contentContainerStyle={styles.resultsList}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyResults}>
                <View style={styles.emptyIcon} />
                <Text style={styles.emptyTitle}>No results found</Text>
                <Text style={styles.emptyText}>
                  Try a different search term
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
                  <View style={styles.sectionHeaderContainer}>
                    <Text style={styles.sectionHeader}>{item.title}</Text>
                  </View>
                );
              }
              if (item.type === 'saved') {
                return renderSavedItem({ item });
              }
              return renderSearchItem({ item });
            }}
            contentContainerStyle={styles.resultsList}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        )}
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  backArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderRightWidth: 10,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: '#111827',
    marginRight: 2,
  },

  // Inputs
  inputsContainer: {
    flex: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  inputDotContainer: {
    width: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickupDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  pickupRing: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.primary + '40',
  },
  dropoffSquare: {
    width: 10,
    height: 10,
    backgroundColor: '#EF4444',
    borderRadius: 2,
  },
  connector: {
    marginLeft: 13,
    height: 24,
    width: 2,
    justifyContent: 'center',
    marginVertical: spacing.xs,
  },
  connectorLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    height: 48,
    paddingHorizontal: spacing.base,
    fontSize: typography.fontSize.base,
    color: '#111827',
    backgroundColor: '#F9FAFB',
    borderRadius: borderRadius.xl,
    marginLeft: spacing.sm,
    fontWeight: '600',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputActive: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.primary,
    ...shadows.md,
    elevation: 4,
  },
  clearButton: {
    position: 'absolute',
    right: spacing.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearIcon: {
    width: 12,
    height: 12,
    transform: [{ rotate: '45deg' }],
  },

  // Swap Button
  swapButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  swapIconTop: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: colors.primary,
    marginBottom: 2,
  },
  swapIconBottom: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.primary,
    marginTop: 2,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.base,
    fontSize: typography.fontSize.base,
    color: '#6B7280',
    fontWeight: '600',
  },

  // Results List
  resultsList: {
    paddingVertical: spacing.md,
  },

  // Section Header
  sectionHeaderContainer: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  sectionHeader: {
    fontSize: typography.fontSize.xs,
    fontWeight: '800',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // Icons
  locationIcon: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  mapIcon: {
    width: 16,
    height: 16,
    backgroundColor: '#3B82F6',
    borderRadius: 3,
  },
  airportIcon: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 14,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#10B981',
    transform: [{ rotate: '0deg' }],
  },
  marketIcon: {
    width: 16,
    height: 14,
    backgroundColor: '#F59E0B',
    borderRadius: 2,
  },
  educationIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  hospitalIcon: {
    width: 14,
    height: 14,
    backgroundColor: '#EF4444',
  },

  // Search Item
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xl,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  searchItemIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.base,
  },
  searchItemContent: {
    flex: 1,
  },
  searchItemTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  searchItemAddress: {
    fontSize: typography.fontSize.sm,
    color: '#6B7280',
    fontWeight: '500',
  },
  chevronContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chevronIcon: {
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

  // Saved Item
  savedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xl,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  savedItemIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.base,
  },
  savedItemTitle: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: '#111827',
  },

  // Empty Results
  emptyResults: {
    flex: 1,
    padding: spacing['3xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: '#111827',
    marginBottom: spacing.xs,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: '#9CA3AF',
    fontWeight: '500',
  },
});

export default SearchLocationScreen;
