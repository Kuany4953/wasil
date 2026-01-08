/**
 * Wasil Shared - MapView Component
 * Wrapper around react-native-maps with Juba defaults
 */

import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Platform, ActivityIndicator, Text } from 'react-native';
import MapViewRN, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { colors } from '../theme';

// Juba, South Sudan center coordinates
const JUBA_CENTER = {
  latitude: 4.8594,
  longitude: 31.5713,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

// Custom map style for a clean look
const mapStyle = [
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'transit',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'administrative.neighborhood',
    stylers: [{ visibility: 'off' }],
  },
];

const MapView = forwardRef(({
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
}, ref) => {
  const mapRef = useRef(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // Expose methods via ref
  React.useImperativeHandle(ref, () => ({
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

  // Auto-fit to markers when they change
  useEffect(() => {
    if (isMapReady && pickupLocation && dropoffLocation) {
      const coordinates = [
        { latitude: pickupLocation.latitude, longitude: pickupLocation.longitude },
        { latitude: dropoffLocation.latitude, longitude: dropoffLocation.longitude },
      ];
      mapRef.current?.fitToCoordinates(coordinates, {
        edgePadding: { top: 100, right: 50, bottom: 250, left: 50 },
        animated: true,
      });
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
        {/* Pickup Marker */}
        {pickupLocation && (
          <Marker
            coordinate={{
              latitude: pickupLocation.latitude,
              longitude: pickupLocation.longitude,
            }}
            title={pickupLocation.title || 'Pickup'}
            description={pickupLocation.address}
            anchor={{ x: 0.5, y: 1 }}
          >
            <View style={styles.pickupMarker}>
              <View style={styles.pickupDot} />
            </View>
          </Marker>
        )}

        {/* Dropoff Marker */}
        {dropoffLocation && (
          <Marker
            coordinate={{
              latitude: dropoffLocation.latitude,
              longitude: dropoffLocation.longitude,
            }}
            title={dropoffLocation.title || 'Dropoff'}
            description={dropoffLocation.address}
            anchor={{ x: 0.5, y: 1 }}
          >
            <View style={styles.dropoffMarker}>
              <View style={styles.dropoffPin}>
                <Text style={styles.dropoffIcon}>📍</Text>
              </View>
            </View>
          </Marker>
        )}

        {/* Route Polyline */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={colors.primary}
            strokeWidth={4}
            lineDashPattern={[0]}
          />
        )}

        {/* Driver Markers */}
        {driverMarkers.map((driver, index) => (
          <Marker
            key={driver.id || index}
            coordinate={{
              latitude: driver.latitude,
              longitude: driver.longitude,
            }}
            title={driver.name}
            rotation={driver.heading || 0}
            flat
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.driverMarker}>
              <Text style={styles.carIcon}>🚗</Text>
            </View>
          </Marker>
        ))}

        {/* Custom Markers */}
        {markers.map((marker, index) => (
          <Marker
            key={marker.id || index}
            coordinate={{
              latitude: marker.latitude,
              longitude: marker.longitude,
            }}
            title={marker.title}
            description={marker.description}
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

      {/* Loading Overlay */}
      {!isMapReady && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Pickup Marker
  pickupMarker: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickupDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  
  // Dropoff Marker
  dropoffMarker: {
    alignItems: 'center',
  },
  dropoffPin: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropoffIcon: {
    fontSize: 32,
  },
  
  // Driver Marker
  driverMarker: {
    width: 40,
    height: 40,
    backgroundColor: colors.white,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  carIcon: {
    fontSize: 24,
  },
  
  // Custom Marker
  customMarker: {
    padding: 4,
  },
});

// Export constants for use in other components
export const JUBA_REGION = JUBA_CENTER;

export default MapView;
