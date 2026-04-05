import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { Layout } from '../constants/layout';

interface TextComparisonProps {
  hotelA: string;
  hotelB: string;
  onChoose: (winner: 'a' | 'b') => void;
}

export function TextComparison({ hotelA, hotelB, onChoose }: TextComparisonProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.question}>
        Did you prefer
      </Text>

      <TouchableOpacity
        style={styles.hotelOption}
        onPress={() => onChoose('a')}
        activeOpacity={0.7}
      >
        <Text style={styles.hotelName}>{hotelA}</Text>
      </TouchableOpacity>

      <Text style={styles.orText}>or</Text>

      <TouchableOpacity
        style={styles.hotelOption}
        onPress={() => onChoose('b')}
        activeOpacity={0.7}
      >
        <Text style={styles.hotelName}>{hotelB}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  question: {
    fontSize: Typography.body.fontSize,
    color: Colors.textSecondary,
    marginBottom: 32,
  },
  hotelOption: {
    width: '100%',
    paddingVertical: 24,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Layout.borderRadius,
    backgroundColor: Colors.white,
    alignItems: 'center',
  },
  hotelName: {
    ...Typography.heading3,
    color: Colors.text,
    textAlign: 'center',
  },
  orText: {
    fontSize: Typography.body.fontSize,
    color: Colors.textLight,
    marginVertical: 20,
  },
});
