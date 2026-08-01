import type { GameState, Player, Tile, AIPersonality } from '../types/game';
import {
  drawFromPool,
  drawFromNeighbourDiscard,
  placeTileOnShelf,
  discardDrawnTile,
  executeSwitchAction,
  executePushAction
} from './gameEngine';
import { getPreviousPlayerIndex, getAdjacentPlayerIndices } from './validators';

export const BOT_PROFILES: { name: string; personality: AIPersonality; description: string }[] = [
  { name: 'רוני הסדרן', personality: 'BUILDER', description: 'מתמקד בלסיים את המשחק על ידי השלמת המדף שלו כעדיפות עליונה' },
  { name: 'דני המפריע', personality: 'DISRUPTOR', description: 'מתמקד בלמנוע משחקנים אחרים להשלים את כרטיסי המשימות שלהם' },
  { name: 'אלון האדפטיבי', personality: 'ADAPTIVE', description: 'משנה אסטרטגיה ויעדים בכל סבב משחק' },
];

/**
 * Main AI decision engine. Fast execution guaranteed (< 1 second).
 */
export function aiTakeTurn(state: GameState): GameState {
  const player = state.players[state.currentTurnIndex];
  if (player.type !== 'AI') return state;

  const personality = getActivePersonality(player, state);

  // 1. Resolve pending PUSH placeholder on own shelf
  if (state.actionPhase === 'PUSH_RESOLVE' && player.pushSlotIndex !== null) {
    return placeTileOnShelf(state, player.pushSlotIndex);
  }

  // 2. Resolve pending SWITCH action
  if (state.actionPhase === 'SWITCH_SELECT_OWN' || state.actionPhase === 'SWITCH_SELECT_TARGET') {
    return aiExecuteSwitch(state, player, personality);
  }

  // 3. Resolve pending PUSH action
  if (state.actionPhase === 'PUSH_SELECT_TARGET') {
    return aiExecutePush(state, player, personality);
  }

  // 4. Handle drawn tile decision (place vs discard)
  const tile = state.drawnTile;
  if (!tile) {
    // If IDLE, decide whether to draw from previous neighbour discard or central pool
    return aiDecideDrawSource(state, player, personality);
  }

  // Handle SALE wildcard tile
  if (tile.type === 'SALE') {
    const existingSale = player.shelf.some(t => t?.type === 'SALE');
    if (existingSale) {
      return discardDrawnTile(state);
    }
    const slot = findWorstSlot(player);
    return slot >= 0 ? placeTileOnShelf(state, slot) : discardDrawnTile(state);
  }

  // Handle PRODUCT tile
  if (tile.type === 'PRODUCT' && player.mission) {
    // Check if product matches any unfulfilled slot in mission pattern
    for (let i = 0; i < 8; i++) {
      if (tile.productId === player.mission.pattern[i] && player.shelf[i]?.productId !== player.mission.pattern[i]) {
        return placeTileOnShelf(state, i);
      }
    }

    // Builder or Adaptive may place even if replacing non-matching product
    if (personality === 'BUILDER' || (personality === 'ADAPTIVE' && state.roundNumber % 2 === 1)) {
      const slot = findWorstSlot(player);
      if (slot >= 0) return placeTileOnShelf(state, slot);
    }
  }

  return discardDrawnTile(state);
}

/**
 * AI decides whether to draw from previous neighbour discard or central pool
 */
function aiDecideDrawSource(state: GameState, player: Player, personality: AIPersonality): GameState {
  const prevIdx = getPreviousPlayerIndex(state);
  const prevNeighbour = state.players[prevIdx];
  const topDiscard = prevNeighbour?.discardPile?.[0];

  if (topDiscard && player.mission) {
    if (topDiscard.type === 'SALE') {
      if (!player.shelf.some(t => t?.type === 'SALE')) {
        return drawFromNeighbourDiscard(state);
      }
    } else if (topDiscard.type === 'SWITCH' || topDiscard.type === 'PUSH') {
      if (personality === 'DISRUPTOR' || personality === 'ADAPTIVE') {
        return drawFromNeighbourDiscard(state);
      }
    } else if (topDiscard.type === 'PRODUCT') {
      for (let i = 0; i < 8; i++) {
        if (topDiscard.productId === player.mission.pattern[i] && player.shelf[i]?.productId !== player.mission.pattern[i]) {
          return drawFromNeighbourDiscard(state);
        }
      }
    }
  }

  return drawFromPool(state);
}

