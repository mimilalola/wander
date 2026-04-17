export type Tier = 'loved' | 'nice' | 'wouldnt';

export const TIER_BOUNDS: Record<Tier, { min: number; max: number }> = {
  loved: { min: 6.6, max: 10.0 },
  nice: { min: 3.4, max: 6.5 },
  wouldnt: { min: 0.0, max: 3.3 },
};

/**
 * Map a 1–10 user rating to a tier.
 *  7–10 → "Loved it"       (rank 6.6–10.0)
 *  4–6  → "It was nice"    (rank 3.4–6.5)
 *  1–3  → "Wouldn't return" (rank 0.0–3.3)
 */
export function getTier(rating: number): Tier {
  if (rating >= 7) return 'loved';
  if (rating >= 4) return 'nice';
  return 'wouldnt';
}

/**
 * Compute the insertion score for a newly ranked hotel.
 *
 * Algorithm:
 *  1. If this is the first hotel in the tier → assign the tier's maximum (10.0 for "loved").
 *  2. Derive upper/lower bounds from comparison results:
 *       upper = lowest score among hotels that beat the new hotel
 *       lower = highest score among hotels the new hotel beat
 *  3. Score = midpoint of (upper, lower), rounded to 1 decimal, clamped to tier bounds.
 *  4. Edge cases:
 *       • New hotel beat everyone (upper = null) → tier max (10.0 for loved).
 *       • New hotel lost to everyone (lower = null) → midpoint of (upper, tierMin).
 *       • No comparisons at all → place at bottom of existing tier scores.
 *
 * Only 1 decimal place is kept. Scores always stay within the tier's [min, max] range.
 */
export function computeInsertionScore(
  winnerScores: number[],  // scores of hotels the new hotel beat
  loserScores: number[],   // scores of hotels that beat the new hotel
  tier: Tier,
  allTierScores: number[]  // all existing scores within this tier, sorted desc
): number {
  const bounds = TIER_BOUNDS[tier];
  const sorted = [...allTierScores].sort((a, b) => b - a);

  // First hotel in this tier → assign tier max
  if (sorted.length === 0) {
    return bounds.max;
  }

  const effectiveUpper = loserScores.length > 0 ? Math.min(...loserScores) : null;
  const effectiveLower = winnerScores.length > 0 ? Math.max(...winnerScores) : null;

  // No useful comparison data → insert at midpoint between tier bottom and tier minimum.
  // This follows the same insertion logic as all other placements: score = midpoint of
  // the two surrounding values (the current bottom score and the tier floor).
  if (effectiveUpper === null && effectiveLower === null) {
    const minInTier = sorted[sorted.length - 1];
    const score = Math.round(((minInTier + bounds.min) / 2) * 10) / 10;
    return Math.max(bounds.min, score);
  }

  // New hotel beat everyone it compared against → top of tier
  if (effectiveUpper === null) {
    return bounds.max;
  }

  // New hotel lost to everyone → below the lowest hotel that beat it
  if (effectiveLower === null) {
    const score = Math.round(((effectiveUpper + bounds.min) / 2) * 10) / 10;
    return Math.max(bounds.min, score);
  }

  // Normal case: insert between two known scores
  const score = Math.round(((effectiveUpper + effectiveLower) / 2) * 10) / 10;
  return Math.max(bounds.min, Math.min(bounds.max, score));
}
