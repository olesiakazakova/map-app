import React, { useState } from 'react';
import { View, Text, StyleSheet, Button, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useMarkers } from '../../components/MarkersContext';
import { ImageList } from '../../components/ImageList';
import { MarkerImage } from '../../types';

export default function MarkerDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getMarker, addImage, removeImage, removeMarker } = useMarkers();
  const [picking, setPicking] = useState(false);

  const marker = getMarker(id);

  if (!marker) {
    return (
      <View style={styles.centered}>
        <Text>Маркер не найден</Text>
        <Button title="Назад к карте" onPress={() => router.back()} />
      </View>
    );
  }

  const handleAddImage = async () => {
    setPicking(true);
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Нет доступа', 'Разрешите доступ к галерее в настройках.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: 10,
      });
      if (result.canceled) return;
      result.assets.forEach((asset) => addImage(marker.id, asset.uri));
    } catch (e) {
      Alert.alert('Ошибка', 'Не удалось выбрать изображение.');
    } finally {
      setPicking(false);
    }
  };

  const confirmDeleteImage = (img: MarkerImage) => {
    Alert.alert('Удалить изображение?', undefined, [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: () => removeImage(marker.id, img.id) },
    ]);
  };

  const confirmDeleteMarker = () => {
    Alert.alert('Удалить маркер?', 'Все изображения будут потеряны.', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: () => {
          removeMarker(marker.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{marker.title}</Text>
      <Text style={styles.coords}>
        {marker.latitude.toFixed(5)}, {marker.longitude.toFixed(5)}
      </Text>

      <Button
        title={picking ? 'Выбор…' : 'Добавить изображение'}
        onPress={handleAddImage}
        disabled={picking}
      />
      {picking && <ActivityIndicator style={{ marginTop: 8 }} />}

      <View style={{ flex: 1, marginTop: 12 }}>
        <ImageList images={marker.images} onRemove={confirmDeleteImage} />
      </View>

      <View style={{ marginTop: 12 }}>
        <Button title="Удалить маркер" color="#c00" onPress={confirmDeleteMarker} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  title: { fontSize: 20, fontWeight: '600' },
  coords: { color: '#666', marginBottom: 12 },
});