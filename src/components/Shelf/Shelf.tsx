import React from 'react';
import { motion } from 'framer-motion';
import type { Player, ActionPhase } from '../../types/game';
import { TileComponent, EmptySlot } from '../Tile/Tile';

interface ShelfProps {
  player: Player;
  isCurrentPlayer?: boolean;
  isOpponent?: boolean;
  compact?: boolean;
  actionPhase?: ActionPhase;
  isTargetable?: boolean;
  selectedTargetPlayerId?: string | null;
  onSlotClick?: (slotIndex: number) => void;
  highlightSlots?: number[];
}

export const Shelf: React.FC<ShelfProps> = ({
  player,
  isCurrentPlayer = false,
  isOpponent = false,
  compact = false,
  selectedTargetPlayerId,
  onSlotClick,
  highlightSlots = [],
}) => {
  const tileSize = compact ? 'sm' : 'md';
  const isThisPlayerTargeted = selectedTargetPlayerId === player.id;

  return (
    <div className={`relative flex flex-col items-center ${compact ? 'gap-1' : 'gap-2'}`}>
      <div className={`
        flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold
        ${isCurrentPlayer
          ? 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/40'
          : isOpponent
            ? 'bg-white/10 text-white/80 border border-white/20'
            : 'bg-white/5 text-white/60 border border-white/10'
        }
      `}>
        {player.type === 'AI' && <span className="text-xs opacity-60">🤖</span>}
        <span>{player.name}</span>
        <span className="text-xs opacity-70">{'⭐'.repeat(player.score)}</span>
        {isCurrentPlayer && (
          <span className="text-xs text-yellow-300 animate-pulse">← Turn</span>
        )}
      </div>

      <motion.div
        className={`
          relative rounded-xl overflow-hidden
          ${isThisPlayerTargeted ? 'ring-4 ring-red-400 shadow-lg shadow-red-400/40' : ''}
          transition-all duration-200
        `}
        animate={isThisPlayerTargeted ? { scale: 1.02 } : { scale: 1 }}
      >
        <img
          src="/assets/cards/jambo front.png"
          alt="Shelf"
          className={`${compact ? 'w-36' : 'w-52'} h-auto block`}
          draggable={false}
        />

        <div
          className="absolute inset-0 grid grid-cols-2 grid-rows-4 gap-1 p-2"
          style={{ paddingTop: '4%', paddingBottom: '3%', paddingLeft: '6%', paddingRight: '6%' }}
        >
          {Array.from({ length: 8 }, (_, i) => {
            const tile = player.shelf[i];
            const isHighlighted = highlightSlots.includes(i);
            const isPushPlaceholder = tile?.type === 'PUSH';
            const isSelectable = !!onSlotClick;

            return (
              <div key={i} className="flex items-center justify-center">
                {tile ? (
                  <TileComponent
                    tile={tile}
                    size={tileSize}
                    isPushPlaceholder={isPushPlaceholder}
                    highlighted={isHighlighted}
                    onClick={isSelectable ? () => onSlotClick?.(i) : undefined}
                  />
                ) : (
                  <EmptySlot
                    size={tileSize}
                    highlighted={isHighlighted}
                    slotIndex={i}
                    onClick={isSelectable ? () => onSlotClick?.(i) : undefined}
                  />
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {player.discardPile.length > 0 && (
        <div className="flex items-center gap-1 text-xs text-white/50">
          <span>🗑</span>
          <span>{player.discardPile.length} discarded</span>
          {player.discardPile[0] && (
            <TileComponent
              tile={player.discardPile[0]}
              size="sm"
            />
          )}
        </div>
      )}
    </div>
  );
};
