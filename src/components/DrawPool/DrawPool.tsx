import React from 'react';
import { motion } from 'framer-motion';
import type { GameState } from '../../types/game';
import { TileComponent, TileBack } from '../Tile/Tile';
import { MissionPile } from '../MissionCard/MissionCard';

interface DrawPoolProps {
  state: GameState;
  onDrawPool: () => void;
  onDrawDiscard: () => void;
  canDrawDiscard: boolean;
  disabled: boolean;
}

export const DrawPool: React.FC<DrawPoolProps> = ({
  state,
  onDrawPool,
  onDrawDiscard,
  canDrawDiscard,
  disabled,
}) => {
  const rightNeighbourIdx = (state.currentTurnIndex + 1) % state.players.length;
  const rightNeighbour = state.players[rightNeighbourIdx];
  const topDiscard = rightNeighbour?.discardPile?.[0];

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-col items-center gap-2">
        <span className="text-white/60 text-xs uppercase tracking-wider">Draw Pool</span>
        <motion.button
          onClick={!disabled ? onDrawPool : undefined}
          disabled={disabled}
          className="relative group"
          whileHover={!disabled ? { scale: 1.1 } : {}}
          whileTap={!disabled ? { scale: 0.95 } : {}}
        >
          <div className="absolute top-1 left-1 opacity-40">
            <TileBack size="lg" />
          </div>
          <div className="absolute top-0.5 left-0.5 opacity-70">
            <TileBack size="lg" />
          </div>
          <div className={disabled ? 'opacity-50' : 'opacity-100'}>
            <TileBack size="lg" onClick={!disabled ? onDrawPool : undefined} />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-yellow-300 text-[10px] font-bold bg-black/50 px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              Draw
            </span>
          </div>
          <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow">
            {state.drawPool.length}
          </div>
        </motion.button>
      </div>

      <div className="text-white/30 text-xs">or</div>

      <div className="flex flex-col items-center gap-2">
        <span className="text-white/60 text-xs uppercase tracking-wider">
          {rightNeighbour?.name}'s discard
        </span>
        {canDrawDiscard && topDiscard ? (
          <motion.div
            className="cursor-pointer"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={!disabled ? onDrawDiscard : undefined}
          >
            <TileComponent
              tile={topDiscard}
              size="lg"
              highlighted
              onClick={!disabled ? onDrawDiscard : undefined}
            />
          </motion.div>
        ) : (
          <div className="w-16 h-16 rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center">
            <span className="text-white/30 text-xs text-center">empty</span>
          </div>
        )}
      </div>

      <div className="mt-2">
        <MissionPile
          count={state.missionsPool.length}
          used={state.usedMissions.length}
        />
      </div>
    </div>
  );
};
