import { Player, Transaction, PayoutResult, PlayerStat } from '../types';

export function calculatePayouts(players: Player[], nominalRatio: number): PayoutResult {
  // Filter active players
  const activePlayers = players.filter(p => p.active);

  let totalInitialChips = 0;
  let totalCurrentChips = 0;

  activePlayers.forEach(p => {
    totalInitialChips += p.initialChips;
    totalCurrentChips += p.currentChips;
  });

  const chipDiscrepancy = totalCurrentChips - totalInitialChips;
  
  // Effective Ratio Calculation
  // If chips are missing (discrepancy < 0), the remaining chips are worth MORE? 
  // Wait, let's check the logic from app.js:
  // totalPotValue = totalInitialChips * nominalRatio; (Total cash put in)
  // effectiveRatio = totalPotValue / totalCurrentChips;
  // If totalCurrentChips < totalInitialChips (chips missing), effectiveRatio > nominalRatio.
  // So chips are worth more. Correct.
  
  let effectiveRatio = nominalRatio;
  if (totalCurrentChips > 0 && Math.abs(chipDiscrepancy) > 0) {
    const totalPotValue = totalInitialChips * nominalRatio;
    effectiveRatio = totalPotValue / totalCurrentChips;
  } else if (totalCurrentChips === 0 && totalInitialChips > 0) {
    effectiveRatio = 0; // All lost
  }

  // Calculate Net Position
  const stats: PlayerStat[] = activePlayers.map(p => {
    const nominalBuyIn = p.initialChips * nominalRatio;
    // We use effectiveRatio for cashOut to balance the pot
    const cashOutValue = p.currentChips * effectiveRatio;
    const netCash = cashOutValue - nominalBuyIn;

    return {
      id: p.id,
      name: p.name,
      buyIn: nominalBuyIn,
      cashOut: cashOutValue,
      netCash: netCash
    };
  });

  // Sort Winners and Losers
  // Winners: netCash > 0
  // Losers: netCash < 0
  const winners = stats.filter(p => p.netCash > 0.005).sort((a, b) => b.netCash - a.netCash);
  const losers = stats.filter(p => p.netCash < -0.005).sort((a, b) => a.netCash - b.netCash);

  const transactions: Transaction[] = [];
  let winnerIdx = 0;
  let loserIdx = 0;

  // Mutable balances
  const winnerBalances = winners.map(w => w.netCash);
  const loserBalances = losers.map(l => Math.abs(l.netCash));

  while (winnerIdx < winners.length && loserIdx < losers.length) {
    const amountOwed = loserBalances[loserIdx];
    const amountToReceive = winnerBalances[winnerIdx];

    const settlementAmount = Math.min(amountOwed, amountToReceive);

    if (settlementAmount > 0.005) {
      transactions.push({
        from: losers[loserIdx].name,
        to: winners[winnerIdx].name,
        amount: parseFloat(settlementAmount.toFixed(2))
      });
    }

    loserBalances[loserIdx] -= settlementAmount;
    winnerBalances[winnerIdx] -= settlementAmount;

    if (loserBalances[loserIdx] < 0.005) loserIdx++;
    if (winnerBalances[winnerIdx] < 0.005) winnerIdx++;
  }

  return {
    transactions,
    effectiveRatio,
    discrepancy: chipDiscrepancy,
    playerStats: stats
  };
}

