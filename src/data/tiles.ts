import type { Tile, MissionCard, ProductId } from '../types/game';

// ─── Product Tile Counts (from patterns.xlsx) ────────────────────────────────
// Tuna:21  Doritos:20  Pringles:18  Chips:18  Soup:18  OJ:15  Cans:17  Ketchup:17
// Special Tiles (4 Types): SALE×10  SWITCH×10  PUSH×10  EMPTYBOX×10

let _tileIdCounter = 0;
const uid = (prefix: string) => `${prefix}-${++_tileIdCounter}-${Math.random().toString(36).slice(2, 6)}`;

function makeProductTiles(
  productId: ProductId,
  name: string,
  nameHe: string,
  imageFile: string,
  count: number
): Tile[] {
  return Array.from({ length: count }, () => ({
    id: uid(productId),
    type: 'PRODUCT' as const,
    productId,
    name,
    nameHe,
    imageFile,
  }));
}

/**
 * Creates a fresh tile pool with new unique object references and unique IDs.
 */
export function createTilePool(): Tile[] {
  return [
    ...makeProductTiles('tuna',        'Tuna',         'טונה',         'tuna.png',          21),
    ...makeProductTiles('doritos',     'Doritos',      'דוריטוס',      'doritos.png',        20),
    ...makeProductTiles('pringles',    'Pringles',     'פרינגלס',      'pringels.png',       18),
    ...makeProductTiles('chips',       'Chips',        "צ'יפס",        'round crisps.png',   18),
    ...makeProductTiles('soup',        'Soup',         'מרק',          'soup.png',           18),
    ...makeProductTiles('orangejuice', 'Orange Juice', 'מיץ תפוזים',   'orangejuice.png',    15),
    ...makeProductTiles('cans',        'Cans',         'שימורים',      'cans.png',           17),
    ...makeProductTiles('ketchup',     'Ketchup',      'קטשופ',        'ketchup.png',        17),

    // Special Action & Obstacle Tiles — 10x SALE (מבצע), 10x SWITCH (החלפה), 10x PUSH (דחיפה), 10x EMPTYBOX (קופסה ריקה)
    ...Array.from({ length: 10 }, () => ({
      id: uid('sale'), type: 'SALE' as const, name: 'Sale', nameHe: 'מבצע', imageFile: 'HEB-SALE.png',
    })),
    ...Array.from({ length: 10 }, () => ({
      id: uid('switch'), type: 'SWITCH' as const, name: 'Switch', nameHe: 'החלפה', imageFile: 'switch.png',
    })),
    ...Array.from({ length: 10 }, () => ({
      id: uid('push'), type: 'PUSH' as const, name: 'Push', nameHe: 'דחיפה', imageFile: 'push.png',
    })),
    ...Array.from({ length: 10 }, () => ({
      id: uid('emptybox'), type: 'EMPTYBOX' as const, name: 'Empty Box', nameHe: 'קופסה ריקה', imageFile: 'emptybox.png',
    })),
  ];
}

export const TILE_BACK: Tile = {
  id: 'tile-back', type: 'PRODUCT', name: 'Hidden', nameHe: 'נסתר', imageFile: 'heb-back-yellow.png',
};

export const PUSH_PLACEHOLDER: Tile = {
  id: 'push-placeholder', type: 'PUSH', name: 'Push', nameHe: 'דחיפה', imageFile: 'push.png',
};

export const MISSION_CARDS: MissionCard[] = [
  { id: 'P1',  imageFile: 'P1.png',  pattern: ['chips','pringles','pringles','tuna','soup','orangejuice','doritos','cans'] },
  { id: 'P2',  imageFile: 'P2.png',  pattern: ['orangejuice','doritos','cans','ketchup','pringles','tuna','soup','orangejuice'] },
  { id: 'P3',  imageFile: 'P3.png',  pattern: ['ketchup','ketchup','pringles','pringles','cans','chips','doritos','soup'] },
  { id: 'P4',  imageFile: 'P4.png',  pattern: ['tuna','tuna','ketchup','pringles','pringles','cans','chips','doritos'] },
  { id: 'P5',  imageFile: 'P5.png',  pattern: ['pringles','pringles','cans','chips','doritos','doritos','soup','tuna'] },
  { id: 'P6',  imageFile: 'P6.png',  pattern: ['doritos','doritos','soup','orangejuice','tuna','tuna','ketchup','cans'] },
  { id: 'P7',  imageFile: 'P7.png',  pattern: ['soup','soup','orangejuice','tuna','tuna','ketchup','pringles','cans'] },
  { id: 'P8',  imageFile: 'P8.png',  pattern: ['cans','cans','chips','chips','doritos','soup','orangejuice','tuna'] },
  { id: 'P9',  imageFile: 'P9.png',  pattern: ['orangejuice','orangejuice','tuna','tuna','ketchup','pringles','cans','chips'] },
  { id: 'P10', imageFile: 'P10.png', pattern: ['pringles','soup','soup','doritos','doritos','ketchup','tuna','chips'] },
  { id: 'P11', imageFile: 'P11.png', pattern: ['doritos','doritos','soup','orangejuice','tuna','tuna','ketchup','cans'] },
  { id: 'P12', imageFile: 'P12.png', pattern: ['tuna','tuna','ketchup','pringles','pringles','cans','chips','doritos'] },
  { id: 'P13', imageFile: 'P13.png', pattern: ['cans','cans','chips','chips','doritos','soup','orangejuice','tuna'] },
  { id: 'P14', imageFile: 'P14.png', pattern: ['soup','soup','orangejuice','tuna','tuna','ketchup','pringles','cans'] },
  { id: 'P15', imageFile: 'P15.png', pattern: ['ketchup','ketchup','pringles','pringles','cans','chips','doritos','soup'] },
  { id: 'P16', imageFile: 'P16.png', pattern: ['chips','chips','doritos','doritos','soup','orangejuice','tuna','ketchup'] },
  { id: 'P17', imageFile: 'P17.png', pattern: ['orangejuice','orangejuice','tuna','tuna','ketchup','pringles','cans','chips'] },
  { id: 'P18', imageFile: 'P18.png', pattern: ['pringles','soup','soup','doritos','doritos','ketchup','tuna','chips'] },
];
