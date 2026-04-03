import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

interface PriceLevelProps {
  level: number;
  size?: 'small' | 'default';
}

export function PriceLevel({ level, size = 'default' }: PriceLevelProps) {
  const filled = Math.min(Math.max(level, 1), 5);
  const unfilled = 5 - filled;

  return (
    <Text style={[styles.text, size === 'small' && styles.small]}>
      <Text style={styles.filled}>{'€'.repeat(filled)}</Text>
      <Text style={styles.unfilled}>{'€'.repeat(unfilled)}</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 14,
  },
  small: {
    fontSize: 12,
  },
  filled: {
    color: Colors.text,
    fontWeight: '600',
  },
  unfilled: {
    color: Colors.borderLight,
    fontWeight: '400',
  },
});
