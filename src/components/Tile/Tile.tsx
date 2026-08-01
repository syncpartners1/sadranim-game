import React from 'react';
import { motion } from 'framer-motion';
import type { Tile as TileType } from '../../types/game';

interface TileProps {
  tile: TileType;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  selected?: boolean;
  highlighted?: boolean;
  isPushPlaceholder?: boolean;
  onClick?: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}

const sizeClasses = {
  sm: 'w-12 h-12',
  md: 'w-16 h-16',
  lg: 'w-20 h-20',
  xl: 'w-28 h-28',
};

const tileTypeColors: Record<string, string> = {
  SALE: 'ring-2 ring-red-400 shadow-red-400/40',
  SWITCH: 'ring-2 ring-blue-400 shadow-blue-400/40',
  PUSH: 'ring-2 ring-orange-400 shadow-orange-400/40',
  STEAL: 'ring-2 ring-yellow-400 shadow-yellow-400/40',
};

export const TileComponent: React.FC<TileProps> = ({
  tile,
  size = 'md',
  selected = false,
  highlighted = false,
  isPushPlaceholder = false,
  onClick,
  draggable = false,
  onDragStart,
  onDragOver,
  onDrop,
}) => {
  const sizeClass = sizeClasses[size];
  const specialRing = tileTypeColors[tile.type] ?? '';

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className="inline-block"
    >
      <motion.div
        className={`
          relative rounded-lg overflow-hidden cursor-pointer select-none
          ${sizeClass}
          ${selected ? 'ring-4 ring-yellow-300 shadow-lg shadow-yellow-300/50 scale-110 z-10' : ''}
          ${highlighted ? 'ring-2 ring-green-400 shadow-md shadow-green-400/40' : ''}
          ${specialRing}
          ${isPushPlaceholder ? 'opacity-60 animate-pulse' : ''}
          ${onClick || draggable ? 'hover:scale-105 active:scale-95' : ''}
          transition-all duration-150
        `}
        onClick={onClick}
        whileHover={onClick || draggable ? { scale: 1.08 } : {}}
        whileTap={onClick || draggable ? { scale: 0.95 } : {}}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8 }}
        layout
      >
        <img
          src={`/assets/chits/${tile.imageFile}`}
          alt={tile.name}
          className="w-full h-full object-contain bg-white/5"
          draggable={false}
        />
        {tile.type !== 'PRODUCT' && !isPushPlaceholder && (
          <div className="absolute inset-0 bg-black/10 flex items-end justify-center pb-0.5">
            <span className="text-[8px] font-bold text-white drop-shadow-md leading-none">
              {tile.nameHe}
            </span>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export const TileBack: React.FC<{ size?: 'sm' | 'md' | 'lg'; onClick?: () => void }> = ({
  size = 'md',
  onClick,
}) => (
  <motion.div
    className={`
      ${sizeClasses[size]} rounded-lg overflow-hidden cursor-pointer
      ${onClick ? 'hover:scale-105 active:scale-95' : ''}
      transition-all duration-150
    `}
    onClick={onClick}
    whileHover={onClick ? { scale: 1.08 } : {}}
    whileTap={onClick ? { scale: 0.95 } : {}}
  >
    <img
      src="/assets/chits/heb-back-yellow.png"
      alt="Tile back"
      className="w-full h-full object-contain"
      draggable={false}
    />
  </motion.div>
);

export const EmptySlot: React.FC<{
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
  highlighted?: boolean;
  slotIndex?: number;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}> = ({ size = 'md', onClick, highlighted, slotIndex, onDragOver, onDrop }) => (
  <div
    onDragOver={onDragOver}
    onDrop={onDrop}
    className="inline-block"
  >
    <motion.div
      className={`
        ${sizeClasses[size]} rounded-lg border-2 border-dashed
        flex items-center justify-center cursor-pointer
        transition-all duration-200
        ${highlighted
          ? 'border-green-400 bg-green-400/10 shadow-md shadow-green-400/20'
          : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
        }
      `}
      onClick={onClick}
      whileHover={onClick ? { scale: 1.05 } : {}}
      animate={highlighted ? { borderColor: ['#4ade80', '#86efac', '#4ade80'] } : {}}
      transition={highlighted ? { duration: 1.2, repeat: Infinity } : {}}
    >
      <span className="text-white/20 text-xs">{slotIndex !== undefined ? slotIndex + 1 : ''}</span>
    </motion.div>
  </div>
);
