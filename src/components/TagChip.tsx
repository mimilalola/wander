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
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.03)',
    marginRight: 10,
    marginBottom: 10,
  },
  selected: {
    backgroundColor: Colors.accentLight,
    borderColor: Colors.accent,
  },
  text: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  selectedText: {
    color: Colors.accent,
  },
});
