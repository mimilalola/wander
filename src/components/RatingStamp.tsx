import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

interface RatingStampProps {
  score: number | null;
  size?: 'small' | 'default' | 'large';
}

const SIZES = {
  small: { box: 36, fontSize: 14, borderWidth: 1.5 },
  default: { box: 52, fontSize: 20, borderWidth: 2 },
  large: { box: 72, fontSize: 28, borderWidth: 2.5 },
};

export function RatingStamp({ score, size = 'default' }: RatingStampProps) {
  if (score === null) return null;

  const s = SIZES[size];

  return (
    <View
      style={[
        styles.stamp,
        {
          width: s.box,
          height: s.box,
          borderRadius: s.box / 2,
          borderWidth: s.borderWidth,
          transform: [{ rotate: '-2deg' }],
        },
      ]}
    >
      <Text
        style={[
          styles.score,
          {
            fontSize: s.fontSize,
            fontFamily: Typography.heading1.fontFamily,
          },
        ]}
      >
        {score.toFixed(1)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stamp: {
    borderColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  score: {
    color: Colors.accent,
    fontWeight: '700',
  },
});
