import React from 'react';
import { FlatList, Image, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { MarkerImage } from '../types';

interface Props {
  images: MarkerImage[];
  onRemove: (img: MarkerImage) => void;
}

export const ImageList: React.FC<Props> = ({ images, onRemove }) => (
  <FlatList
    data={images}
    keyExtractor={(i) => i.id}
    numColumns={2}
    contentContainerStyle={{ paddingVertical: 12 }}
    ListEmptyComponent={<Text style={styles.empty}>Нет изображений</Text>}
    renderItem={({ item }) => (
      <TouchableOpacity style={styles.wrap} onLongPress={() => onRemove(item)} activeOpacity={0.8}>
        <Image source={{ uri: item.uri }} style={styles.img} />
      </TouchableOpacity>
    )}
  />
);

const styles = StyleSheet.create({
  wrap: { flex: 1, aspectRatio: 1, margin: 4 },
  img: { width: '100%', height: '100%', borderRadius: 8 },
  empty: { textAlign: 'center', color: '#999', marginTop: 24 },
});