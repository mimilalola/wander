import { Platform } from 'react-native';

const serifFont = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});

export const Typography = {
  heading1: {
    fontSize: 32,
    fontWeight: '700' as const,
    fontFamily: serifFont,
    letterSpacing: -0.5,
  },
  heading2: {
    fontSize: 24,
    fontWeight: '600' as const,
    fontFamily: serifFont,
    letterSpacing: -0.3,
  },
  heading3: {
    fontSize: 20,
    fontWeight: '600' as const,
    fontFamily: serifFont,
  },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  bodyBold: { fontSize: 15, fontWeight: '600' as const, lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: '400' as const },
  captionBold: { fontSize: 13, fontWeight: '600' as const },
  small: { fontSize: 11, fontWeight: '400' as const },
  editorial: {
    fontSize: 12,
    fontWeight: '500' as const,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
  },
};
