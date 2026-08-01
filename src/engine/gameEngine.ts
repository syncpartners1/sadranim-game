import type { GameState, Player, Tile, GameSettings, ActionPhase } from '../types/game';
import { createTilePool, MISSION_CARDS, PUSH_PLACEHOLDER } from '../data/tiles';
import { checkWin, getPreviousPlayerIndex } from './validators.ts';
import { generateRoomCode } from '../services/roomSync';
import { BOT_PROFILES } from './aiPlayer';

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
  const { playerCount, humanCount, aiLevel, roomCode: existingRoomCode } = settings;
  let drawPool = shuffle(createTilePool());
  const missionsPool = shuffle([...MISSION_CARDS]);
  const roomCode = existingRoomCode || generateRoomCode();

  const players: Player[] = Array.from({ length: playerCount }, (_, i) => {
    const isHuman = i < humanCount;
    const botProfile = BOT_PROFILES[(i - humanCount) % BOT_PROFILES.length];

    return {
      id: `player-${i}`,
      name: isHuman ? (i === 0 ? 'You' : `Player ${i + 1}`) : (botProfile?.name || `Bot ${i - humanCount + 1}`),
      type: (isHuman ? 'HUMAN' : 'AI') as Player['type'],
      wasHuman: isHuman,
      aiLevel: isHuman ? undefined : aiLevel,
      aiPersonality: isHuman ? undefined : (botProfile?.personality || 'BUILDER'),
      isHost: i === 0,
      isReady: true,
      lastActiveTimestamp: Date.now(),
      shelf: Array(8).fill(null) as (Tile | null)[],
      mission: null,
      discardPile: [],
      score: 0,
      hasPushPlaceholder: false,
      pushSlotIndex: null,
    };
  });

  for (const player of players) {
    const shelf: (Tile | null)[] = [];
    while (shelf.length < 8) {
      const tile = drawPool.pop()!;
      if (tile.type === 'PUSH' || tile.type === 'SWITCH') {
        drawPool.unshift(tile);
      } else {
        shelf.push({ ...tile });
      }
    }
    player.shelf = shelf;
  }

  for (const player of players) {
    player.mission = missionsPool.pop()!;
  }

  return {
    gameId: generateId(),
    roomCode,
    players,
    currentTurnIndex: 0,
    drawPool,
    allDiscarded: [],
    missionsPool,
    usedMissions: [],
    gameStatus: humanCount > 1 ? 'WAITING_FOR_READIES' : 'PLAYING',
    roundNumber: 1,
    winnerId: null,
    overallWinnerId: null,
    drawnTile: null,
    drawnFromDiscard: false,
    actionPhase: 'IDLE',
    turnStartTimestamp: Date.now(),
    selectedOwnSlot: null,
    selectedTargetPlayerId: null,
    selectedTargetSlot: null,
    lastAction: null,
  };
}

export function convertHumanToAI(state: GameState, playerId: string): GameState {
  const players = state.players.map(p => {
    if ((p.id === playerId || p.wasHuman) && p.type === 'HUMAN') {
      const cleanName = p.name.replace(/\s*\(Bot\)/i, '');
      return {
        ...p,
        name: `${cleanName} (Bot)`,
        type: 'AI' as const,
        wasHuman: true,
        aiLevel: 'MEDIUM' as const,
        aiPersonality: 'ADAPTIVE' as const,
      };
    }
    return p;
  });

  return {
    ...state,
    players,
    lastAction: 'afk_convert_ai',
  };
}

export function convertAIToHuman(state: GameState, playerId: string): GameState {
  const players = state.players.map(p => {
    if ((p.id === playerId || p.wasHuman) && p.type === 'AI') {
      const cleanName = p.name.replace(/\s*\(Bot\)/i, '');
      return {
        ...p,
        name: cleanName || 'You',
        type: 'HUMAN' as const,
        wasHuman: true,
        aiLevel: undefined,
        aiPersonality: undefined,
        lastActiveTimestamp: Date.now(),
      };
    }
    return p;
  });

  return {
    ...state,
    players,
    turnStartTimestamp: Date.now(),
    lastAction: 'reclaim_human',
  };
}

