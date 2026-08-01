import { create } from 'zustand';
import type { GameState, GameSettings, ActionPhase } from '../types/game';
import { setupGame, drawFromPool, drawFromNeighbourDiscard, placeTileOnShelf, discardDrawnTile, executeSwitchAction, executeStealAction, executePushAction, startNextRound, swapOwnShelfSlots } from '../engine/gameEngine';
import { aiTakeTurn } from '../engine/aiPlayer';

interface GameStore {
  state: GameState | null;
  settings: GameSettings;
  isAIThinking: boolean;
  updateSettings: (s: Partial<GameSettings>) => void;
  startGame: () => void;
  drawPool: () => void;
  drawNeighbourDiscard: () => void;
  placeOnShelf: (slot: number) => void;
  swapOwnSlots: (slotA: number, slotB: number) => void;
  discardTile: () => void;
  selectOwnSlot: (slot: number) => void;
  selectTargetSlot: (playerId: string, slot: number) => void;
  confirmSwitch: () => void;
  confirmSteal: (ownSlot: number) => void;
  confirmPush: () => void;
  continueAfterRound: () => void;
  resetGame: () => void;
  setTelegramUser: (user: GameState['telegramUser']) => void;
}

const DEFAULT: GameSettings = { playerCount: 2, humanCount: 1, aiLevel: 'MEDIUM', useTelegramNames: false };
const AI_DELAY = 900;

export const useGameStore = create<GameStore>((set, get) => ({
  state: null,
  settings: DEFAULT,
  isAIThinking: false,

  updateSettings: (s) => set(st => ({ settings: { ...st.settings, ...s } })),

  startGame: () => {
    const s = setupGame(get().settings);
    set({ state: s });
    scheduleAI(s, set, get);
  },

  drawPool: () => {
    const { state } = get();
    if (!state || state.gameStatus !== 'PLAYING') return;
    const s = drawFromPool(state);
    set({ state: s });
  },

  drawNeighbourDiscard: () => {
    const { state } = get();
    if (!state || state.gameStatus !== 'PLAYING') return;
    const s = drawFromNeighbourDiscard(state);
    set({ state: s });
  },

  placeOnShelf: (slot) => {
    const { state } = get();
    if (!state) return;
    const s = placeTileOnShelf(state, slot);
    set({ state: s });
    scheduleAI(s, set, get);
  },

  swapOwnSlots: (slotA, slotB) => {
    const { state } = get();
    if (!state) return;
    const s = swapOwnShelfSlots(state, slotA, slotB);
    set({ state: s });
  },

  discardTile: () => {
    const { state } = get();
    if (!state) return;
    const s = discardDrawnTile(state);
    set({ state: s });
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
    scheduleAI(s, set, get);
  },

  confirmSteal: (ownSlot) => {
    const { state } = get();
    if (!state) return;
    const { selectedTargetPlayerId: p, selectedTargetSlot: t } = state;
    if (!p || t === null) return;
    const s = executeStealAction(state, p, t, ownSlot);
    set({ state: s });
    scheduleAI(s, set, get);
  },

  confirmPush: () => {
    const { state } = get();
    if (!state) return;
    const { selectedTargetPlayerId: p, selectedTargetSlot: t } = state;
    if (!p || t === null) return;
    const s = executePushAction(state, p, t);
    set({ state: s });
    scheduleAI(s, set, get);
  },

  continueAfterRound: () => {
    const { state } = get();
    if (!state) return;
    const s = startNextRound(state);
    set({ state: s });
    scheduleAI(s, set, get);
  },

  resetGame: () => set({ state: null }),

  setTelegramUser: (user) => set(st => ({ state: st.state ? { ...st.state, telegramUser: user } : null })),
}));

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
    setTimeout(() => {
      const cur2 = get().state;
      if (!cur2) return;
      const afterAct = aiTakeTurn(cur2);
      set(() => ({ state: afterAct, isAIThinking: false }));
      scheduleAI(afterAct, set, get);
    }, AI_DELAY / 2);
  }, AI_DELAY);
}
