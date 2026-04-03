import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/colors';

interface SegmentControlProps {
  options: string[];
  selected: string;
  onChange: (option: string) => void;
}

export function SegmentControl({ options, selected, onChange }: SegmentControlProps) {
  return (
    <View style={styles.container}>
      {options.map((option) => (
        <TouchableOpacity
          key={option}
          style={[styles.segment, selected === option && styles.active]}
          onPress={() => onChange(option)}
          activeOpacity={0.7}
        >
          <Text style={[styles.text, selected === option && styles.activeText]}>{option}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.borderLight,
    borderRadius: 10,
    padding: 3,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  active: {
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  activeText: {
    color: Colors.text,
  },
});
