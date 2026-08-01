import React from 'react';
import { motion } from 'framer-motion';
import type { GameState } from '../../types/game';
import { useGameStore } from '../../store/gameStore';
import { MissionCardComponent } from '../MissionCard/MissionCard';

interface WinScreenProps {
  state: GameState;
}

export const WinScreen: React.FC<WinScreenProps> = ({ state }) => {
  const { continueAfterRound, resetGame } = useGameStore();

  const isGameOver = state.gameStatus === 'GAME_OVER';
  const winner = state.players.find(p => p.id === (isGameOver ? state.overallWinnerId : state.winnerId));
  const sortedPlayers = [...state.players].sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }, (_, i) => (
          <motion.div
            key={i}
            className="absolute w-3 h-3 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `-10%`,
              backgroundColor: ['#fde047', '#fb923c', '#4ade80', '#60a5fa', '#f472b6'][i % 5],
            }}
            animate={{
              y: ['0vh', '110vh'],
              rotate: [0, 720],
              opacity: [1, 0.3],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              delay: Math.random() * 1.5,
              repeat: Infinity,
              ease: 'easeIn',
            }}
          />
        ))}
      </div>

      <motion.div
        className="relative w-full max-w-md bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm p-6 flex flex-col gap-5 shadow-2xl text-center"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
      >
        <motion.div
          className="text-6xl"
          animate={{ rotate: [-5, 5, -5], scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {isGameOver ? '🏆' : '🎉'}
        </motion.div>

        <div>
          <h2 className="text-2xl font-black text-white">
            {isGameOver ? 'Game Over!' : 'Round Complete!'}
          </h2>
          {winner && (
            <p className="text-yellow-300 font-bold text-lg mt-1">
              {winner.name} wins{isGameOver ? ' the game!' : ' this round!'}
            </p>
          )}
        </div>

        <div className="bg-black/30 rounded-2xl p-3">
          <p className="text-white/60 text-xs uppercase tracking-wider mb-2">Scores</p>
          {sortedPlayers.map((p, i) => (
            <div key={p.id} className={`flex items-center justify-between py-1.5 px-2 rounded-lg mb-1 ${i === 0 ? 'bg-yellow-400/10' : 'bg-white/5'}`}>
              <div className="flex items-center gap-2">
                <span className="text-white/40 text-xs w-4">{i + 1}.</span>
                <span className={`font-semibold text-sm ${i === 0 ? 'text-yellow-300' : 'text-white/80'}`}>
                  {p.type === 'AI' ? '🤖 ' : '👤 '}{p.name}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {Array.from({ length: p.score }).map((_, s) => (
                  <span key={s} className="text-yellow-400">⭐</span>
                ))}
                <span className="text-white/60 text-sm ml-1">{p.score} pts</span>
              </div>
            </div>
          ))}
        </div>

        {winner?.mission && !isGameOver && (
          <div className="flex flex-col items-center gap-2">
            <p className="text-white/50 text-xs">Winning Mission</p>
            <MissionCardComponent mission={winner.mission} revealed compact={false} />
          </div>
        )}

        <div className="flex gap-3">
          {!isGameOver && (
            <motion.button
              onClick={continueAfterRound}
              className="flex-1 py-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-slate-900 font-black rounded-2xl shadow-lg shadow-yellow-400/30"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Next Round →
            </motion.button>
          )}
          <motion.button
            onClick={resetGame}
            className="flex-1 py-3 bg-white/10 text-white/80 font-bold rounded-2xl border border-white/20 hover:bg-white/20"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {isGameOver ? '🏠 New Game' : 'Quit'}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};
