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

const OPTIONS: { value: EmotionTier; label: string }[] = [
  { value: 'loved', label: 'Loved it' },
  { value: 'nice', label: 'It was nice' },
  { value: 'wouldnt_return', label: "Wouldn't return" },
];

const TONE_COLORS: Record<EmotionTier, { bg: string; text: string }> = {
  loved: { bg: 'rgba(110,15,26,0.04)', text: Colors.accent },
  nice: { bg: 'rgba(0,0,0,0.02)', text: Colors.text },
  wouldnt_return: { bg: 'rgba(0,0,0,0.015)', text: Colors.textSecondary },
};

export function EmotionPicker({ selected, onSelect }: EmotionPickerProps) {
  return (
    <View style={styles.container}>
      {OPTIONS.map((option) => {
        const isSelected = selected === option.value;
        const tone = TONE_COLORS[option.value];
        return (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.option,
              { backgroundColor: tone.bg },
              isSelected && styles.optionSelected,
            ]}
            onPress={() => onSelect(option.value)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.label,
                { color: tone.text },
                isSelected && styles.labelSelected,
              ]}
            >
              {option.label}
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
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.04)',
    borderRadius: Layout.borderRadius,
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  optionSelected: {
    borderColor: Colors.accent,
    backgroundColor: 'rgba(110,15,26,0.05)',
  },
  label: {
    fontSize: 19,
    fontWeight: '600',
    fontFamily: Typography.heading3.fontFamily,
  },
  labelSelected: {
    color: Colors.accent,
  },
});
