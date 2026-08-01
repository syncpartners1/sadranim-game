import type { GameState, Player, Tile, GameSettings, ActionPhase } from '../types/game';
import { FULL_TILE_POOL, MISSION_CARDS, PUSH_PLACEHOLDER } from '../data/tiles';
import { checkWin } from './validators';

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 9);
}

export function setupGame(settings: GameSettings): GameState {
  const { playerCount, humanCount, aiLevel } = settings;
  let drawPool = shuffle([...FULL_TILE_POOL]);
  const missionsPool = shuffle([...MISSION_CARDS]);

  const players: Player[] = Array.from({ length: playerCount }, (_, i) => ({
    id: `player-${i}`,
    name: i < humanCount ? (i === 0 ? 'You' : `Player ${i + 1}`) : `Bot ${i - humanCount + 1}`,
    type: (i < humanCount ? 'HUMAN' : 'AI') as Player['type'],
    aiLevel: i < humanCount ? undefined : aiLevel,
    shelf: Array(8).fill(null) as (Tile | null)[],
    mission: null,
    discardPile: [],
    score: 0,
    hasPushPlaceholder: false,
    pushSlotIndex: null,
  }));

  for (const player of players) {
    const shelf: (Tile | null)[] = [];
    while (shelf.length < 8) {
      const tile = drawPool.pop()!;
      if (tile.type === 'PUSH' || tile.type === 'SWITCH' || tile.type === 'STEAL') {
        drawPool.unshift(tile);
      } else {
        shelf.push(tile);
      }
    }
    player.shelf = shelf;
  }

  for (const player of players) {
    player.mission = missionsPool.pop()!;
  }

  return {
    gameId: generateId(),
    players,
    currentTurnIndex: 0,
    drawPool,
    allDiscarded: [],
    missionsPool,
    usedMissions: [],
    gameStatus: 'PLAYING',
    roundNumber: 1,
    winnerId: null,
    overallWinnerId: null,
    drawnTile: null,
    actionPhase: 'IDLE',
    selectedOwnSlot: null,
    selectedTargetPlayerId: null,
    selectedTargetSlot: null,
    lastAction: null,
  };
}

export function drawFromPool(state: GameState): GameState {
  let pool = [...state.drawPool];
  let allDiscarded = [...state.allDiscarded];

  if (pool.length === 0) {
    pool = shuffle([...allDiscarded, ...state.players.flatMap(p => p.discardPile)]);
    allDiscarded = [];
  }

  const tile = pool.pop()!;
  const currentPlayer = state.players[state.currentTurnIndex];

  let actionPhase: ActionPhase = 'TILE_DRAWN';
  if (currentPlayer.hasPushPlaceholder) {
    actionPhase = 'PUSH_RESOLVE';
  } else if (tile.type === 'SWITCH') {
    actionPhase = 'SWITCH_SELECT_OWN';
  } else if (tile.type === 'STEAL') {
    actionPhase = 'STEAL_SELECT_TARGET';
  } else if (tile.type === 'PUSH') {
    actionPhase = 'PUSH_SELECT_TARGET';
  }

  return checkAnyPlayerWin({ ...state, drawPool: pool, allDiscarded, drawnTile: tile, actionPhase, lastAction: 'draw_pool' });
}

export function drawFromNeighbourDiscard(state: GameState): GameState {
  const players = state.players.map(p => ({ ...p, discardPile: [...p.discardPile] }));
  const rightIdx = (state.currentTurnIndex + 1) % players.length;
  if (players[rightIdx].discardPile.length === 0) return state;

  const tile = players[rightIdx].discardPile.shift()!;
  const currentPlayer = players[state.currentTurnIndex];

  let actionPhase: ActionPhase = 'TILE_DRAWN';
  if (currentPlayer.hasPushPlaceholder) actionPhase = 'PUSH_RESOLVE';
  else if (tile.type === 'SWITCH') actionPhase = 'SWITCH_SELECT_OWN';
  else if (tile.type === 'STEAL') actionPhase = 'STEAL_SELECT_TARGET';
  else if (tile.type === 'PUSH') actionPhase = 'PUSH_SELECT_TARGET';

  return checkAnyPlayerWin({ ...state, players, drawnTile: tile, actionPhase, lastAction: 'draw_discard' });
}

