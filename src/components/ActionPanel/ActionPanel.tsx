import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameState, ActionPhase } from '../../types/game';
import { TileComponent } from '../Tile/Tile';
import { useGameStore } from '../../store/gameStore';

interface ActionPanelProps {
  state: GameState;
}

export const ActionPanel: React.FC<ActionPanelProps> = ({ state }) => {
  const {
    discardTile,
    confirmSwitch,
    confirmSteal,
    confirmPush,
  } = useGameStore();

  const [, setStealOwnSlot] = useState<number | null>(null);

  const currentPlayer = state.players[state.currentTurnIndex];
  const { drawnTile, actionPhase, selectedOwnSlot, selectedTargetPlayerId, selectedTargetSlot } = state;

  const isHumanTurn = currentPlayer.type === 'HUMAN';

  const phaseInstructions: Record<ActionPhase, string> = {
    IDLE: 'שלוף אריח מהקופה או מההשלכות',
    TILE_DRAWN: 'הנח במדף שלך או זרוק להשלכות',
    SWITCH_SELECT_OWN: 'בחר אריח מהמדף שלך להחלפה',
    SWITCH_SELECT_TARGET: 'בחר אריח מתוך מדף של יריב',
    STEAL_SELECT_TARGET: 'בחר אריח ממדף יריב לגניבה',
    PUSH_SELECT_TARGET: 'בחר אריח ממדף שכן לדחיפה',
    PUSH_RESOLVE: 'נסחפת! השתמש באריח שנשלף כדי למלא את המשבצת',
  };

  return (
    <div className="flex flex-col items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/10 w-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={actionPhase}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          className={`
            text-sm font-semibold text-center px-4 py-1.5 rounded-full
            ${actionPhase === 'IDLE' ? 'bg-white/10 text-white/60' : 'bg-yellow-500/20 text-yellow-300'}
          `}
        >
          {isHumanTurn ? phaseInstructions[actionPhase] : '🤖 ה-AI חושב…'}
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-center gap-6">
        {drawnTile && (
          <div className="flex flex-col items-center gap-1">
            <span className="text-white/50 text-xs">אריח שנשלף</span>
            <AnimatePresence>
              <motion.div
                key={drawnTile.id}
                initial={{ y: -40, rotate: -15, opacity: 0 }}
                animate={{ y: 0, rotate: 0, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <TileComponent tile={drawnTile} size="lg" selected />
              </motion.div>
            </AnimatePresence>
            <span className="text-white/70 text-xs font-medium">{drawnTile.nameHe}</span>
          </div>
        )}

        {isHumanTurn && (
          <div className="flex flex-col gap-2 items-center">
            {actionPhase === 'TILE_DRAWN' && drawnTile && (
              <>
                <button
                  onClick={discardTile}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/40 text-red-300 rounded-xl border border-red-500/30 text-sm font-semibold transition-all shadow"
                >
                  🗑 לזרוק להשלכות
                </button>
                <p className="text-white/40 text-xs text-center">או לחץ על משבצת במדף להנחה</p>
              </>
            )}

            {actionPhase === 'PUSH_RESOLVE' && (
              <p className="text-orange-300 text-xs font-semibold text-center">
                לחץ על המשבצת ה-🔴 במדף שלך להנחת האריח
              </p>
            )}

            {actionPhase === 'SWITCH_SELECT_OWN' && (
              <p className="text-blue-300 text-xs text-center">לחץ על אחד האריחים במדף שלך</p>
            )}

            {actionPhase === 'SWITCH_SELECT_TARGET' && selectedOwnSlot !== null && (
              <>
                <p className="text-blue-300 text-xs text-center">כעת לחץ על אריח במדף היריב</p>
                {selectedTargetPlayerId && selectedTargetSlot !== null && (
                  <button
                    onClick={confirmSwitch}
                    className="px-4 py-2 bg-blue-500/30 hover:bg-blue-500/50 text-blue-200 rounded-xl border border-blue-500/40 text-sm font-semibold transition-all shadow"
                  >
                    ↔ אישור החלפה
                  </button>
                )}
              </>
            )}

            {actionPhase === 'STEAL_SELECT_TARGET' && (
              <>
                <p className="text-yellow-300 text-xs text-center">לחץ על אריח היריב לגניבה</p>
                {selectedTargetPlayerId && selectedTargetSlot !== null && (
                  <div className="flex flex-col gap-1 items-center">
                    <p className="text-yellow-300 text-xs text-center">בחר את המשבצת שלך להחלפה:</p>
                    <div className="grid grid-cols-4 gap-1">
                      {currentPlayer.shelf.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setStealOwnSlot(i);
                            confirmSteal(i);
                          }}
                          className="w-8 h-8 bg-white/10 hover:bg-yellow-400/30 rounded text-xs text-white/70 border border-white/20 font-bold"
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {actionPhase === 'PUSH_SELECT_TARGET' && (
              <>
                <p className="text-orange-300 text-xs text-center">לחץ על אריח השכן לדחיפה</p>
                {selectedTargetPlayerId && selectedTargetSlot !== null && (
                  <button
                    onClick={confirmPush}
                    className="px-4 py-2 bg-orange-500/30 hover:bg-orange-500/50 text-orange-200 rounded-xl border border-orange-500/40 text-sm font-semibold transition-all shadow"
                  >
                    👊 אישור דחיפה
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
