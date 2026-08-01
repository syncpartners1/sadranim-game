import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameState, ActionPhase } from '../../types/game';
import { TileComponent } from '../Tile/Tile';
import { useGameStore } from '../../store/gameStore';
import { checkWin } from '../../engine/validators.ts';

interface ActionPanelProps {
  state: GameState;
}

export const ActionPanel: React.FC<ActionPanelProps> = ({ state }) => {
  const {
    discardTile,
    confirmSwitch,
    confirmPush,
    claimWin,
  } = useGameStore();

  const [claimFeedback, setClaimFeedback] = useState<string | null>(null);

  const currentPlayer = state.players[state.currentTurnIndex];
  const humanPlayer = state.players.find(p => p.wasHuman || p.type === 'HUMAN') ?? currentPlayer;
  const { drawnTile, drawnFromDiscard, actionPhase, selectedOwnSlot, selectedTargetPlayerId, selectedTargetSlot } = state;

  const isHumanTurn = currentPlayer.id === humanPlayer.id && humanPlayer.type === 'HUMAN';
  const isHumanWinReady = checkWin(humanPlayer, state);

  const phaseInstructions: Record<ActionPhase, string> = {
    IDLE: 'שלוף אריח מהקופה או מההשלכות של השכן 1',
    TILE_DRAWN: drawnFromDiscard
      ? 'אריח שנלקח מהשכן — חובה להניח אותו במדף!'
      : 'הנח במדף שלך או זרוק להשלכות',
    SWITCH_SELECT_TARGET: '🔵 צעד 1: בחר קודם אריח במדף של השכן להחלפה',
    SWITCH_SELECT_OWN: '🔵 צעד 2: כעת בחר אריח במדף שלך שתרצה להחליף מולו',
    PUSH_SELECT_TARGET: '🔴 בחר אריח במדף של שכן לדחיפה ולאחר מכן לחץ על אישור דחיפה',
    PUSH_RESOLVE: 'נסחפת! השתמש באריח שנשלף כדי למלא את המשבצת במדף',
  };

  const handleClaimWinClick = () => {
    if (isHumanWinReady) {
      claimWin(humanPlayer.id);
    } else {
      setClaimFeedback('המדף עדיין לא תואם ב-100% לכרטיס המשימה! המשך לסדר');
      setTimeout(() => setClaimFeedback(null), 3000);
    }
  };

  const targetPlayer = state.players.find(p => p.id === selectedTargetPlayerId);

  return (
    <div className="flex flex-col items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/10 w-full" dir="rtl">
      {/* Top Banner & Claim Win Button */}
      <div className="flex items-center justify-between w-full gap-2 flex-wrap">
        <AnimatePresence mode="wait">
          <motion.div
            key={actionPhase + (drawnFromDiscard ? '-discard' : '')}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className={`
              text-xs font-bold px-4 py-2 rounded-full flex-1 text-center shadow-md
              ${actionPhase === 'IDLE'
                ? 'bg-white/10 text-white/70'
                : actionPhase.startsWith('SWITCH')
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-400/40 animate-pulse'
                  : actionPhase.startsWith('PUSH')
                    ? 'bg-orange-500/20 text-orange-300 border border-orange-400/40 animate-pulse'
                    : 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/40'
              }
            `}
          >
            {isHumanTurn ? phaseInstructions[actionPhase] : '🤖 ה-AI חושב…'}
          </motion.div>
        </AnimatePresence>

        {/* Prominent "סיימתי!" Button */}
        <motion.button
          onClick={handleClaimWinClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`
            px-4 py-1.5 rounded-xl font-black text-sm shadow-lg transition-all flex items-center gap-1.5
            ${isHumanWinReady
              ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-slate-950 animate-bounce ring-2 ring-green-300'
              : 'bg-yellow-400/20 hover:bg-yellow-400/40 text-yellow-300 border border-yellow-400/40'
            }
          `}
        >
          <span>🏆</span>
          <span>סיימתי!</span>
        </motion.button>
      </div>

      {/* Claim Win Feedback toast */}
      {claimFeedback && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-xs text-orange-300 bg-orange-500/20 px-3 py-1 rounded-lg border border-orange-500/30 text-center font-medium"
        >
          {claimFeedback}
        </motion.div>
      )}

      <div className="flex items-center justify-center gap-6 flex-wrap">
        {drawnTile && (
          <div className="flex flex-col items-center gap-1">
            <span className="text-white/50 text-xs">
              {drawnFromDiscard ? 'אריח שנלקח מהשכן 1' : 'אריח שנשלף'}
            </span>
            <div key={drawnTile.id} className="inline-block">
              <TileComponent tile={drawnTile} size="lg" selected />
            </div>
            <span className="text-white/70 text-xs font-medium">{drawnTile.nameHe}</span>
          </div>
        )}

        {isHumanTurn && (
          <div className="flex flex-col gap-2 items-center">
            {actionPhase === 'TILE_DRAWN' && drawnTile && (
              <>
                {!drawnFromDiscard ? (
                  <button
                    onClick={discardTile}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/40 text-red-300 rounded-xl border border-red-500/30 text-sm font-semibold transition-all shadow"
                  >
                    🗑 לזרוק להשלכות
                  </button>
                ) : (
                  <span className="text-yellow-300/80 text-xs font-bold bg-yellow-500/20 px-3 py-1 rounded-lg border border-yellow-500/30">
                    🔒 חובה להניח במדף
                  </span>
                )}
                <p className="text-white/40 text-xs text-center">לחץ על משבצת במדף להנחה</p>
              </>
            )}

            {actionPhase === 'PUSH_RESOLVE' && (
              <p className="text-orange-300 text-xs font-semibold text-center">
                לחץ על המשבצת ה-🔴 במדף שלך להנחת האריח
              </p>
            )}

            {/* SWITCH STEP-BY-STEP CONTROLS */}
            {actionPhase === 'SWITCH_SELECT_TARGET' && (
              <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded-xl flex flex-col items-center gap-1">
                <span className="text-blue-300 font-bold text-xs">צעד 1 מתוך 2</span>
                <p className="text-white/80 text-xs text-center">לחץ קודם על אריח במדף של השכן להחלפה</p>
              </div>
            )}

            {actionPhase === 'SWITCH_SELECT_OWN' && (
              <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded-xl flex flex-col items-center gap-2">
                <span className="text-blue-300 font-bold text-xs">צעד 2 מתוך 2</span>
                <p className="text-white/80 text-xs text-center">
                  נבחר אריח של {targetPlayer?.name || 'שכן'} (משבצת {selectedTargetSlot !== null ? selectedTargetSlot + 1 : ''}).
                  <br />
                  <strong className="text-yellow-300">כעת לחץ על אריח במדף שלך</strong> ולאחר מכן אשר!
                </p>
                {selectedOwnSlot !== null && selectedTargetPlayerId && selectedTargetSlot !== null && (
                  <motion.button
                    onClick={confirmSwitch}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-5 py-2 bg-blue-500 hover:bg-blue-400 text-white font-black rounded-xl shadow-lg border border-blue-300 text-sm animate-bounce"
                  >
                    ↔ אישור החלפה
                  </motion.button>
                )}
              </div>
            )}

            {/* PUSH CONTROLS */}
            {actionPhase === 'PUSH_SELECT_TARGET' && (
              <div className="bg-orange-500/10 border border-orange-500/30 p-3 rounded-xl flex flex-col items-center gap-2">
                <span className="text-orange-300 font-bold text-xs">דחיפת אריח לשכן</span>
                <p className="text-white/80 text-xs text-center">
                  {selectedTargetSlot !== null && targetPlayer
                    ? `נבחרה משבצת ${selectedTargetSlot + 1} במדף של ${targetPlayer.name}`
                    : 'לחץ על אריח במדף השכן לדחיפה'}
                </p>
                {selectedTargetPlayerId && selectedTargetSlot !== null && (
                  <motion.button
                    onClick={confirmPush}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-5 py-2 bg-orange-500 hover:bg-orange-400 text-white font-black rounded-xl shadow-lg border border-orange-300 text-sm animate-bounce"
                  >
                    👊 אישור דחיפה
                  </motion.button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
