export function formatPriceLevel(level: number | null): string {
  if (!level || level < 1) return '?';
  return '€'.repeat(Math.min(level, 5));
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
