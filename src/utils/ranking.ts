import type { EmotionTier } from '../types';

const K_FACTOR = 32;

export function calculateElo(
  winnerRank: number,
  loserRank: number
): { newWinnerRank: number; newLoserRank: number } {
  const expectedWinner = 1 / (1 + Math.pow(10, (loserRank - winnerRank) / 400));
  const expectedLoser = 1 / (1 + Math.pow(10, (winnerRank - loserRank) / 400));

  const newWinnerRank = Math.round(winnerRank + K_FACTOR * (1 - expectedWinner));
  const newLoserRank = Math.round(loserRank + K_FACTOR * (0 - expectedLoser));

  return { newWinnerRank, newLoserRank };
}

const TIER_BANDS: Record<EmotionTier, { min: number; max: number }> = {
  loved: { min: 8.0, max: 10.0 },
  nice: { min: 5.0, max: 7.9 },
  wouldnt_return: { min: 1.0, max: 4.9 },
};

export function computeTierScore(
  rank: number,
  tierVisits: { rank: number | null }[],
  tier: EmotionTier
): number {
  const band = TIER_BANDS[tier];

  if (tierVisits.length <= 1) {
    return Math.round(((band.min + band.max) / 2) * 10) / 10;
  }

  const sorted = tierVisits
    .filter((v) => v.rank !== null)
    .sort((a, b) => (b.rank ?? 0) - (a.rank ?? 0));

  const index = sorted.findIndex((v) => v.rank === rank);
  if (index === -1) {
    return Math.round(((band.min + band.max) / 2) * 10) / 10;
  }

  const percentile = 1 - index / (sorted.length - 1 || 1);
  const score = band.min + percentile * (band.max - band.min);
  return Math.round(score * 10) / 10;
}
