import type { Player, GameState, Tile } from '../types/game';

export function checkWin(player: Player, _state: GameState): boolean {
  const { shelf, mission, hasPushPlaceholder } = player;
  if (!mission || hasPushPlaceholder) return false;
  if (shelf.some(t => t === null)) return false;

  const shelfTiles = shelf as Tile[];
  const saleCount = shelfTiles.filter(t => t.type === 'SALE').length;
  if (saleCount > 1) return false;

  let mismatches = 0;
  for (let i = 0; i < 8; i++) {
    const t = shelfTiles[i];
    if (t.type !== 'PRODUCT' || t.productId !== mission.pattern[i]) mismatches++;
  }
  return mismatches <= saleCount;
}

export function getRightNeighbourIndex(state: GameState): number {
  return (state.currentTurnIndex + 1) % state.players.length;
}

export function getAdjacentPlayerIndices(state: GameState): number[] {
  const n = state.players.length;
  const cur = state.currentTurnIndex;
  return [...new Set([(cur - 1 + n) % n, (cur + 1) % n].filter(v => v !== cur))];
}

export function canDrawFromNeighbourDiscard(state: GameState): boolean {
  return state.players[getRightNeighbourIndex(state)].discardPile.length > 0;
}