export function placeTileOnShelf(state: GameState, slotIndex: number): GameState {
  if (!state.drawnTile) return state;
  const players = state.players.map(p => ({ ...p, shelf: [...p.shelf], discardPile: [...p.discardPile] }));
  const player = players[state.currentTurnIndex];

  if (state.actionPhase === 'PUSH_RESOLVE' && player.hasPushPlaceholder) {
    if (slotIndex !== player.pushSlotIndex) return state;
    const displaced = player.shelf[slotIndex];
    player.shelf[slotIndex] = state.drawnTile;
    player.hasPushPlaceholder = false;
    player.pushSlotIndex = null;
    if (displaced && displaced.type !== 'PUSH') {
      player.discardPile = [displaced, ...player.discardPile];
    }
  } else {
    const displaced = player.shelf[slotIndex];
    player.shelf[slotIndex] = state.drawnTile;
    if (displaced) player.discardPile = [displaced, ...player.discardPile];
  }

  players[state.currentTurnIndex] = player;
  const next = { ...state, players, drawnTile: null, actionPhase: 'IDLE' as ActionPhase };
  return checkAndAdvance(next);
}

export function swapOwnShelfSlots(state: GameState, slotA: number, slotB: number): GameState {
  if (slotA === slotB) return state;
  const players = state.players.map(p => ({ ...p, shelf: [...p.shelf] }));
  const player = players[state.currentTurnIndex];

  const temp = player.shelf[slotA];
  player.shelf[slotA] = player.shelf[slotB];
  player.shelf[slotB] = temp;

  if (player.hasPushPlaceholder) {
    if (player.pushSlotIndex === slotA) player.pushSlotIndex = slotB;
    else if (player.pushSlotIndex === slotB) player.pushSlotIndex = slotA;
  }

  players[state.currentTurnIndex] = player;
  const next = { ...state, players, lastAction: 'rearrange' };

  return checkAnyPlayerWin(next);
}

export function claimWin(state: GameState, playerId: string): GameState {
  const player = state.players.find(p => p.id === playerId);
  if (!player) return state;
  if (checkWin(player, state)) {
    return endRound(state, player.id);
  }
  return state;
}

export function discardDrawnTile(state: GameState): GameState {
  if (!state.drawnTile) return state;
  const players = state.players.map(p => ({ ...p, discardPile: [...p.discardPile] }));
  players[state.currentTurnIndex].discardPile = [state.drawnTile, ...players[state.currentTurnIndex].discardPile];
  return advanceTurn({ ...state, players, drawnTile: null, actionPhase: 'IDLE' as ActionPhase });
}

export function executeSwitchAction(state: GameState, ownSlot: number, targetId: string, targetSlot: number): GameState {
  const players = state.players.map(p => ({ ...p, shelf: [...p.shelf] }));
  const cur = players[state.currentTurnIndex];
  const tIdx = players.findIndex(p => p.id === targetId);
  if (tIdx < 0) return state;
  const tgt = players[tIdx];
  [cur.shelf[ownSlot], tgt.shelf[targetSlot]] = [tgt.shelf[targetSlot], cur.shelf[ownSlot]];
  players[state.currentTurnIndex] = cur;
  players[tIdx] = tgt;
  return checkAndAdvance({ ...state, players, drawnTile: null, actionPhase: 'IDLE' as ActionPhase, selectedOwnSlot: null, selectedTargetPlayerId: null, selectedTargetSlot: null, lastAction: 'switch' });
}

export function executeStealAction(state: GameState, targetId: string, targetSlot: number, ownSlot: number): GameState {
  const players = state.players.map(p => ({ ...p, shelf: [...p.shelf], discardPile: [...p.discardPile] }));
  const cur = players[state.currentTurnIndex];
  const tIdx = players.findIndex(p => p.id === targetId);
  if (tIdx < 0) return state;
  const tgt = players[tIdx];
  const stolen = tgt.shelf[targetSlot];
  if (!stolen) return state;
  const displaced = cur.shelf[ownSlot];
  cur.shelf[ownSlot] = stolen;
  tgt.shelf[targetSlot] = null;
  if (displaced) cur.discardPile = [displaced, ...cur.discardPile];
  players[state.currentTurnIndex] = cur;
  players[tIdx] = tgt;
  return checkAndAdvance({ ...state, players, drawnTile: null, actionPhase: 'IDLE' as ActionPhase, selectedOwnSlot: null, selectedTargetPlayerId: null, selectedTargetSlot: null, lastAction: 'steal' });
}

