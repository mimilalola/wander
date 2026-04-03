import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Layout } from '../constants/layout';
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
      <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  imageBox: {
    width: 48,
    height: 48,
    borderRadius: Layout.borderRadiusSmall,
    overflow: 'hidden',
    marginRight: 12,
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
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  location: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  priceContainer: {
    marginRight: 8,
  },
});
