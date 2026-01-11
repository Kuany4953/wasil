/**
 * Wasil Shared - MapView Component
 * Wrapper around react-native-maps with Juba defaults
 * Uber-like visual polish without affecting behavior or API
 */

import React, {
  forwardRef,
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
} from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
} from 'react-native';
import MapViewRN, {
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
} from 'react-native-maps';
import { colors } from '../theme';

// Juba, South Sudan center coordinates
const JUBA_CENTER = {
  latitude: 4.8594,
  longitude: 31.5713,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

// Uber-like clean light map style
const mapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#616161' }],
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#f5f5f5' }],
  },
  {
    featureType: 'administrative',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'poi',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#ffffff' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#e0e0e0' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#dadada' }],
  },
  {
    featureType: 'transit',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#c9e6ff' }],
  },
];

const MapView = forwardRef(
  (
    {
      style,
      initialRegion = JUBA_CENTER,
      showsUserLocation = true,
      showsMyLocationButton = false,
      showsCompass = false,
      showsTraffic = false,
      zoomEnabled = true,
      scrollEnabled = true,
      rotateEnabled = true,
      pitchEnabled = false,
      onRegionChange,
      onRegionChangeComplete,
      onMapReady,
      onPress,
      onLongPress,
      onMarkerPress,
      markers = [],
      driverMarkers = [],
      routeCoordinates = [],
      pickupLocation,
      dropoffLocation,
      userLocation,
      children,
      ...props
    },
    ref
  ) => {
    const mapRef = useRef(null);
    const [isMapReady, setIsMapReady] = useState(false);

    // Expose map methods
    useImperativeHandle(ref, () => ({
      animateToRegion: (region, duration = 500) => {
        mapRef.current?.animateToRegion(region, duration);
      },
      animateToCoordinate: (coordinate, duration = 500) => {
        mapRef.current?.animateCamera({
          center: coordinate,
          duration,
        });
      },
      fitToCoordinates: (coordinates, options = {}) => {
        mapRef.current?.fitToCoordinates(coordinates, {
          edgePadding: { top: 100, right: 50, bottom: 200, left: 50 },
          animated: true,
          ...options,
        });
      },
      getCamera: () => mapRef.current?.getCamera(),
      setCamera: (camera) => mapRef.current?.setCamera(camera),
    }));

    // Auto-fit pickup & dropoff
    useEffect(() => {
      if (isMapReady && pickupLocation && dropoffLocation) {
        mapRef.current?.fitToCoordinates(
          [
            pickupLocation,
            dropoffLocation,
          ],
          {
            edgePadding: { top: 100, right: 50, bottom: 250, left: 50 },
            animated: true,
          }
        );
      }
    }, [isMapReady, pickupLocation, dropoffLocation]);

    const handleMapReady = () => {
      setIsMapReady(true);
      onMapReady?.();
    };

    return (
      <View style={[styles.container, style]}>
        <MapViewRN
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={initialRegion}
          showsUserLocation={showsUserLocation}
          showsMyLocationButton={showsMyLocationButton}
          showsCompass={showsCompass}
          showsTraffic={showsTraffic}
          zoomEnabled={zoomEnabled}
          scrollEnabled={scrollEnabled}
          rotateEnabled={rotateEnabled}
          pitchEnabled={pitchEnabled}
          customMapStyle={mapStyle}
          onRegionChange={onRegionChange}
          onRegionChangeComplete={onRegionChangeComplete}
          onMapReady={handleMapReady}
          onPress={onPress}
          onLongPress={onLongPress}
          {...props}
        >
          {/* Pickup */}
          {pickupLocation && (
            <Marker
              coordinate={pickupLocation}
              anchor={{ x: 0.5, y: 1 }}
            >
              <View style={styles.pickupMarker}>
                <View style={styles.pickupDot} />
              </View>
            </Marker>
          )}

          {/* Dropoff */}
          {dropoffLocation && (
            <Marker
              coordinate={dropoffLocation}
              anchor={{ x: 0.5, y: 1 }}
            >
              <View style={styles.dropoffPin}>
                <Text style={styles.dropoffIcon}>📍</Text>
              </View>
            </Marker>
          )}

          {/* Route (Uber-style layered line) */}
          {routeCoordinates.length > 0 && (
            <>
              <Polyline
                coordinates={routeCoordinates}
                strokeColor="rgba(0,0,0,0.15)"
                strokeWidth={8}
                lineCap="round"
                lineJoin="round"
              />
              <Polyline
                coordinates={routeCoordinates}
                strokeColor={colors.primary}
                strokeWidth={5}
                lineCap="round"
                lineJoin="round"
              />
            </>
          )}

          {/* Drivers */}
          {driverMarkers.map((driver, index) => (
            <Marker
              key={driver.id || index}
              coordinate={driver}
              rotation={driver.heading || 0}
              flat
            >
              <View style={styles.driverMarker}>
                <Text style={styles.carIcon}>🚗</Text>
              </View>
            </Marker>
          ))}

          {/* Custom markers */}
          {markers.map((marker, index) => (
            <Marker
              key={marker.id || index}
              coordinate={marker}
              onPress={() => onMarkerPress?.(marker)}
            >
              {marker.customView || (
                <View style={styles.customMarker}>
                  <Text>{marker.icon || '📍'}</Text>
                </View>
              )}
            </Marker>
          ))}

          {children}
        </MapViewRN>

        {!isMapReady && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  pickupMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickupDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },

  dropoffPin: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 7,
  },
  dropoffIcon: {
    fontSize: 22,
    color: '#fff',
  },

  driverMarker: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  carIcon: {
    fontSize: 20,
  },

  customMarker: {
    padding: 4,
  },
});

// Export constants
export const JUBA_REGION = JUBA_CENTER;

export default MapView;
