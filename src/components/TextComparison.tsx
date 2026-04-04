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
        Is <Text style={styles.hotelName}>{hotelA}</Text> better than{' '}
        <Text style={styles.hotelName}>{hotelB}</Text>?
      </Text>
      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => onChoose('a')}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>Yes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => onChoose('b')}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>No</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 24,
    paddingHorizontal: Layout.padding,
    alignItems: 'center',
  },
  question: {
    fontSize: Typography.heading3.fontSize,
    fontFamily: Typography.heading3.fontFamily,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 32,
  },
  hotelName: {
    color: Colors.accent,
    fontWeight: '600',
  },
  buttons: {
    flexDirection: 'row',
    gap: 24,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderWidth: 1,
    borderColor: Colors.accent,
    borderRadius: Layout.borderRadius,
  },
  buttonText: {
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
    color: Colors.accent,
  },
});