export function drawFromPool(state: GameState): GameState {
  let pool = [...state.drawPool];
  let allDiscarded = [...state.allDiscarded];

  if (pool.length === 0) {
    pool = shuffle([...allDiscarded, ...state.players.flatMap(p => p.discardPile)]);
    allDiscarded = [];
  }

  const rawTile = pool.pop()!;
  const tile: Tile = {
    id: rawTile.id,
    type: rawTile.type,
    productId: rawTile.productId,
    name: rawTile.name,
    nameHe: rawTile.nameHe,
    imageFile: rawTile.imageFile,
  };
  const currentPlayer = state.players[state.currentTurnIndex];

  let actionPhase: ActionPhase = 'TILE_DRAWN';
  if (currentPlayer.hasPushPlaceholder) {
    actionPhase = 'PUSH_RESOLVE';
  } else if (tile.type === 'SWITCH') {
    // Step 1: Select target tile on neighbour shelf FIRST
    actionPhase = 'SWITCH_SELECT_TARGET';
  } else if (tile.type === 'PUSH') {
    // Step 1: Select target tile on neighbour shelf FIRST
    actionPhase = 'PUSH_SELECT_TARGET';
  }

  return checkAnyPlayerWin({
    ...state,
    drawPool: pool,
    allDiscarded,
    drawnTile: tile,
    drawnFromDiscard: false,
    actionPhase,
    selectedOwnSlot: null,
    selectedTargetPlayerId: null,
    selectedTargetSlot: null,
    lastAction: 'draw_pool'
  });
}

export function drawFromNeighbourDiscard(state: GameState): GameState {
  const players = state.players.map(p => ({ ...p, discardPile: [...p.discardPile] }));
  const prevIdx = getPreviousPlayerIndex(state);
  
  if (players[prevIdx].discardPile.length === 0) return state;

  const rawTile = players[prevIdx].discardPile.shift()!;
  const tile: Tile = {
    id: rawTile.id,
    type: rawTile.type,
    productId: rawTile.productId,
    name: rawTile.name,
    nameHe: rawTile.nameHe,
    imageFile: rawTile.imageFile,
  };
  const currentPlayer = players[state.currentTurnIndex];

  let actionPhase: ActionPhase = 'TILE_DRAWN';
  if (currentPlayer.hasPushPlaceholder) actionPhase = 'PUSH_RESOLVE';
  else if (tile.type === 'SWITCH') actionPhase = 'SWITCH_SELECT_TARGET';
  else if (tile.type === 'PUSH') actionPhase = 'PUSH_SELECT_TARGET';

  return checkAnyPlayerWin({
    ...state,
    players,
    drawnTile: tile,
    drawnFromDiscard: true,
    actionPhase,
    selectedOwnSlot: null,
    selectedTargetPlayerId: null,
    selectedTargetSlot: null,
    lastAction: 'draw_discard'
  });
}

export function placeTileOnShelf(state: GameState, slotIndex: number): GameState {
  if (!state.drawnTile) return state;
  const players = state.players.map(p => ({ ...p, shelf: [...p.shelf], discardPile: [...p.discardPile] }));
  const player = players[state.currentTurnIndex];

  if (state.drawnTile.type === 'SALE') {
    const existingSaleIndex = player.shelf.findIndex(t => t?.type === 'SALE');
    if (existingSaleIndex >= 0 && existingSaleIndex !== slotIndex) {
      return state;
    }
  }

  const tileToPlace: Tile = {
    id: state.drawnTile.id,
    type: state.drawnTile.type,
    productId: state.drawnTile.productId,
    name: state.drawnTile.name,
    nameHe: state.drawnTile.nameHe,
    imageFile: state.drawnTile.imageFile,
  };
  const displaced = player.shelf[slotIndex];

  player.shelf[slotIndex] = tileToPlace;

  // When resolving PUSH, clear the placeholder and discard the used PUSH tile
  if (state.actionPhase === 'PUSH_RESOLVE' && player.hasPushPlaceholder) {
    player.hasPushPlaceholder = false;
    player.pushSlotIndex = null;
  }

  // The displaced tile is added to discard pile (if not a push placeholder)
  if (displaced && displaced.type !== 'PUSH') {
    player.discardPile = [{ ...displaced }, ...player.discardPile];
  }

  players[state.currentTurnIndex] = player;
  const next = {
    ...state,
    players,
    drawnTile: null,
    drawnFromDiscard: false,
    actionPhase: 'IDLE' as ActionPhase
  };
  return checkAndAdvance(next);
}

export function swapOwnShelfSlots(state: GameState, slotA: number, slotB: number): GameState {
  if (slotA === slotB) return state;
  const players = state.players.map(p => ({ ...p, shelf: [...p.shelf] }));
  const player = players[state.currentTurnIndex];

  const temp = player.shelf[slotA] ? { ...player.shelf[slotA]! } : null;
  player.shelf[slotA] = player.shelf[slotB] ? { ...player.shelf[slotB]! } : null;
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
  if (!state.drawnTile || state.drawnFromDiscard) return state;

  const players = state.players.map(p => ({ ...p, discardPile: [...p.discardPile] }));
  players[state.currentTurnIndex].discardPile = [{ ...state.drawnTile }, ...players[state.currentTurnIndex].discardPile];
  return advanceTurn({ ...state, players, drawnTile: null, drawnFromDiscard: false, actionPhase: 'IDLE' as ActionPhase });
}

/**
 * SWITCH Action Execution:
 * Swaps a selected tile from neighbour shelf with a selected tile from own shelf.
 * The played SWITCH tile is removed/discarded to the player's discard pile.
 */
