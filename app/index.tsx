import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Map } from '../components/Map';
import { useMarkers } from '../components/MarkersContext';

export default function MapScreen() {
  const router = useRouter();
  const { markers, addMarker } = useMarkers();
  const [error, setError] = useState<string | null>(null);

  const handleLongPress = (latitude: number, longitude: number) => {
    try {
      addMarker({
        title: `Место ${markers.length + 1}`,
        latitude,
        longitude,
      });
    } catch (e) {
      setError('Не удалось добавить маркер');
    }
  };

  const handleMarkerPress = (id: string) => {
    try {
      router.push(`/marker/${id}`);
    } catch (e) {
      Alert.alert('Ошибка навигации', 'Не удалось открыть экран маркера');
    }
  };

  return (
    <View style={styles.container}>
      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <Map
        markers={markers}
        onMarkerPress={handleMarkerPress}
        onMapLongPress={handleLongPress}  
      />

      <View style={styles.hint}>
        <Text style={styles.hintText}>Нажмите на карту, чтобы добавить маркер</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hint: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  hintText: { color: 'white', fontSize: 12 },
  errorBanner: {
    position: 'absolute',
    top: 40,
    left: 16,
    right: 16,
    backgroundColor: '#ffdddd',
    padding: 10,
    borderRadius: 8,
    zIndex: 10,
  },
  errorText: { color: '#a00', textAlign: 'center' },
});