function aiExecuteSwitch(state: GameState, player: Player, personality: AIPersonality): GameState {
  const opps = state.players.filter(p => p.id !== player.id);
  if (!player.mission || opps.length === 0) return discardDrawnTile(state);

  // BUILDER / ADAPTIVE: Look for a tile on opponent shelf that matches AI's mission
  for (let mySlot = 0; mySlot < 8; mySlot++) {
    const needed = player.mission.pattern[mySlot];
    if (player.shelf[mySlot]?.productId === needed) continue;

    for (const opp of opps) {
      const targetSlot = opp.shelf.findIndex(t => t?.productId === needed);
      if (targetSlot >= 0) {
        return executeSwitchAction(state, mySlot, opp.id, targetSlot);
      }
    }
  }

  // DISRUPTOR: Target the leading opponent's best matching tile
  if (personality === 'DISRUPTOR') {
    const leader = getLeadingOpponent(opps);
    if (leader && leader.mission) {
      const matchSlot = leader.shelf.findIndex((t, i) => t?.productId === leader.mission!.pattern[i]);
      const myWorst = findWorstSlot(player);
      if (matchSlot >= 0 && myWorst >= 0) {
        return executeSwitchAction(state, myWorst, leader.id, matchSlot);
      }
    }
  }

  // Fallback: Swap AI's worst slot with first opponent's tile
  const opp = opps[0];
  const targetSlot = opp.shelf.findIndex(t => t !== null);
  const myWorst = findWorstSlot(player);
  if (targetSlot >= 0 && myWorst >= 0) {
    return executeSwitchAction(state, myWorst, opp.id, targetSlot);
  }

  return discardDrawnTile(state);
}

function aiExecutePush(state: GameState, player: Player, personality: AIPersonality): GameState {
  const adjIdxs = getAdjacentPlayerIndices(state);
  const opps = adjIdxs.map(i => state.players[i]).filter(Boolean);
  if (opps.length === 0) return discardDrawnTile(state);

  // DISRUPTOR: Target the leading opponent's highest matching slot
  if (personality === 'DISRUPTOR' || personality === 'ADAPTIVE') {
    const leader = getLeadingOpponent(opps);
    if (leader && leader.mission) {
      const matchSlot = leader.shelf.findIndex((t, i) => t?.productId === leader.mission!.pattern[i]);
      if (matchSlot >= 0) {
        return executePushAction(state, leader.id, matchSlot);
      }
    }
  }

  // Fallback: Push any opponent's slot
  const opp = opps[0];
  const targetSlot = opp.shelf.findIndex(t => t !== null);
  if (targetSlot >= 0) {
    return executePushAction(state, opp.id, targetSlot);
  }

  return discardDrawnTile(state);
}

function getActivePersonality(player: Player, state: GameState): AIPersonality {
  if (player.aiPersonality === 'ADAPTIVE') {
    // Dynamic personality changing per round
    const mode = state.roundNumber % 3;
    if (mode === 1) return 'BUILDER';
    if (mode === 2) return 'DISRUPTOR';
    return 'BUILDER';
  }
  return player.aiPersonality || 'BUILDER';
}

function getLeadingOpponent(opponents: Player[]): Player {
  let leader = opponents[0];
  let maxMatches = -1;
  for (const opp of opponents) {
    if (!opp.mission) continue;
    const matches = opp.shelf.filter((t, i) => t?.productId === opp.mission!.pattern[i]).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      leader = opp;
    }
  }
  return leader;
}

function findWorstSlot(player: Player): number {
  if (!player.mission) return 0;
  for (let i = 0; i < 8; i++) {
    const t = player.shelf[i];
    if (t && t.type === 'PRODUCT' && t.productId !== player.mission.pattern[i]) return i;
  }
  return 0;
}
