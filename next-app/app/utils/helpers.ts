import { Player, PayoutResult } from '../types';

export function generateShortGameId(length = 4): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 1, 0
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function calculateTotals(players: Player[]) {
    const totalStarting = players.reduce((sum, p) => sum + (p.initialChips || 0), 0);
    const totalCurrent = players.reduce((sum, p) => sum + (p.currentChips || 0), 0);
    const discrepancy = totalCurrent - totalStarting;
    return { totalStarting, totalCurrent, discrepancy };
}

