import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { Player, ActionPhase } from '../../types/game';
import { TileComponent, EmptySlot } from '../Tile/Tile';
import { useGameStore } from '../../store/gameStore';

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
  allowRearrange?: boolean;
}

export const Shelf: React.FC<ShelfProps> = ({
  player,
  isCurrentPlayer = false,
  isOpponent = false,
  compact = false,
  selectedTargetPlayerId,
  onSlotClick,
  highlightSlots = [],
  allowRearrange = false,
}) => {
  const { swapOwnSlots } = useGameStore();
  const [selectedSlotForSwap, setSelectedSlotForSwap] = useState<number | null>(null);

  const tileSize = compact ? 'sm' : 'md';
  const isThisPlayerTargeted = selectedTargetPlayerId === player.id;

  const handleDragStart = (e: React.DragEvent, slotIdx: number) => {
    if (!allowRearrange) return;
    e.dataTransfer.setData('text/plain', slotIdx.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!allowRearrange) return;
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetSlotIdx: number) => {
    if (!allowRearrange) return;
    e.preventDefault();
    const sourceSlotStr = e.dataTransfer.getData('text/plain');
    if (sourceSlotStr === '') return;
    const sourceSlotIdx = parseInt(sourceSlotStr, 10);
    if (!isNaN(sourceSlotIdx) && sourceSlotIdx !== targetSlotIdx) {
      swapOwnSlots(sourceSlotIdx, targetSlotIdx);
      setSelectedSlotForSwap(null);
    }
  };

  const handleSlotClickInternal = (i: number) => {
    if (allowRearrange) {
      if (selectedSlotForSwap === null) {
        setSelectedSlotForSwap(i);
      } else if (selectedSlotForSwap === i) {
        setSelectedSlotForSwap(null);
      } else {
        swapOwnSlots(selectedSlotForSwap, i);
        setSelectedSlotForSwap(null);
      }
    }
    if (onSlotClick) {
      onSlotClick(i);
    }
  };

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
            const isHighlighted = highlightSlots.includes(i) || selectedSlotForSwap === i;
            const isPushPlaceholder = tile?.type === 'PUSH';

            return (
              <div key={i} className="flex items-center justify-center">
                {tile ? (
                  <TileComponent
                    tile={tile}
                    size={tileSize}
                    isPushPlaceholder={isPushPlaceholder}
                    highlighted={isHighlighted}
                    selected={selectedSlotForSwap === i}
                    onClick={() => handleSlotClickInternal(i)}
                    draggable={allowRearrange}
                    onDragStart={(e) => handleDragStart(e, i)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, i)}
                  />
                ) : (
                  <EmptySlot
                    size={tileSize}
                    highlighted={isHighlighted}
                    slotIndex={i}
                    onClick={() => handleSlotClickInternal(i)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, i)}
                  />
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {allowRearrange && (
        <span className="text-[10px] text-yellow-300/70">
          💡 Drag or click 2 tiles on your shelf to swap position
        </span>
      )}

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
