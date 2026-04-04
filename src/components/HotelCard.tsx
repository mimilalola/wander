import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Layout } from '../constants/layout';
import { Typography } from '../constants/typography';
import { PriceLevel } from './PriceLevel';
import { StatusBadge } from './StatusBadge';
import { RatingStamp } from './RatingStamp';
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
          <View style={styles.ratingContainer}>
            <RatingStamp score={rating} size="small" />
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
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius,
    overflow: 'hidden',
    marginBottom: 16,
  },
  imageContainer: {
    height: 180,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: Layout.borderRadius,
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Layout.borderRadius,
  },
  badgeContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
  },
  ratingContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  info: {
    paddingVertical: 10,
    paddingHorizontal: 2,
  },
  name: {
    fontSize: Typography.heading3.fontSize,
    fontWeight: '600',
    fontFamily: Typography.heading3.fontFamily,
    color: Colors.text,
    marginBottom: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  location: {
    fontSize: Typography.caption.fontSize,
    color: Colors.textSecondary,
    flex: 1,
  },
});
