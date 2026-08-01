import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import type { GameState } from '../../types/game';
import { Shelf } from '../Shelf/Shelf';
import { DrawPool } from '../DrawPool/DrawPool';
import { ActionPanel } from '../ActionPanel/ActionPanel';
import { MissionCardComponent } from '../MissionCard/MissionCard';
import { RulesModal } from '../RulesModal/RulesModal';
import { useGameStore } from '../../store/gameStore';
import { canDrawFromNeighbourDiscard, getAdjacentPlayerIndices } from '../../engine/validators.ts';
import { getShareableUrl } from '../../services/roomSync';

interface GameBoardProps {
  state: GameState;
  isAIThinking: boolean;
}

export const GameBoard: React.FC<GameBoardProps> = ({ state, isAIThinking }) => {
  const {
    drawPool: doDrawPool,
    drawNeighbourDiscard,
    placeOnShelf,
    selectOwnSlot,
    selectTargetSlot,
    checkAFKTimeout,
    reclaimHumanPlayer,
  } = useGameStore();

  const [selectedMobileOpponentIdx, setSelectedMobileOpponentIdx] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);
  const [isQROpen, setIsQROpen] = useState<boolean>(false);

  const human = state.players.find(p => p.wasHuman || p.id === 'player-0') ?? state.players[0];
  const humanIdx = state.players.indexOf(human);
  const isHumanBotControlled = human.type === 'AI' || human.name.includes('(Bot)');

  const currentPlayer = state.players[state.currentTurnIndex];
  const isHumanTurn = currentPlayer.id === human.id && !isHumanBotControlled;
  const { actionPhase, selectedTargetPlayerId, selectedOwnSlot, selectedTargetSlot, turnStartTimestamp } = state;

  const shareUrl = getShareableUrl(state.roomCode);

  useEffect(() => {
    if (state.gameStatus !== 'PLAYING') return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - (turnStartTimestamp || now)) / 1000);
      setElapsedSeconds(elapsed);
      checkAFKTimeout();
    }, 1000);

    return () => clearInterval(interval);
  }, [state.gameStatus, state.currentTurnIndex, turnStartTimestamp]);

  const canDraw = isHumanTurn && actionPhase === 'IDLE';
  const canPlace = isHumanTurn && (actionPhase === 'TILE_DRAWN' || actionPhase === 'PUSH_RESOLVE');

  const adjacentIdxs = getAdjacentPlayerIndices(state);
  const canTargetAll = actionPhase === 'SWITCH_SELECT_TARGET';
  const canTargetAdjacent = actionPhase === 'PUSH_SELECT_TARGET';

  function isPlayerTargetable(playerIndex: number): boolean {
    if (!isHumanTurn) return false;
    if (playerIndex === state.currentTurnIndex) return false;
    if (canTargetAll) return true;
    if (canTargetAdjacent) return adjacentIdxs.includes(playerIndex);
    return false;
  }

  function handleInteraction() {
    if (isHumanBotControlled) {
      reclaimHumanPlayer(human.id);
    }
  }

  function handleShelfSlotClick(playerIndex: number, slotIndex: number) {
    handleInteraction();
    const player = state.players[playerIndex];
    if (playerIndex === state.currentTurnIndex) {
      if (canPlace) {
        placeOnShelf(slotIndex);
      } else if (actionPhase === 'SWITCH_SELECT_OWN') {
        selectOwnSlot(slotIndex);
      }
    } else {
      if (isPlayerTargetable(playerIndex)) {
        selectTargetSlot(player.id, slotIndex);
      }
    }
  }

  const opponents = state.players.filter((_, i) => i !== humanIdx);
  const activeMobileOpponent = opponents[selectedMobileOpponentIdx] ?? opponents[0];

  const remainingAFKSeconds = Math.max(0, 300 - elapsedSeconds);
  const afkMinutes = Math.floor(remainingAFKSeconds / 60);
  const afkSecs = remainingAFKSeconds % 60;

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col p-3 gap-4 overflow-auto relative"
      dir="rtl"
      onClick={handleInteraction}
    >

      {/* 🤖 PROMINENT BOT CONTROLLED BANNER (when human player is converted to bot) */}
      {isHumanBotControlled && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="sticky top-0 z-50 bg-gradient-to-r from-red-600 via-orange-600 to-red-600 text-white p-3 rounded-2xl shadow-2xl border-2 border-yellow-300 flex items-center justify-between flex-wrap gap-2 text-center"
        >
          <div className="flex items-center gap-2 text-sm font-black">
            <span className="text-xl animate-spin">🤖</span>
            <span>המשחק מנוהל כרגע ע"י בוט אוטומטי עקב חוסר פעילות!</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              reclaimHumanPlayer(human.id);
            }}
            className="px-5 py-2 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-sm rounded-xl shadow-lg animate-bounce transition-all border border-yellow-200"
          >
            👋 חזרתי! לחץ כאן לבטל את הבוט ולחזור לשחק 🚀
          </button>
        </motion.div>
      )}

      {/* Top Navbar */}
      <div className="flex items-center justify-between px-2 py-1 bg-black/40 rounded-xl border border-white/10 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <img src="/assets/Logo.png" alt="הסדרנים" className="h-7 rounded" />
          <span className="text-yellow-400 font-black text-sm">הסדרנים</span>
        </div>

        {isHumanBotControlled && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              reclaimHumanPlayer(human.id);
            }}
            className="px-3 py-1 bg-green-500 hover:bg-green-400 text-slate-950 rounded-lg text-xs font-black shadow-lg animate-pulse"
          >
            👋 חזרתי לשחק
          </button>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsQROpen(true);
            }}
            className="px-3 py-1 bg-yellow-400/20 hover:bg-yellow-400/30 text-yellow-300 rounded-lg text-xs font-bold border border-yellow-400/30 transition-all flex items-center gap-1"
          >
            <span>📱</span> קוד QR
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsRulesOpen(true);
            }}
            className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg text-xs font-bold border border-blue-500/30 transition-all flex items-center gap-1"
          >
            <span>📖</span> איך משחקים?
          </button>
        </div>
      </div>

      {/* ── 1. TOP SECTION: OPPONENT SHELVES ────────────────────── */}

      {/* Mobile: Tabs for selecting opponent */}
      <div className="flex flex-col items-center gap-2 md:hidden">
        <div className="flex items-center gap-2 bg-black/50 p-1.5 rounded-xl max-w-full overflow-x-auto border border-white/10">
          <span className="text-white/40 text-xs font-bold px-1">יריבים:</span>
          {opponents.map((opp, idx) => {
            const playerIdx = state.players.indexOf(opp);
            const isCurrent = state.currentTurnIndex === playerIdx;
            const isSelected = idx === selectedMobileOpponentIdx;

            return (
              <button
                key={opp.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedMobileOpponentIdx(idx);
                }}
                className={`
                  px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1
                  ${isSelected
                    ? 'bg-yellow-400 text-slate-950 shadow'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }
                  ${isCurrent ? 'ring-2 ring-yellow-300 animate-pulse' : ''}
                `}
              >
                {opp.type === 'AI' ? '🤖 ' : '👤 '}
                <span>{opp.name}</span>
                {isCurrent && <span className="text-[9px] bg-black/40 text-yellow-300 px-1 rounded">תורו</span>}
              </button>
            );
          })}
        </div>

        {activeMobileOpponent && (
          <div className="flex flex-col items-center">
            {(() => {
              const playerIdx = state.players.indexOf(activeMobileOpponent);
              const isCurrent = state.currentTurnIndex === playerIdx;
              const isTargeted = selectedTargetPlayerId === activeMobileOpponent.id;

              return (
                <div key={activeMobileOpponent.id} className="flex flex-col items-center">
                  <Shelf
                    player={activeMobileOpponent}
                    isCurrentPlayer={isCurrent}
                    isOpponent
                    compact
                    actionPhase={actionPhase}
                    isTargetable={isPlayerTargetable(playerIdx)}
                    selectedTargetPlayerId={selectedTargetPlayerId}
                    highlightSlots={isTargeted && selectedTargetSlot !== null ? [selectedTargetSlot] : []}
                    onSlotClick={isPlayerTargetable(playerIdx)
                      ? (slot) => handleShelfSlotClick(playerIdx, slot)
                      : undefined
                    }
                  />
                  {isCurrent && isAIThinking && (
                    <span className="text-yellow-300 text-xs mt-1 font-medium animate-pulse">
                      🤖 ה-AI חושב…
                    </span>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Desktop (>= 768px): All opponents visible side-by-side */}
      <div className="hidden md:flex justify-center gap-6 flex-wrap">
        {opponents.map((opp) => {
          const playerIdx = state.players.indexOf(opp);
          const isCurrent = state.currentTurnIndex === playerIdx;
          const isTargeted = selectedTargetPlayerId === opp.id;

          return (
            <div key={opp.id} className="flex flex-col items-center">
              <Shelf
                player={opp}
                isCurrentPlayer={isCurrent}
                isOpponent
                compact
                actionPhase={actionPhase}
                isTargetable={isPlayerTargetable(playerIdx)}
                selectedTargetPlayerId={selectedTargetPlayerId}
                highlightSlots={isTargeted && selectedTargetSlot !== null ? [selectedTargetSlot] : []}
                onSlotClick={isPlayerTargetable(playerIdx)
                  ? (slot) => handleShelfSlotClick(playerIdx, slot)
                  : undefined
                }
              />
              {isCurrent && isAIThinking && (
                <span className="text-yellow-300 text-xs mt-1 font-medium animate-pulse">
                  🤖 ה-AI חושב…
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* ── 2. CENTER SECTION: DRAW POOL & PREVIOUS DISCARD & MISSIONS DECK ── */}
      <div className="flex justify-center my-1">
        <div className="bg-black/40 rounded-3xl p-4 border border-white/10 shadow-xl flex flex-col items-center gap-2">
          <DrawPool
            state={state}
            onDrawPool={() => {
              handleInteraction();
              doDrawPool();
            }}
            onDrawDiscard={() => {
              handleInteraction();
              drawNeighbourDiscard();
            }}
            canDrawDiscard={canDrawFromNeighbourDiscard(state)}
            disabled={!canDraw}
          />
          {!isHumanBotControlled && (
            <span className="text-[10px] text-white/40 font-mono">
              ⏱ זמן תור נותר: {afkMinutes}:{afkSecs < 10 ? `0${afkSecs}` : afkSecs} (מעבר ל-AI ב-5 דקות)
            </span>
          )}
        </div>
      </div>

      {/* ── 3. BOTTOM SECTION: YOUR PLAYER AREA (SHELF + MISSION CARD SIDE-BY-SIDE) ── */}
      <div className="flex flex-col items-center gap-3 mt-auto">
        <div className="w-full max-w-xl">
          <ActionPanel state={state} />
        </div>

        <div className="flex items-start justify-center gap-6 flex-wrap max-w-3xl w-full">
          {/* Your Shelf Board */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <span className="text-yellow-300 font-bold text-xs">🛒 המדף שלך ({human.name})</span>
              {isHumanBotControlled && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    reclaimHumanPlayer(human.id);
                  }}
                  className="text-[10px] bg-red-500 hover:bg-red-400 text-white font-bold border border-red-300 px-2.5 py-0.5 rounded-full shadow animate-pulse cursor-pointer"
                >
                  🤖 בוט פועל — [ לחץ כאן לחזור לשחק ]
                </button>
              )}
            </div>
            <div className="rounded-2xl p-1 bg-white/5 border border-white/10 shadow-xl">
              <Shelf
                player={human}
                isCurrentPlayer={state.currentTurnIndex === humanIdx}
                actionPhase={actionPhase}
                allowRearrange={!isHumanBotControlled}
                onSlotClick={(slot) => handleShelfSlotClick(humanIdx, slot)}
                highlightSlots={
                  human.hasPushPlaceholder && human.pushSlotIndex !== null
                    ? [human.pushSlotIndex]
                    : selectedOwnSlot !== null
                      ? [selectedOwnSlot]
                      : []
                }
              />
            </div>
          </div>

          {/* Your Target Mission Card */}
          {human.mission && (
            <div className="flex flex-col items-center gap-1">
              <span className="text-yellow-300 font-bold text-xs">🎯 כרטיס המשימה הסודי</span>
              <div className="p-2 bg-white/5 border border-white/10 rounded-2xl shadow-xl">
                <MissionCardComponent
                  mission={human.mission}
                  revealed={true}
                  compact={false}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center gap-3 text-white/50 text-xs">
          <span>קוד חדר: {state.roomCode}</span>
          <span>•</span>
          <span>סבב {state.roundNumber}</span>
          <span>•</span>
          <span>{state.drawPool.length} אריחים בקופה</span>
          <span>•</span>
          <button onClick={() => setIsRulesOpen(true)} className="text-yellow-300 underline font-semibold">
            📖 איך משחקים?
          </button>
        </div>
      </div>

      {/* Rules Modal */}
      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />

      {/* QR Code Modal */}
      <AnimatePresence>
        {isQROpen && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setIsQROpen(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-slate-900 border border-white/20 rounded-3xl p-6 flex flex-col items-center gap-4 max-w-sm w-full text-center shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between w-full border-b border-white/10 pb-2">
                <span className="text-yellow-400 font-black text-sm">📱 סרוק קוד QR להצטרפות</span>
                <button onClick={() => setIsQROpen(false)} className="text-white/60 hover:text-white font-bold text-sm">✕</button>
              </div>
              <div className="bg-white p-3 rounded-2xl border-4 border-yellow-400 shadow-xl">
                <QRCodeSVG value={shareUrl} size={180} bgColor="#ffffff" fgColor="#0f172a" level="M" />
              </div>
              <p className="text-white/70 text-xs leading-relaxed">
                סריקה במצלמת המכשיר הנייד תפתח את המשחק ישירות בחדר <strong>{state.roomCode}</strong> ותאפשר התקנה כאפליקציה (PWA)!
              </p>
              <button
                onClick={() => setIsQROpen(false)}
                className="w-full py-2.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs rounded-xl shadow"
              >
                סגור
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
