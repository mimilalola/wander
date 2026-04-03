import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import type { SaveStatus } from '../types';

interface StatusBadgeProps {
  status: SaveStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const isWant = status === 'want';
  return (
    <View style={[styles.badge, isWant ? styles.saved : styles.slept]}>
      <Text style={styles.text}>{isWant ? 'Saved' : 'Slept'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  saved: {
    backgroundColor: Colors.saved + '20',
  },
  slept: {
    backgroundColor: Colors.slept + '20',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
});
