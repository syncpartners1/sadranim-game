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
    <div className="flex flex-col items-center gap-4" dir="rtl">
      <div className="flex items-center gap-6">
        {/* Draw from central pool */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-white/70 text-xs font-bold uppercase tracking-wider">קופת המשחק</span>
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
              <span className="text-yellow-300 text-xs font-bold bg-black/70 px-2 py-0.5 rounded-full border border-yellow-400/40 opacity-0 group-hover:opacity-100 transition-opacity">
                שלוף
              </span>
            </div>
            <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-black shadow-md border border-white/20">
              {state.drawPool.length}
            </div>
          </motion.button>
        </div>

        <div className="text-white/40 text-xs font-bold">או</div>

        {/* Draw from neighbour's discard pile */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-white/70 text-xs font-bold uppercase tracking-wider">
            השלכות {rightNeighbour?.name}
          </span>
          {canDrawDiscard && topDiscard ? (
            <motion.div
              className="cursor-pointer relative group"
              whileHover={!disabled ? { scale: 1.1 } : {}}
              whileTap={!disabled ? { scale: 0.95 } : {}}
              onClick={!disabled ? onDrawDiscard : undefined}
            >
              <TileComponent
                tile={topDiscard}
                size="lg"
                highlighted
                onClick={!disabled ? onDrawDiscard : undefined}
              />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-yellow-400 text-slate-900 text-[10px] font-black px-1.5 py-0.5 rounded-full shadow opacity-90 group-hover:opacity-100">
                קח אריח
              </div>
            </motion.div>
          ) : (
            <div className="w-20 h-20 rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center bg-white/5">
              <span className="text-white/30 text-xs font-medium text-center">ריק</span>
            </div>
          )}
        </div>
      </div>

      {/* Central Mission pile counter */}
      <div className="mt-1">
        <MissionPile
          count={state.missionsPool.length}
          used={state.usedMissions.length}
        />
      </div>
    </div>
  );
};
