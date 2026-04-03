import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/colors';

interface TagChipProps {
  name: string;
  selected?: boolean;
  onPress?: () => void;
}

export function TagChip({ name, selected = false, onPress }: TagChipProps) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.selected]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <Text style={[styles.text, selected && styles.selectedText]}>{name}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.borderLight,
    marginRight: 8,
    marginBottom: 8,
  },
  selected: {
    backgroundColor: Colors.accent,
  },
  text: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  selectedText: {
    color: Colors.white,
  },
});
