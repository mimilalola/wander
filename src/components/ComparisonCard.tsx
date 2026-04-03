import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Layout } from '../constants/layout';

interface ComparisonHotel {
  id: number;
  name: string;
  city: string;
  country: string;
  rating: number | null;
}

interface ComparisonCardProps {
  hotelA: ComparisonHotel;
  hotelB: ComparisonHotel;
  onSelectA: () => void;
  onSelectB: () => void;
}

export function ComparisonCard({ hotelA, hotelB, onSelectA, onSelectB }: ComparisonCardProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Which hotel do you prefer?</Text>
      <View style={styles.cardsRow}>
        <TouchableOpacity style={styles.card} onPress={onSelectA} activeOpacity={0.7}>
          <View style={styles.iconContainer}>
            <Ionicons name="bed-outline" size={28} color={Colors.accent} />
          </View>
          <Text style={styles.hotelName} numberOfLines={2}>{hotelA.name}</Text>
          <Text style={styles.location}>{hotelA.city}, {hotelA.country}</Text>
          {hotelA.rating && <Text style={styles.rating}>{hotelA.rating}/10</Text>}
        </TouchableOpacity>

        <View style={styles.vsContainer}>
          <Text style={styles.vs}>VS</Text>
        </View>

        <TouchableOpacity style={styles.card} onPress={onSelectB} activeOpacity={0.7}>
          <View style={styles.iconContainer}>
            <Ionicons name="bed-outline" size={28} color={Colors.want} />
          </View>
          <Text style={styles.hotelName} numberOfLines={2}>{hotelB.name}</Text>
          <Text style={styles.location}>{hotelB.city}, {hotelB.country}</Text>
          {hotelB.rating && <Text style={styles.rating}>{hotelB.rating}/10</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  cardsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  card: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius,
    padding: 16,
    alignItems: 'center',
    ...Layout.cardShadow,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  hotelName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  location: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  rating: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.accent,
    marginTop: 6,
  },
  vsContainer: {
    marginHorizontal: 12,
  },
  vs: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textLight,
  },
});
