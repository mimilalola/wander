import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

interface RatingStampProps {
  score: number | null;
  size?: 'small' | 'default' | 'large';
  animated?: boolean;
}

const SIZES = {
  small: { box: 36, fontSize: 14, borderWidth: 1.5 },
  default: { box: 52, fontSize: 20, borderWidth: 2 },
  large: { box: 80, fontSize: 30, borderWidth: 2.5 },
};

export function RatingStamp({ score, size = 'default', animated = false }: RatingStampProps) {
  const fadeAnim = useRef(new Animated.Value(animated ? 0 : 1)).current;
  const scaleAnim = useRef(new Animated.Value(animated ? 0.85 : 1)).current;

  useEffect(() => {
    if (animated && score !== null) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [animated, score]);

  if (score === null) return null;

  const s = SIZES[size];

  return (
    <Animated.View
      style={[
        styles.stamp,
        {
          width: s.box,
          height: s.box,
          borderRadius: s.box / 2,
          borderWidth: s.borderWidth,
          transform: [{ rotate: '-2deg' }, { scale: scaleAnim }],
          opacity: fadeAnim,
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
    </Animated.View>
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
    opacity: 0.85,
  },
});