export function executeSwitchAction(state: GameState, ownSlot: number, targetId: string, targetSlot: number): GameState {
  const players = state.players.map(p => ({ ...p, shelf: [...p.shelf], discardPile: [...p.discardPile] }));
  const cur = players[state.currentTurnIndex];
  const tIdx = players.findIndex(p => p.id === targetId);
  if (tIdx < 0) return state;
  const tgt = players[tIdx];

  const ownTile = cur.shelf[ownSlot] ? { ...cur.shelf[ownSlot]! } : null;
  const targetTile = tgt.shelf[targetSlot] ? { ...tgt.shelf[targetSlot]! } : null;

  cur.shelf[ownSlot] = targetTile;
  tgt.shelf[targetSlot] = ownTile;

  // Discard the played SWITCH tile so it is removed from active use
  if (state.drawnTile) {
    cur.discardPile = [{ ...state.drawnTile }, ...cur.discardPile];
  }

  players[state.currentTurnIndex] = cur;
  players[tIdx] = tgt;

  return checkAndAdvance({
    ...state,
    players,
    drawnTile: null,
    drawnFromDiscard: false,
    actionPhase: 'IDLE' as ActionPhase,
    selectedOwnSlot: null,
    selectedTargetPlayerId: null,
    selectedTargetSlot: null,
    lastAction: 'switch'
  });
}

/**
 * PUSH Action Execution:
 * Places the PUSH tile onto the target slot of the relevant neighbour's shelf.
 * Displaces the neighbour's existing tile to that neighbour's discard pile.
 */
export function executePushAction(state: GameState, targetId: string, targetSlot: number): GameState {
  const players = state.players.map(p => ({ ...p, shelf: [...p.shelf], discardPile: [...p.discardPile] }));
  const cur = players[state.currentTurnIndex];
  const tIdx = players.findIndex(p => p.id === targetId);
  if (tIdx < 0) return state;
  const tgt = players[tIdx];

  const displaced = tgt.shelf[targetSlot];
  if (displaced && displaced.type !== 'PUSH') {
    tgt.discardPile = [{ ...displaced }, ...tgt.discardPile];
  }

  const pushTile = state.drawnTile ? { ...state.drawnTile } : { ...PUSH_PLACEHOLDER, id: `push-ph-${generateId()}` };
  tgt.shelf[targetSlot] = pushTile;
  tgt.hasPushPlaceholder = true;
  tgt.pushSlotIndex = targetSlot;

  players[state.currentTurnIndex] = cur;
  players[tIdx] = tgt;

  return checkAndAdvance({
    ...state,
    players,
    drawnTile: null,
    drawnFromDiscard: false,
    actionPhase: 'IDLE' as ActionPhase,
    selectedOwnSlot: null,
    selectedTargetPlayerId: null,
    selectedTargetSlot: null,
    lastAction: 'push'
  });
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
  return {
    ...state,
    currentTurnIndex: next,
    actionPhase: 'IDLE',
    drawnTile: null,
    drawnFromDiscard: false,
    turnStartTimestamp: Date.now(),
    lastAction: null
  };
}

function endRound(state: GameState, winnerId: string): GameState {
  const players = state.players.map(p => ({ ...p, score: p.id === winnerId ? p.score + 1 : p.score }));
  const usedMissions = [...state.usedMissions, ...players.map(p => p.mission!).filter(Boolean)];
  const newMissionsPool = [...state.missionsPool];

  if (newMissionsPool.length < players.length) {
    const overall = [...players].sort((a, b) => b.score - a.score)[0];
    return {
      ...state,
      players,
      usedMissions,
      gameStatus: 'GAME_OVER',
      winnerId,
      overallWinnerId: overall.id,
      missionsPool: [],
      lastAction: 'game_over'
    };
  }

  const allTiles = shuffle(createTilePool());

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
      if (tile.type === 'PUSH' || tile.type === 'SWITCH') {
        drawPool.unshift(tile);
      } else {
        shelf.push({ ...tile });
      }
    }
    rp.shelf = shelf;
  }

  return {
    ...state,
    players: resetPlayers,
    currentTurnIndex: 0,
    drawPool,
    allDiscarded: [],
    missionsPool: newMissionsPool,
    usedMissions,
    gameStatus: 'ROUND_OVER',
    roundNumber: state.roundNumber + 1,
    winnerId,
    overallWinnerId: null,
    drawnTile: null,
    drawnFromDiscard: false,
    actionPhase: 'IDLE',
    turnStartTimestamp: Date.now(),
    lastAction: 'round_over'
  };
}

export function startNextRound(state: GameState): GameState {
  return { ...state, gameStatus: 'PLAYING', winnerId: null, turnStartTimestamp: Date.now(), lastAction: null };
}
