import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { MapContainer, TileLayer, Marker } from 'react-native-leaflet-kit';
import { MapMarkerData } from '../types';

interface Props {
  markers: MapMarkerData[];
  onMarkerPress: (id: string) => void;
  onMapLongPress: (lat: number, lng: number) => void;
}

// Порог попадания в маркер (в градусах). 0.0005 ≈ 50 метров
const HIT_RADIUS = 0.0005;

export const Map: React.FC<Props> = ({ markers, onMarkerPress, onMapLongPress }) => {
  const [loading, setLoading] = useState(true);

  const initialCenter = markers.length > 0
    ? { lat: markers[0].latitude, lng: markers[0].longitude }
    : { lat: 58.004713, lng: 56.181436 };

  const handleMapClick = (pos: { lat: number; lng: number }) => {
    const hit = markers.find((m) => {
      const dLat = Math.abs(m.latitude - pos.lat);
      const dLng = Math.abs(m.longitude - pos.lng);
      return dLat < HIT_RADIUS && dLng < HIT_RADIUS;
    });

    if (hit) {
      onMarkerPress(hit.id);
    } else {
      onMapLongPress(pos.lat, pos.lng);
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text>Загрузка карты…</Text>
        </View>
      ) : null}

      <MapContainer
        center={initialCenter}
        zoom={13}
        onMapReady={() => setLoading(false)}
        onMapClick={handleMapClick}
      >
        <TileLayer />
        {markers.map((m) => (
          <Marker
            key={m.id}
            id={m.id}
            position={{ lat: m.latitude, lng: m.longitude }}
            title={m.title}
            icon="📍"
          />
        ))}
      </MapContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    zIndex: 5,
  },
});