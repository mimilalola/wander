import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

interface SegmentControlProps {
  options: string[];
  selected: string;
  onChange: (option: string) => void;
}

export function SegmentControl({ options, selected, onChange }: SegmentControlProps) {
  return (
    <View style={styles.container}>
      {options.map((option) => {
        const isActive = selected === option;
        return (
          <TouchableOpacity
            key={option}
            style={[styles.segment, isActive && styles.active]}
            onPress={() => onChange(option)}
            activeOpacity={0.7}
          >
            <Text style={[styles.text, isActive && styles.activeText]}>{option}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  segment: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  active: {
    borderBottomColor: Colors.accent,
  },
  text: {
    fontSize: Typography.body.fontSize,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  activeText: {
    color: Colors.text,
    fontWeight: '600',
  },
});
