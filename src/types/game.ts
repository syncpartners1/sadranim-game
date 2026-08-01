// ============================================================
// SADRANIM GAME — Core TypeScript Types
// ============================================================

export type ProductId =
  | 'tuna'
  | 'cans'
  | 'soup'
  | 'ketchup'
  | 'orangejuice'
  | 'doritos'
  | 'chips'
  | 'pringles';

export type SpecialTileType = 'SALE' | 'SWITCH' | 'PUSH' | 'STEAL';
export type TileType = 'PRODUCT' | SpecialTileType;

export interface Tile {
  id: string;
  type: TileType;
  productId?: ProductId;
  name: string;
  nameHe: string;
  imageFile: string; // filename in /assets/chits/
}

export interface MissionCard {
  id: string;           // 'P1' … 'P18'
  imageFile: string;    // filename in /assets/cards/
  pattern: ProductId[]; // exactly 8 slots, left-to-right
}

export type AILevel = 'EASY' | 'MEDIUM' | 'HARD';
export type PlayerType = 'HUMAN' | 'AI';

export interface Player {
  id: string;
  name: string;
  type: PlayerType;
  aiLevel?: AILevel;
  avatarUrl?: string;    // Telegram user avatar or placeholder
  shelf: (Tile | null)[]; // exactly 8 slots; null = empty; PUSH tile occupies a slot temporarily
  mission: MissionCard | null;
  discardPile: Tile[];   // stack — top = last discarded (index 0)
  score: number;         // rounds won
  hasPushPlaceholder: boolean; // true when a PUSH tile occupies a slot on this player's shelf
  pushSlotIndex: number | null; // which slot has the Push placeholder
}

// Tracks what interactive action is pending
export type ActionPhase =
  | 'IDLE'              // no tile in hand yet
  | 'TILE_DRAWN'        // normal tile drawn, waiting for place/discard decision
  | 'SWITCH_SELECT_OWN' // SWITCH drawn: pick your tile to swap
  | 'SWITCH_SELECT_TARGET' // pick opponent + their tile
  | 'STEAL_SELECT_TARGET'  // STEAL drawn: pick opponent + their tile to steal
  | 'PUSH_SELECT_TARGET'   // PUSH drawn: pick adjacent opponent's tile to push
  | 'PUSH_RESOLVE'         // this player must replace the PUSH placeholder on their shelf

export interface GameState {
  gameId: string;
  players: Player[];
  currentTurnIndex: number;
  drawPool: Tile[];
  allDiscarded: Tile[];  // merged when pool runs out
  missionsPool: MissionCard[];   // remaining undealt missions
  usedMissions: MissionCard[];   // missions already completed
  gameStatus: 'LOBBY' | 'PLAYING' | 'ROUND_OVER' | 'GAME_OVER';
  roundNumber: number;
  winnerId: string | null;       // round winner
  overallWinnerId: string | null; // game winner
  drawnTile: Tile | null;        // tile currently in hand (not yet placed/discarded)
  actionPhase: ActionPhase;
  // For switch/steal/push — which slots are selected
  selectedOwnSlot: number | null;
  selectedTargetPlayerId: string | null;
  selectedTargetSlot: number | null;
  // Animation events (consumed by UI)
  lastAction: string | null;
  // Telegram user info
  telegramUser?: { id: number; first_name: string; username?: string; photo_url?: string };
}

export interface GameSettings {
  playerCount: number;      // 2-4
  humanCount: number;       // 1 = single player, 2-4 = pass & play
  aiLevel: AILevel;
  useTelegramNames: boolean;
}
