import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import type { SaveStatus } from '../types';

interface StatusBadgeProps {
  status: SaveStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const isSaved = status === 'want';
  const icon = isSaved ? 'star-outline' : 'bed-outline';
  const label = isSaved ? 'Saved' : 'Slept';
  const color = isSaved ? Colors.saved : Colors.slept;

  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <Ionicons name={icon} size={12} color={color} style={styles.icon} />
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
});
