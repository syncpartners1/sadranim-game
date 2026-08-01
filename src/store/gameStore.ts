import { create } from 'zustand';
import type { GameState, GameSettings, ActionPhase } from '../types/game';
import { setupGame, drawFromPool, drawFromNeighbourDiscard, placeTileOnShelf, discardDrawnTile, executeSwitchAction, executePushAction, startNextRound, swapOwnShelfSlots, claimWin as claimWinEngine, convertHumanToAI } from '../engine/gameEngine';
import { aiTakeTurn } from '../engine/aiPlayer';
import { saveRoomStateToFirestore, subscribeToRoomFirestore, fetchRoomStateFromFirestore } from '../services/roomSync';

interface GameStore {
  state: GameState | null;
  settings: GameSettings;
  isAIThinking: boolean;
  updateSettings: (s: Partial<GameSettings>) => void;
  startGame: () => void;
  joinRoom: (roomCode: string) => Promise<boolean>;
  togglePlayerReady: (playerId: string) => void;
  drawPool: () => void;
  drawNeighbourDiscard: () => void;
  placeOnShelf: (slot: number) => void;
  swapOwnSlots: (slotA: number, slotB: number) => void;
  claimWin: (playerId: string) => void;
  discardTile: () => void;
  selectOwnSlot: (slot: number) => void;
  selectTargetSlot: (playerId: string, slot: number) => void;
  confirmSwitch: () => void;
  confirmPush: () => void;
  continueAfterRound: () => void;
  resetGame: () => void;
  checkAFKTimeout: () => void;
  setTelegramUser: (user: GameState['telegramUser']) => void;
}

const DEFAULT: GameSettings = { playerCount: 2, humanCount: 1, aiLevel: 'MEDIUM', useTelegramNames: false };
const AI_DELAY = 900;
const AFK_TIMEOUT_MS = 300 * 1000;

let unsubscribeRoom: (() => void) | null = null;

