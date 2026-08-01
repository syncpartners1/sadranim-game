import type { Player, GameState, Tile } from '../types/game';

/**
 * Checks whether a player's shelf matches their secret mission card.
 * Rules:
 *   1. All 8 slots must be filled (no nulls).
 *   2. No PUSH placeholder active.
 *   3. At most 1 SALE (מבצע) tile allowed on the shelf!
 *   4. A SALE tile acts as a wildcard for ANY required product at its position.
 *   5. All other 7 slots must match the exact product required by the mission pattern.
 */
export function checkWin(player: Player, _state?: GameState): boolean {
  const { shelf, mission, hasPushPlaceholder } = player;
  if (!mission || hasPushPlaceholder) return false;
  if (shelf.some(t => t === null)) return false;

  const shelfTiles = shelf as Tile[];

  // Action tiles (SWITCH, STEAL, PUSH) cannot remain on shelf
  if (shelfTiles.some(t => t.type === 'SWITCH' || t.type === 'STEAL' || t.type === 'PUSH')) {
    return false;
  }

  // RULE: Maximum 1 SALE tile per shelf
  const saleTiles = shelfTiles.filter(t => t.type === 'SALE');
  if (saleTiles.length > 1) return false;

  let productMismatches = 0;
  for (let i = 0; i < 8; i++) {
    const tile = shelfTiles[i];
    const targetProduct = mission.pattern[i];

    if (tile.type === 'SALE') {
      // SALE tile replaces whichever product is required at position i (Wildcard)
      continue;
    } else if (tile.type === 'PRODUCT' && tile.productId === targetProduct) {
      // Correct matching product
      continue;
    } else {
      // Product mismatch or invalid tile
      productMismatches++;
    }
  }

  return productMismatches === 0;
}

/**
 * Returns matching status for each slot on the shelf (for UI feedback)
 */
export function getSlotMatches(player: Player): boolean[] {
  if (!player.mission) return Array(8).fill(false);
  return player.shelf.map((tile, i) => {
    if (!tile) return false;
    if (tile.type === 'SALE') return true; // Wildcard
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
