import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Leaf, MapPin } from 'lucide-react-native';
import * as Location from 'expo-location';

// Platform-specific map imports
let MapView, Marker;
if (Platform.OS !== 'web') {
  try {
    const RNMaps = require('react-native-maps');
    MapView = RNMaps.default;
    Marker = RNMaps.Marker;
  } catch (err) {
    console.warn('react-native-maps failed to load:', err);
  }
}

// Mock collection points data
const collectionPoints = [
  { id: 1, latitude: -23.550520, longitude: -46.633308, type: 'Papel' },
  { id: 2, latitude: -23.555994, longitude: -46.639825, type: 'Plástico' },
  { id: 3, latitude: -23.548427, longitude: -46.638770, type: 'Metal' },
  { id: 4, latitude: -23.553755, longitude: -46.635466, type: 'Orgânico' },
];

export default function MapParceiroScreen() {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [selectedPoint, setSelectedPoint] = useState(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        router.back();
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();
  }, []);

  const handleMarkerPress = (point) => {
    setSelectedPoint(point);
  };

  if (errorMsg) {
    return null; // Will redirect due to router.back()
  }

  if (Platform.OS === 'web') {
    return (
      <ScrollView style={styles.container}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#333333" />
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Pontos de Coleta</Text>
          <TouchableOpacity style={styles.addButton}>
            <MapPin size={24} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Adicionar Ponto</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.mapContainer}>
          <iframe
            src={`https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${location?.coords.latitude},${location?.coords.longitude}`}
            style={{
              border: 0,
              width: '100%',
              height: '100%',
              minHeight: 400,
            }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </View>

        {selectedPoint && (
          <View style={styles.pointDetails}>
            <Text style={styles.pointType}>{selectedPoint.type}</Text>
            <Text style={styles.pointCoordinates}>
              {selectedPoint.latitude.toFixed(6)}, {selectedPoint.longitude.toFixed(6)}
            </Text>
          </View>
        )}

        <View style={styles.footer}>
          <Leaf size={40} color="#4CAF50" />
          <Text style={styles.footerText}>Green Cycle</Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <ArrowLeft size={24} color="#333333" />
        <Text style={styles.backButtonText}>Voltar</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>Pontos de Coleta</Text>
        <TouchableOpacity style={styles.addButton}>
          <MapPin size={24} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Adicionar Ponto</Text>
        </TouchableOpacity>
      </View>

      {location && MapView && (
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
          >
            {Marker && (
              <>
                <Marker
                  coordinate={{
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                  }}
                  title="Sua localização"
                  pinColor="#4CAF50"
                />
                {collectionPoints.map((point) => (
                  <Marker
                    key={point.id}
                    coordinate={{
                      latitude: point.latitude,
                      longitude: point.longitude,
                    }}
                    title={point.type}
                    onPress={() => handleMarkerPress(point)}
                    pinColor="#2196F3"
                  />
                ))}
              </>
            )}
          </MapView>
          {selectedPoint && (
            <View style={styles.pointDetails}>
              <Text style={styles.pointType}>{selectedPoint.type}</Text>
              <Text style={styles.pointCoordinates}>
                {selectedPoint.latitude.toFixed(6)}, {selectedPoint.longitude.toFixed(6)}
              </Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.footer}>
        <Leaf size={40} color="#4CAF50" />
        <Text style={styles.footerText}>Green Cycle</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: 'Roboto-Medium',
    color: '#333333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Roboto-Bold',
    color: '#333333',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Roboto-Medium',
  },
  mapContainer: {
    height: 400,
    marginBottom: 16,
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  pointDetails: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    margin: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  pointType: {
    fontSize: 18,
    fontFamily: 'Roboto-Bold',
    color: '#333333',
    marginBottom: 8,
  },
  pointCoordinates: {
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    color: '#666666',
  },
  footer: {
    alignItems: 'center',
    padding: 16,
  },
  footerText: {
    marginTop: 8,
    fontSize: 16,
    fontFamily: 'Roboto-Medium',
    color: '#4CAF50',
  },
});