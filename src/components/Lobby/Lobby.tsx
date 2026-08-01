import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import type { AILevel } from '../../types/game';

export const Lobby: React.FC = () => {
  const { settings, updateSettings, startGame } = useGameStore();

  const totalPlayers = settings.playerCount;
  const aiCount = totalPlayers - settings.humanCount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        className="w-full max-w-md bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm p-6 flex flex-col gap-6 shadow-2xl"
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      >
        <div className="flex flex-col items-center gap-2">
          <img src="/assets/cards/jambo front.png" alt="Sadranim" className="w-24 rounded-xl shadow-lg" />
          <h1 className="text-3xl font-black text-white tracking-tight">
            סידור <span className="text-yellow-400">המדפים</span>
          </h1>
          <p className="text-white/50 text-sm text-center">Shelf Sorting Game</p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-white/70 text-sm font-semibold">Number of Players</label>
          <div className="flex gap-2">
            {[2, 3, 4].map(n => (
              <button
                key={n}
                onClick={() => updateSettings({ playerCount: n, humanCount: Math.min(settings.humanCount, n) })}
                className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all ${
                  settings.playerCount === n
                    ? 'bg-yellow-400 text-slate-900 border-yellow-400'
                    : 'bg-white/10 text-white/70 border-white/20 hover:bg-white/20'
                }`}
              >
                {n} Players
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-white/70 text-sm font-semibold">Human Players</label>
          <div className="flex gap-2">
            {Array.from({ length: totalPlayers }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                onClick={() => updateSettings({ humanCount: n })}
                className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all ${
                  settings.humanCount === n
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white/10 text-white/70 border-white/20 hover:bg-white/20'
                }`}
              >
                {n === 1 ? '1 (vs AI)' : n === totalPlayers ? `${n} (Pass & Play)` : n}
              </button>
            ))}
          </div>
          {aiCount > 0 && (
            <p className="text-white/40 text-xs text-center">{aiCount} AI bot{aiCount > 1 ? 's' : ''} will play</p>
          )}
        </div>

        {aiCount > 0 && (
          <div className="flex flex-col gap-2">
            <label className="text-white/70 text-sm font-semibold">AI Difficulty</label>
            <div className="flex gap-2">
              {(['EASY', 'MEDIUM', 'HARD'] as AILevel[]).map(level => (
                <button
                  key={level}
                  onClick={() => updateSettings({ aiLevel: level })}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all ${
                    settings.aiLevel === level
                      ? level === 'EASY' ? 'bg-green-500 text-white border-green-500'
                        : level === 'MEDIUM' ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-red-500 text-white border-red-500'
                      : 'bg-white/10 text-white/70 border-white/20 hover:bg-white/20'
                  }`}
                >
                  {level === 'EASY' ? '😊 Easy' : level === 'MEDIUM' ? '🎯 Medium' : '🔥 Hard'}
                </button>
              ))}
            </div>
          </div>
        )}

        <motion.button
          onClick={startGame}
          className="w-full py-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-slate-900 font-black text-lg rounded-2xl shadow-lg shadow-yellow-400/30"
          whileHover={{ scale: 1.03, boxShadow: '0 0 30px rgba(250,204,21,0.5)' }}
          whileTap={{ scale: 0.97 }}
        >
          🛒 Start Game!
        </motion.button>

        <details className="text-white/40 text-xs">
          <summary className="cursor-pointer text-white/60 font-medium">How to play</summary>
          <ul className="mt-2 space-y-1 list-disc list-inside leading-relaxed">
            <li>Match your shelf to the secret mission card</li>
            <li>Each turn: draw a tile, then place or discard it</li>
            <li>🔴 Push — knock a tile off a neighbour's shelf</li>
            <li>🔵 Switch — swap your tile with an opponent's</li>
            <li>💛 Steal — take any tile from an opponent's shelf</li>
            <li>⭐ Sale — wildcard, counts as any product (max 1)</li>
            <li>First to match their mission wins the round!</li>
            <li>Game ends after all 18 missions are used</li>
          </ul>
        </details>
      </motion.div>
    </div>
  );
};