export function executePushAction(state: GameState, targetId: string, targetSlot: number): GameState {
  const players = state.players.map(p => ({ ...p, shelf: [...p.shelf], discardPile: [...p.discardPile] }));
  const tIdx = players.findIndex(p => p.id === targetId);
  if (tIdx < 0) return state;
  const tgt = players[tIdx];
  const pushed = tgt.shelf[targetSlot];
  if (!pushed) return state;
  tgt.discardPile = [pushed, ...tgt.discardPile];
  tgt.shelf[targetSlot] = { ...PUSH_PLACEHOLDER, id: `push-ph-${generateId()}` };
  tgt.hasPushPlaceholder = true;
  tgt.pushSlotIndex = targetSlot;
  players[tIdx] = tgt;
  return checkAndAdvance({ ...state, players, drawnTile: null, actionPhase: 'IDLE' as ActionPhase, selectedOwnSlot: null, selectedTargetPlayerId: null, selectedTargetSlot: null, lastAction: 'push' });
}

function checkAnyPlayerWin(state: GameState): GameState {
  for (const p of state.players) {
    if (checkWin(p, state)) {
      return endRound(state, p.id);
    }
  }
  return state;
}

function checkAndAdvance(state: GameState): GameState {
  for (const p of state.players) {
    if (checkWin(p, state)) return endRound(state, p.id);
  }
  return advanceTurn(state);
}

export function advanceTurn(state: GameState): GameState {
  const next = (state.currentTurnIndex + 1) % state.players.length;
  return { ...state, currentTurnIndex: next, actionPhase: 'IDLE', drawnTile: null, lastAction: null };
}

function endRound(state: GameState, winnerId: string): GameState {
  const players = state.players.map(p => ({ ...p, score: p.id === winnerId ? p.score + 1 : p.score }));
  const usedMissions = [...state.usedMissions, ...players.map(p => p.mission!).filter(Boolean)];
  const newMissionsPool = [...state.missionsPool];

  if (newMissionsPool.length < players.length) {
    const overall = [...players].sort((a, b) => b.score - a.score)[0];
    return { ...state, players, usedMissions, gameStatus: 'GAME_OVER', winnerId, overallWinnerId: overall.id, missionsPool: [], lastAction: 'game_over' };
  }

  const allTiles = shuffle([
    ...state.drawPool,
    ...state.allDiscarded,
    ...players.flatMap(p => [...p.discardPile, ...(p.shelf.filter(Boolean) as Tile[])]),
  ]);

  const resetPlayers = players.map(p => ({
    ...p,
    mission: newMissionsPool.pop() ?? null,
    shelf: Array(8).fill(null) as (Tile | null)[],
    discardPile: [],
    hasPushPlaceholder: false,
    pushSlotIndex: null,
  }));

  let drawPool = [...allTiles];
  for (const rp of resetPlayers) {
    const shelf: (Tile | null)[] = [];
    while (shelf.length < 8 && drawPool.length > 0) {
      const tile = drawPool.pop()!;
      if (tile.type === 'PUSH' || tile.type === 'SWITCH' || tile.type === 'STEAL') {
        drawPool.unshift(tile);
      } else {
        shelf.push(tile);
      }
    }
    rp.shelf = shelf;
  }

  return { ...state, players: resetPlayers, currentTurnIndex: 0, drawPool, allDiscarded: [], missionsPool: newMissionsPool, usedMissions, gameStatus: 'ROUND_OVER', roundNumber: state.roundNumber + 1, winnerId, overallWinnerId: null, drawnTile: null, actionPhase: 'IDLE', lastAction: 'round_over' };
}

export function startNextRound(state: GameState): GameState {
  return { ...state, gameStatus: 'PLAYING', winnerId: null, lastAction: null };
}
