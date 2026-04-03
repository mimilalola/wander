import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/colors';

interface RatingSliderProps {
  value: number | null;
  onChange: (value: number) => void;
}

export function RatingSlider({ value, onChange }: RatingSliderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.numbersRow}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <TouchableOpacity
            key={n}
            style={[styles.numberBox, value === n && styles.selected]}
            onPress={() => onChange(n)}
            activeOpacity={0.7}
          >
            <Text style={[styles.number, value === n && styles.selectedNumber]}>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.labelsRow}>
        <Text style={styles.label}>Not great</Text>
        <Text style={styles.label}>Outstanding</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  numbersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  numberBox: {
    width: 32,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.borderLight,
  },
  selected: {
    backgroundColor: Colors.accent,
  },
  number: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  selectedNumber: {
    color: Colors.white,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  label: {
    fontSize: 11,
    color: Colors.textLight,
  },
});
