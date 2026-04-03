import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Layout } from '../constants/layout';

interface PhotoGridProps {
  photos: { id: number; imageUri: string }[];
  onAddPhoto?: () => void;
}

export function PhotoGrid({ photos, onAddPhoto }: PhotoGridProps) {
  if (photos.length === 0 && onAddPhoto) {
    return (
      <TouchableOpacity style={styles.addButtonLarge} onPress={onAddPhoto} activeOpacity={0.7}>
        <Ionicons name="camera-outline" size={28} color={Colors.textSecondary} />
      </TouchableOpacity>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
      {photos.map((photo) => (
        <View key={photo.id} style={styles.photoContainer}>
          <Image source={{ uri: photo.imageUri }} style={styles.photo} />
        </View>
      ))}
      {onAddPhoto && (
        <TouchableOpacity style={styles.addButton} onPress={onAddPhoto} activeOpacity={0.7}>
          <Ionicons name="add" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  photoContainer: {
    width: 200,
    height: 150,
    marginRight: 12,
    borderRadius: Layout.borderRadius,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  addButton: {
    width: 80,
    height: 150,
    borderRadius: Layout.borderRadius,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonLarge: {
    width: '100%',
    height: 120,
    borderRadius: Layout.borderRadius,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
