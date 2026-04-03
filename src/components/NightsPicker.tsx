import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/colors';
import { Layout } from '../constants/layout';

interface NightsPickerProps {
  selected: number | null;
  onSelect: (nights: number) => void;
}

const NIGHT_OPTIONS = [1, 2, 3, 4, 5, 6, 7];

export function NightsPicker({ selected, onSelect }: NightsPickerProps) {
  return (
    <View style={styles.container}>
      {NIGHT_OPTIONS.map((n) => {
        const isSelected = selected === n;
        const label = n === 7 ? '7+' : String(n);
        return (
          <TouchableOpacity
            key={n}
            style={[styles.button, isSelected && styles.buttonSelected]}
            onPress={() => onSelect(n)}
            activeOpacity={0.7}
          >
            <Text style={[styles.text, isSelected && styles.textSelected]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    width: 42,
    height: 42,
    borderRadius: Layout.borderRadiusSmall,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent,
  },
  text: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
  },
  textSelected: {
    color: Colors.white,
  },
});
