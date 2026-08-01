import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MissionCard } from '../../types/game';
import { useGameStore } from '../../store/gameStore';

interface MissionCardProps {
  mission: MissionCard;
  revealed?: boolean;
  compact?: boolean;
  onClick?: () => void;
}

export const MissionCardComponent: React.FC<MissionCardProps> = ({
  mission,
  revealed = false,
  compact = false,
  onClick,
}) => {
  const size = compact ? 'w-20' : 'w-28';

  return (
    <motion.div
      className={`${size} rounded-xl overflow-hidden shadow-lg cursor-pointer relative`}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      title={revealed ? `Mission: ${mission.id} (Click to enlarge)` : 'Secret Mission'}
    >
      {revealed ? (
        <img
          src={`/assets/cards/${mission.imageFile}`}
          alt={`Mission ${mission.id}`}
          className="w-full h-auto block"
          draggable={false}
        />
      ) : (
        <div className="relative">
          <img
            src="/assets/cards/bridge-back HEB.png"
            alt="Mission card back"
            className="w-full h-auto block"
            draggable={false}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-green-300 font-bold text-xs bg-black/30 px-2 py-0.5 rounded-full">
              🎯 Secret
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export const MissionPile: React.FC<{ count: number; used: number }> = ({ count, used }) => (
  <div className="flex flex-col items-center gap-1">
    <div className="relative w-16">
      {count > 2 && (
        <div className="absolute top-1 left-1 w-full rounded-xl overflow-hidden opacity-60">
          <img src="/assets/cards/bridge-back HEB.png" alt="" className="w-full" draggable={false} />
        </div>
      )}
      {count > 1 && (
        <div className="absolute top-0.5 left-0.5 w-full rounded-xl overflow-hidden opacity-80">
          <img src="/assets/cards/bridge-back HEB.png" alt="" className="w-full" draggable={false} />
        </div>
      )}
      <img src="/assets/cards/bridge-back HEB.png" alt="Missions" className="w-full rounded-xl relative shadow-lg" draggable={false} />
    </div>
    <span className="text-xs text-white/60">{count} missions left</span>
    <span className="text-xs text-white/40">{used} done</span>
  </div>
);

export const MissionCardModal: React.FC<{ mission: MissionCard; onClose: () => void }> = ({
  mission,
  onClose,
}) => {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4" onClick={onClose}>
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.7, opacity: 0 }}
          className="relative max-w-sm w-full bg-slate-900 border border-white/20 rounded-3xl p-4 flex flex-col items-center gap-4 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between w-full">
            <h3 className="text-white font-bold text-lg">🎯 Secret Mission ({mission.id})</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-sm flex items-center justify-center"
            >
              ✕
            </button>
          </div>

          <div className="w-64 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
            <img
              src={`/assets/cards/${mission.imageFile}`}
              alt={`Mission ${mission.id}`}
              className="w-full h-auto block"
            />
          </div>

          <p className="text-xs text-white/60 text-center">
            Arrange tiles on your shelf to match this pattern exactly to win the round!
          </p>

          <button
            onClick={onClose}
            className="w-full py-2.5 bg-yellow-400 text-slate-900 font-bold rounded-xl shadow-lg hover:bg-yellow-300"
          >
            Back to Shelf Game
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
