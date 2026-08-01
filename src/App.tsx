import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from './store/gameStore';
import { Lobby } from './components/Lobby/Lobby';
import { GameBoard } from './components/Board/GameBoard';
import { WinScreen } from './components/WinScreen/WinScreen';
import { useTelegram } from './hooks/useTelegram';

function App() {
  const { state, isAIThinking, setTelegramUser } = useGameStore();
  const { user, isInTelegram, hapticNotification } = useTelegram();

  useEffect(() => {
    if (user && state) {
      setTelegramUser(user);
    }
  }, [user, state?.gameId]);

  useEffect(() => {
    if (state?.gameStatus === 'ROUND_OVER') hapticNotification('success');
    if (state?.gameStatus === 'GAME_OVER') hapticNotification('success');
  }, [state?.gameStatus]);

  const showLobby = !state || state.gameStatus === 'LOBBY';
  const showWin = state && (state.gameStatus === 'ROUND_OVER' || state.gameStatus === 'GAME_OVER');
  const showGame = state && state.gameStatus === 'PLAYING';

  return (
    <div className="relative" dir="ltr">
      {isInTelegram && (
        <div className="fixed top-2 right-2 z-50 text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30">
          Telegram
        </div>
      )}

      <AnimatePresence mode="wait">
        {showLobby && (
          <motion.div key="lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Lobby />
          </motion.div>
        )}
        {showGame && state && (
          <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <GameBoard state={state} isAIThinking={isAIThinking} />
          </motion.div>
        )}
        {showWin && state && (
          <motion.div key="win" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <WinScreen state={state} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