export const useGameStore = create<GameStore>((set, get) => ({
  state: null,
  settings: DEFAULT,
  isAIThinking: false,

  updateSettings: (s) => set(st => ({ settings: { ...st.settings, ...s } })),

  startGame: () => {
    const s = setupGame(get().settings);
    set({ state: s });
    saveRoomStateToFirestore(s);
    setupFirestoreSubscription(s.roomCode, set, get);
    scheduleAI(s, set, get);
  },

  joinRoom: async (roomCode: string) => {
    const remoteState = await fetchRoomStateFromFirestore(roomCode);
    if (remoteState) {
      set({ state: remoteState, settings: { ...get().settings, roomCode } });
      setupFirestoreSubscription(roomCode, set, get);
      scheduleAI(remoteState, set, get);
      return true;
    }
    return false;
  },

  togglePlayerReady: (playerId: string) => {
    const { state } = get();
    if (!state) return;
    const players = state.players.map(p => p.id === playerId ? { ...p, isReady: !p.isReady } : p);
    const allReady = players.every(p => p.isReady);
    const nextStatus = allReady ? 'PLAYING' : 'WAITING_FOR_READIES';
    const s = { ...state, players, gameStatus: nextStatus as GameState['gameStatus'] };
    set({ state: s });
    saveRoomStateToFirestore(s);
    if (nextStatus === 'PLAYING') scheduleAI(s, set, get);
  },

  drawPool: () => {
    const { state } = get();
    if (!state || state.gameStatus !== 'PLAYING') return;
    const s = drawFromPool(state);
    set({ state: s });
    saveRoomStateToFirestore(s);
  },

  drawNeighbourDiscard: () => {
    const { state } = get();
    if (!state || state.gameStatus !== 'PLAYING') return;
    const s = drawFromNeighbourDiscard(state);
    set({ state: s });
    saveRoomStateToFirestore(s);
  },

  placeOnShelf: (slot) => {
    const { state } = get();
    if (!state) return;
    const s = placeTileOnShelf(state, slot);
    set({ state: s });
    saveRoomStateToFirestore(s);
    scheduleAI(s, set, get);
  },

  swapOwnSlots: (slotA, slotB) => {
    const { state } = get();
    if (!state) return;
    const s = swapOwnShelfSlots(state, slotA, slotB);
    set({ state: s });
    saveRoomStateToFirestore(s);
  },

  claimWin: (playerId: string) => {
    const { state } = get();
    if (!state) return;
    const s = claimWinEngine(state, playerId);
    set({ state: s });
    saveRoomStateToFirestore(s);
  },

  discardTile: () => {
    const { state } = get();
    if (!state) return;
    const s = discardDrawnTile(state);
    set({ state: s });
    saveRoomStateToFirestore(s);
    scheduleAI(s, set, get);
  },

  selectOwnSlot: (slot) => set(st => ({
    state: st.state ? { ...st.state, selectedOwnSlot: slot, actionPhase: 'SWITCH_SELECT_TARGET' as ActionPhase } : null,
  })),

  selectTargetSlot: (playerId, slot) => set(st => ({
    state: st.state ? { ...st.state, selectedTargetPlayerId: playerId, selectedTargetSlot: slot } : null,
  })),

  confirmSwitch: () => {
    const { state } = get();
    if (!state) return;
    const { selectedOwnSlot: o, selectedTargetPlayerId: p, selectedTargetSlot: t } = state;
    if (o === null || !p || t === null) return;
    const s = executeSwitchAction(state, o, p, t);
    set({ state: s });
    saveRoomStateToFirestore(s);
    scheduleAI(s, set, get);
  },

  confirmPush: () => {
    const { state } = get();
    if (!state) return;
    const { selectedTargetPlayerId: p, selectedTargetSlot: t } = state;
    if (!p || t === null) return;
    const s = executePushAction(state, p, t);
    set({ state: s });
    saveRoomStateToFirestore(s);
    scheduleAI(s, set, get);
  },

  continueAfterRound: () => {
    const { state } = get();
    if (!state) return;
    const s = startNextRound(state);
    set({ state: s });
    saveRoomStateToFirestore(s);
    scheduleAI(s, set, get);
  },

  resetGame: () => {
    if (unsubscribeRoom) unsubscribeRoom();
    set({ state: null });
  },

  checkAFKTimeout: () => {
    const { state } = get();
    if (!state || state.gameStatus !== 'PLAYING') return;
    const current = state.players[state.currentTurnIndex];
    if (current?.type === 'HUMAN') {
      const elapsed = Date.now() - (state.turnStartTimestamp || Date.now());
      if (elapsed >= AFK_TIMEOUT_MS) {
        const s = convertHumanToAI(state, current.id);
        set({ state: s });
        saveRoomStateToFirestore(s);
        scheduleAI(s, set, get);
      }
    }
  },

  setTelegramUser: (user) => set(st => ({ state: st.state ? { ...st.state, telegramUser: user } : null })),
}));

function setupFirestoreSubscription(roomCode: string, set: any, get: any) {
  if (unsubscribeRoom) unsubscribeRoom();
  unsubscribeRoom = subscribeToRoomFirestore(roomCode, (newState) => {
    const current = get().state;
    if (current && current.drawnTile && !newState.drawnTile && current.currentTurnIndex === newState.currentTurnIndex) {
      return;
    }
    set(() => ({ state: newState }));
  });
}

function isAI(state: GameState) {
  return state.players[state.currentTurnIndex]?.type === 'AI';
}

function scheduleAI(state: GameState, set: any, get: any) {
  if (state.gameStatus !== 'PLAYING' || !isAI(state)) return;
  set(() => ({ isAIThinking: true }));
  setTimeout(() => {
    const cur = get().state;
    if (!cur || cur.gameStatus !== 'PLAYING') { set(() => ({ isAIThinking: false })); return; }
    const afterDraw = drawFromPool(cur);
    set(() => ({ state: afterDraw }));
    saveRoomStateToFirestore(afterDraw);
    setTimeout(() => {
      const cur2 = get().state;
      if (!cur2) return;
      const afterAct = aiTakeTurn(cur2);
      set(() => ({ state: afterAct, isAIThinking: false }));
      saveRoomStateToFirestore(afterAct);
      scheduleAI(afterAct, set, get);
    }, AI_DELAY / 2);
  }, AI_DELAY);
}
