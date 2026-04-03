import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Layout } from '../constants/layout';
import { PriceLevel } from './PriceLevel';
import { StatusBadge } from './StatusBadge';
import type { SaveStatus } from '../types';

interface HotelCardProps {
  name: string;
  city: string;
  country: string;
  priceLevel: number | null;
  coverPhoto: string | null;
  saveStatus: SaveStatus | null;
  rating: number | null;
  onPress: () => void;
}

export function HotelCard({
  name,
  city,
  country,
  priceLevel,
  coverPhoto,
  saveStatus,
  rating,
  onPress,
}: HotelCardProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.imageContainer}>
        {coverPhoto ? (
          <Image source={{ uri: coverPhoto }} style={styles.image} />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="bed-outline" size={32} color={Colors.textLight} />
          </View>
        )}
        {saveStatus && (
          <View style={styles.badgeContainer}>
            <StatusBadge status={saveStatus} />
          </View>
        )}
        {rating !== null && (
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>{rating}</Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <View style={styles.row}>
          <Text style={styles.location} numberOfLines={1}>
            {city}, {country}
          </Text>
          {priceLevel && <PriceLevel level={priceLevel} />}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius,
    overflow: 'hidden',
    marginBottom: 12,
    ...Layout.cardShadow,
  },
  imageContainer: {
    height: 160,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
  },
  ratingBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: Colors.accent,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  info: {
    padding: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  location: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },
});
