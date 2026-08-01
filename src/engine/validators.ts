import type { Player, GameState, Tile } from '../types/game';

/**
 * Checks whether a player's shelf matches their secret mission card.
 * Rules:
 *   1. All 8 slots must be filled (no nulls).
 *   2. No PUSH placeholder active.
 *   3. At most 1 SALE tile allowed on the shelf.
 *   4. Every non-SALE slot must match the exact product required by the mission pattern.
 *   5. SALE tile acts as a wildcard for at most 1 slot.
 */
export function checkWin(player: Player, _state?: GameState): boolean {
  const { shelf, mission, hasPushPlaceholder } = player;
  if (!mission || hasPushPlaceholder) return false;
  if (shelf.some(t => t === null)) return false;

  const shelfTiles = shelf as Tile[];

  // Special tiles like SWITCH, STEAL, PUSH cannot remain on shelf
  if (shelfTiles.some(t => t.type === 'SWITCH' || t.type === 'STEAL' || t.type === 'PUSH')) {
    return false;
  }

  const saleTiles = shelfTiles.filter(t => t.type === 'SALE');
  if (saleTiles.length > 1) return false; // max 1 SALE tile

  let productMismatches = 0;
  for (let i = 0; i < 8; i++) {
    const tile = shelfTiles[i];
    const targetProduct = mission.pattern[i];

    if (tile.type === 'SALE') {
      // Wildcard slot — allowed if we have 1 SALE tile
      continue;
    } else if (tile.type === 'PRODUCT' && tile.productId === targetProduct) {
      // Matching product
      continue;
    } else {
      // Product mismatch or illegal tile
      productMismatches++;
    }
  }

  // A single SALE tile covers at most 1 mismatch
  return productMismatches <= (saleTiles.length === 1 ? 1 : 0);
}

/**
 * Returns matching status for each slot on the shelf (for UI feedback)
 */
export function getSlotMatches(player: Player): boolean[] {
  if (!player.mission) return Array(8).fill(false);
  return player.shelf.map((tile, i) => {
    if (!tile) return false;
    if (tile.type === 'SALE') return true;
    return tile.type === 'PRODUCT' && tile.productId === player.mission!.pattern[i];
  });
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
