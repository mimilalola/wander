import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { Layout } from '../constants/layout';
import type { EmotionTier } from '../types';

interface EmotionPickerProps {
  selected: EmotionTier | null;
  onSelect: (emotion: EmotionTier) => void;
}

const OPTIONS: { value: EmotionTier; label: string; description: string }[] = [
  { value: 'loved', label: 'Loved it', description: 'A place I dream about returning to' },
  { value: 'nice', label: 'It was nice', description: 'Pleasant stay, good memories' },
  { value: 'wouldnt_return', label: "Wouldn't return", description: "Not for me, but that's okay" },
];

export function EmotionPicker({ selected, onSelect }: EmotionPickerProps) {
  return (
    <View style={styles.container}>
      {OPTIONS.map((option) => {
        const isSelected = selected === option.value;
        return (
          <TouchableOpacity
            key={option.value}
            style={[styles.option, isSelected && styles.optionSelected]}
            onPress={() => onSelect(option.value)}
            activeOpacity={0.7}
          >
            <Text style={[styles.label, isSelected && styles.labelSelected]}>
              {option.label}
            </Text>
            <Text style={[styles.description, isSelected && styles.descriptionSelected]}>
              {option.description}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  option: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Layout.borderRadius,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  optionSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentLight,
  },
  label: {
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  labelSelected: {
    color: Colors.accent,
  },
  description: {
    fontSize: Typography.caption.fontSize,
    color: Colors.textSecondary,
  },
  descriptionSelected: {
    color: Colors.accent,
  },
});
