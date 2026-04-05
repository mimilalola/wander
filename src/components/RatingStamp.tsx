import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, Animated } from 'react-native';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

interface RatingStampProps {
  score: number | null;
  size?: 'small' | 'default' | 'large';
  animated?: boolean;
}

const SIZES = {
  small: { box: 36, fontSize: 14, borderWidth: 2 },
  default: { box: 52, fontSize: 20, borderWidth: 2.5 },
  large: { box: 88, fontSize: 32, borderWidth: 3 },
};

export function RatingStamp({ score, size = 'default', animated = false }: RatingStampProps) {
  const fadeAnim = useRef(new Animated.Value(animated ? 0 : 1)).current;
  const scaleAnim = useRef(new Animated.Value(animated ? 0.6 : 1)).current;

  useEffect(() => {
    if (animated && score !== null) {
      Animated.sequence([
        Animated.delay(150),
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 5,
            tension: 100,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [animated, score]);

  if (score === null) return null;

  const s = SIZES[size];
  // Deterministic irregularity from score
  const seedVal = Math.round(score * 10);
  const rotation = -1.2 - (seedVal % 7) * 0.3; // -1.2 to -3.0 deg
  const scoreOpacity = 0.85 + (seedVal % 4) * 0.03; // 0.85 to 0.94

  return (
    <Animated.View
      style={[
        styles.stamp,
        {
          width: s.box,
          height: s.box,
          borderRadius: s.box / 2,
          borderWidth: s.borderWidth,
          transform: [{ rotate: `${rotation}deg` }, { scale: scaleAnim }],
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
            opacity: scoreOpacity,
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
  },
});
