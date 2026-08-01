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

export type SpecialTileType = 'SALE' | 'SWITCH' | 'PUSH' | 'EMPTYBOX';
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

export type AIPersonality = 'BUILDER' | 'DISRUPTOR' | 'ADAPTIVE';
export type AILevel = 'EASY' | 'MEDIUM' | 'HARD';
export type PlayerType = 'HUMAN' | 'AI';

export interface Player {
  id: string;
  name: string;
  type: PlayerType;
  wasHuman?: boolean;    // true if this player started as Human (or is Human)
  aiLevel?: AILevel;
  aiPersonality?: AIPersonality;
  avatarUrl?: string;    // Telegram user avatar or placeholder
  isHost?: boolean;
  isReady?: boolean;
  lastActiveTimestamp?: number; // for 5-min AFK detection
  shelf: (Tile | null)[]; // exactly 8 slots; null = empty; PUSH tile occupies a slot temporarily
  mission: MissionCard | null;
  discardPile: Tile[];   // stack — top = last discarded (index 0)
  score: number;         // rounds won
  hasPushPlaceholder: boolean; // true when a PUSH tile occupies a slot on this player's shelf
  pushSlotIndex: number | null; // which slot has the Push placeholder
}

export type ActionPhase =
  | 'IDLE'
  | 'TILE_DRAWN'
  | 'SWITCH_SELECT_OWN'
  | 'SWITCH_SELECT_TARGET'
  | 'PUSH_SELECT_TARGET'
  | 'PUSH_RESOLVE';

export interface GameState {
  gameId: string;
  roomCode: string;
  players: Player[];
  currentTurnIndex: number;
  drawPool: Tile[];
  allDiscarded: Tile[];
  missionsPool: MissionCard[];
  usedMissions: MissionCard[];
  gameStatus: 'LOBBY' | 'WAITING_FOR_READIES' | 'PLAYING' | 'ROUND_OVER' | 'GAME_OVER';
  roundNumber: number;
  winnerId: string | null;
  overallWinnerId: string | null;
  drawnTile: Tile | null;
  drawnFromDiscard?: boolean;
  actionPhase: ActionPhase;
  turnStartTimestamp: number;
  selectedOwnSlot: number | null;
  selectedTargetPlayerId: string | null;
  selectedTargetSlot: number | null;
  lastAction: string | null;
  telegramUser?: { id: number; first_name: string; username?: string; photo_url?: string };
}

export interface GameSettings {
  playerCount: number;      // 2-4
  humanCount: number;       // 1 = single player vs AI, 2-4 = online multiplayer
  aiLevel: AILevel;
  useTelegramNames: boolean;
  roomCode?: string;
}
