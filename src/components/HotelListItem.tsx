import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Layout } from '../constants/layout';
import { Typography } from '../constants/typography';
import { PriceLevel } from './PriceLevel';

interface HotelListItemProps {
  name: string;
  city: string;
  country: string;
  priceLevel: number | null;
  coverPhoto?: string | null;
  onPress: () => void;
}

export function HotelListItem({ name, city, country, priceLevel, coverPhoto, onPress }: HotelListItemProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.imageBox}>
        {coverPhoto ? (
          <Image source={{ uri: coverPhoto }} style={styles.image} />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="bed-outline" size={20} color={Colors.textLight} />
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        <Text style={styles.location} numberOfLines={1}>
          {city}, {country}
        </Text>
      </View>
      {priceLevel && (
        <View style={styles.priceContainer}>
          <PriceLevel level={priceLevel} size="small" />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: 'transparent',
  },
  imageBox: {
    width: 48,
    height: 48,
    borderRadius: Layout.borderRadiusSmall,
    overflow: 'hidden',
    marginRight: 14,
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
  info: {
    flex: 1,
  },
  name: {
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
    fontFamily: Typography.heading3.fontFamily,
    color: Colors.text,
    marginBottom: 2,
  },
  location: {
    fontSize: Typography.caption.fontSize,
    color: Colors.textSecondary,
  },
  priceContainer: {
    marginLeft: 8,
  },
});
