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
