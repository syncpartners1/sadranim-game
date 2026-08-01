import type { GameState, Player } from '../types/game';
import { drawFromPool, placeTileOnShelf, discardDrawnTile, executeSwitchAction, executeStealAction, executePushAction } from './gameEngine';
import { getAdjacentPlayerIndices } from './validators';

export function aiTakeTurn(state: GameState): GameState {
  const player = state.players[state.currentTurnIndex];
  if (player.type !== 'AI') return state;

  if (state.actionPhase === 'PUSH_RESOLVE' && player.pushSlotIndex !== null) {
    return placeTileOnShelf(state, player.pushSlotIndex);
  }
  if (state.actionPhase === 'SWITCH_SELECT_OWN' || state.actionPhase === 'SWITCH_SELECT_TARGET') {
    return aiSwitch(state, player);
  }
  if (state.actionPhase === 'STEAL_SELECT_TARGET') {
    return aiSteal(state, player);
  }
  if (state.actionPhase === 'PUSH_SELECT_TARGET') {
    return aiPush(state, player);
  }

  const tile = state.drawnTile;
  if (!tile) return state;

  if (tile.type === 'SALE') {
    const slot = findWorstSlot(player);
    return slot >= 0 ? placeTileOnShelf(state, slot) : discardDrawnTile(state);
  }
  if (tile.type === 'PRODUCT' && player.mission) {
    for (let i = 0; i < 8; i++) {
      if (tile.productId === player.mission.pattern[i] && player.shelf[i]?.productId !== player.mission.pattern[i]) {
        return placeTileOnShelf(state, i);
      }
    }
    if (player.aiLevel === 'HARD') {
      const slot = findWorstSlot(player);
      if (slot >= 0) return placeTileOnShelf(state, slot);
    }
  }
  return discardDrawnTile(state);
}

function aiSwitch(state: GameState, player: Player): GameState {
  const opps = state.players.filter(p => p.id !== player.id);
  if (!player.mission) return discardDrawnTile(state);
  for (let mySlot = 0; mySlot < 8; mySlot++) {
    const needed = player.mission.pattern[mySlot];
    if (player.shelf[mySlot]?.productId === needed) continue;
    for (const opp of opps) {
      const theirSlot = opp.shelf.findIndex(t => t?.productId === needed);
      if (theirSlot >= 0) return executeSwitchAction(state, mySlot, opp.id, theirSlot);
    }
  }
  const opp = opps[0];
  if (opp) {
    const ts = opp.shelf.findIndex(t => t !== null);
    const ms = findWorstSlot(player);
    if (ts >= 0 && ms >= 0) return executeSwitchAction(state, ms, opp.id, ts);
  }
  return discardDrawnTile(state);
}

function aiSteal(state: GameState, player: Player): GameState {
  const opps = state.players.filter(p => p.id !== player.id);
  const myWorst = findWorstSlot(player);
  if (!player.mission || myWorst < 0) return discardDrawnTile(state);
  for (const opp of opps) {
    for (const needed of player.mission.pattern) {
      const ts = opp.shelf.findIndex(t => t?.productId === needed);
      if (ts >= 0) return executeStealAction(state, opp.id, ts, myWorst);
    }
  }
  const opp = opps[0];
  if (opp) {
    const ts = opp.shelf.findIndex(t => t !== null);
    if (ts >= 0) return executeStealAction(state, opp.id, ts, myWorst);
  }
  return discardDrawnTile(state);
}

function aiPush(state: GameState, player: Player): GameState {
  const adjIdxs = getAdjacentPlayerIndices(state);
  const opps = adjIdxs.map(i => state.players[i]).filter(Boolean);
  if (opps.length === 0) return discardDrawnTile(state);
  let bestOpp = opps[0];
  let bestScore = -1;
  for (const opp of opps) {
    if (!opp.mission) continue;
    const score = opp.shelf.filter((t, i) => t?.productId === opp.mission!.pattern[i]).length;
    if (score > bestScore) { bestScore = score; bestOpp = opp; }
  }
  const slot = bestOpp.shelf.findIndex((t, i) => t?.productId === bestOpp.mission?.pattern[i]);
  const fallback = bestOpp.shelf.findIndex(t => t !== null);
  const target = slot >= 0 ? slot : fallback;
  if (target < 0) return discardDrawnTile(state);
  return executePushAction(state, bestOpp.id, target);
}

function findWorstSlot(player: Player): number {
  if (!player.mission) return 0;
  for (let i = 0; i < 8; i++) {
    const t = player.shelf[i];
    if (t && t.type === 'PRODUCT' && t.productId !== player.mission.pattern[i]) return i;
  }
  return -1;
}
