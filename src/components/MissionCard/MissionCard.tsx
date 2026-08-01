import React from 'react';
import { motion } from 'framer-motion';
import type { MissionCard } from '../../types/game';

interface MissionCardProps {
  mission: MissionCard;
  revealed?: boolean;
  compact?: boolean;
}

export const MissionCardComponent: React.FC<MissionCardProps> = ({
  mission,
  revealed = false,
  compact = false,
}) => {
  const size = compact ? 'w-20' : 'w-28';

  return (
    <motion.div
      className={`${size} rounded-xl overflow-hidden shadow-lg cursor-default relative`}
      whileHover={{ scale: 1.05 }}
      title={revealed ? `Mission: ${mission.id}` : 'Secret Mission'}
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
