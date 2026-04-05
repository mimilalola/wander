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
  isSaved?: boolean;
  isSlept?: boolean;
  onPress: () => void;
  onToggleSaved?: () => void;
  onToggleSlept?: () => void;
}

export function HotelListItem({
  name,
  city,
  country,
  priceLevel,
  coverPhoto,
  isSaved = false,
  isSlept = false,
  onPress,
  onToggleSaved,
  onToggleSlept,
}: HotelListItemProps) {
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

      <View style={styles.actions}>
        <TouchableOpacity
          onPress={onToggleSaved}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.iconButton}
          disabled={!onToggleSaved}
        >
          <Ionicons
            name={isSaved ? 'star' : 'star-outline'}
            size={18}
            color={isSaved ? Colors.accent : Colors.textLight}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onToggleSlept}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.iconButton}
          disabled={!onToggleSlept}
        >
          <Ionicons
            name={isSlept ? 'bed' : 'bed-outline'}
            size={18}
            color={isSlept ? Colors.accent : Colors.textLight}
          />
        </TouchableOpacity>
      </View>
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
    marginRight: 10,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginLeft: 4,
  },
  iconButton: {
    padding: 4,
  },
});
