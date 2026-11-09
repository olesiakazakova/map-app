import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, Button, Alert, ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useMarkers } from '../../contexts/DatabaseContext';
import { ImageList } from '../../components/ImageList';
import { MapMarkerData, MarkerImage } from '../../types';

export default function MarkerDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getMarker, addImage, removeImage, removeMarker, isLoading: ctxLoading } = useMarkers();

  const [marker, setMarker] = useState<MapMarkerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [picking, setPicking] = useState(false);

  const load = useCallback(async () => {
    if (ctxLoading) return;
    setLoading(true);
    try {
      setMarker(await getMarker(id));
    } catch (e) {
      Alert.alert('Ошибка', (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [getMarker, id, ctxLoading]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (ctxLoading || loading) {
    return <View style={styles.centered}><ActivityIndicator /></View>;
  }

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
      for (const asset of result.assets) {
        await addImage(marker.id, asset.uri);
      }
      await load(); 
    } catch (e) {
      Alert.alert('Ошибка', 'Не удалось выбрать изображение.');
    } finally {
      setPicking(false);
    }
  };

  const confirmDeleteImage = (img: MarkerImage) => {
    Alert.alert('Удалить изображение?', undefined, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          try { await removeImage(marker.id, img.id); await load(); }
          catch (e) { Alert.alert('Ошибка', (e as Error).message); }
        },
      },
    ]);
  };

  const confirmDeleteMarker = () => {
    Alert.alert('Удалить маркер?', 'Все изображения будут потеряны.', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeMarker(marker.id);
            router.back();
          } catch (e) {
            Alert.alert('Ошибка', (e as Error).message);
          }
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