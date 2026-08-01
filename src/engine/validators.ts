import type { Player, GameState, Tile, ProductId } from '../types/game';

/**
 * Checks whether a player's shelf matches their secret mission card.
 * Rules:
 *   1. All 8 slots must be filled (no nulls).
 *   2. No PUSH placeholder active.
 *   3. At most 1 SALE (מבצע) tile allowed on the shelf.
 *   4. Action/Obstacle tiles (SWITCH, PUSH, EMPTYBOX) cannot remain on shelf for a win!
 *   5. A SALE tile acts as a wildcard for ANY required product on the mission card.
 */
export function checkWin(player: Player, _state?: GameState): boolean {
  const { shelf, mission, hasPushPlaceholder } = player;
  if (!mission || hasPushPlaceholder) return false;
  if (shelf.some(t => t === null)) return false;

  const shelfTiles = shelf as Tile[];

  // Action/Obstacle tiles (SWITCH, PUSH, EMPTYBOX) cannot remain on shelf for a win!
  if (shelfTiles.some(t => t.type === 'SWITCH' || t.type === 'PUSH' || t.type === 'EMPTYBOX')) {
    return false;
  }

  // RULE: Maximum 1 SALE tile per shelf
  const saleTiles = shelfTiles.filter(t => t.type === 'SALE');
  if (saleTiles.length > 1) return false;

  const saleCount = saleTiles.length;

  // 1. Direct Slot-by-Slot Alignment Check
  let slotMatches = 0;
  for (let i = 0; i < 8; i++) {
    const tile = shelfTiles[i];
    const targetProduct = mission.pattern[i];

    if (tile.type === 'SALE' || (tile.type === 'PRODUCT' && tile.productId === targetProduct)) {
      slotMatches++;
    }
  }

  if (slotMatches === 8) return true;

  // 2. Flexible Multiset Check (Supports SALE wildcard replacing any missing required product)
  const requiredCounts: Record<string, number> = {};
  for (const pid of mission.pattern) {
    requiredCounts[pid] = (requiredCounts[pid] || 0) + 1;
  }

  let matchedProductCount = 0;
  const availableProductCounts: Record<string, number> = {};
  for (const tile of shelfTiles) {
    if (tile.type === 'PRODUCT' && tile.productId) {
      availableProductCounts[tile.productId] = (availableProductCounts[tile.productId] || 0) + 1;
    }
  }

  for (const pid in requiredCounts) {
    const req = requiredCounts[pid];
    const avail = availableProductCounts[pid] || 0;
    matchedProductCount += Math.min(req, avail);
  }

  // If matched product tiles + SALE wildcard >= 8, it's a 100% valid WIN!
  return (matchedProductCount + saleCount) >= 8;
}

/**
 * Returns matching status for each slot on the shelf (for UI feedback)
 */
export function getSlotMatches(player: Player): boolean[] {
  if (!player.mission) return Array(8).fill(false);
  return player.shelf.map((tile, i) => {
    if (!tile) return false;
    if (tile.type === 'SALE') return true; // Wildcard
    if (tile.type === 'EMPTYBOX') return false; // Empty box obstacle cannot match
    return tile.type === 'PRODUCT' && tile.productId === player.mission!.pattern[i];
  });
}

export function getPreviousPlayerIndex(state: GameState): number {
  const n = state.players.length;
  return (state.currentTurnIndex - 1 + n) % n;
}

export function getAdjacentPlayerIndices(state: GameState): number[] {
  const n = state.players.length;
  const cur = state.currentTurnIndex;
  return [...new Set([(cur - 1 + n) % n, (cur + 1) % n].filter(v => v !== cur))];
}

export function canDrawFromNeighbourDiscard(state: GameState): boolean {
  const prevIdx = getPreviousPlayerIndex(state);
  return state.players[prevIdx]?.discardPile.length > 0;
}
