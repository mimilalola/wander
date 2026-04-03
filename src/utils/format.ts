import type { EmotionTier } from '../types';

export function formatPriceLevel(level: number | null): string {
  if (!level || level < 1) return '?';
  return '\u20AC'.repeat(Math.min(level, 5));
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatRating(rating: number | null): string {
  if (rating === null) return '-';
  return rating.toFixed(1);
}

export function formatEmotion(emotion: EmotionTier | null): string {
  switch (emotion) {
    case 'loved':
      return 'Loved it';
    case 'nice':
      return 'It was nice';
    case 'wouldnt_return':
      return "Wouldn't return";
    default:
      return '';
  }
}

export function formatNights(nights: number | null): string {
  if (nights === null || nights <= 0) return '';
  return `${nights} night${nights !== 1 ? 's' : ''}`;
}
