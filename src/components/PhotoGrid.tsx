import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Layout } from '../constants/layout';

interface PhotoGridProps {
  photos: { id: number; imageUri: string }[];
  onAddPhoto?: () => void;
}

export function PhotoGrid({ photos, onAddPhoto }: PhotoGridProps) {
  const data = onAddPhoto ? [...photos, { id: -1, imageUri: '' }] : photos;

  return (
    <FlatList
      data={data}
      numColumns={3}
      keyExtractor={(item) => item.id.toString()}
      scrollEnabled={false}
      contentContainerStyle={styles.grid}
      renderItem={({ item }) => {
        if (item.id === -1) {
          return (
            <TouchableOpacity style={styles.addButton} onPress={onAddPhoto} activeOpacity={0.7}>
              <Ionicons name="add" size={28} color={Colors.textSecondary} />
            </TouchableOpacity>
          );
        }
        return (
          <View style={styles.photoContainer}>
            <Image source={{ uri: item.imageUri }} style={styles.photo} />
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: 4,
  },
  photoContainer: {
    flex: 1,
    aspectRatio: 1,
    margin: 2,
    borderRadius: Layout.borderRadiusSmall,
    overflow: 'hidden',
    maxWidth: '33%',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  addButton: {
    flex: 1,
    aspectRatio: 1,
    margin: 2,
    borderRadius: Layout.borderRadiusSmall,
    backgroundColor: Colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: '33%',
  },
});
