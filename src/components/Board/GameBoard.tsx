import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { GameState } from '../../types/game';
import { Shelf } from '../Shelf/Shelf';
import { DrawPool } from '../DrawPool/DrawPool';
import { ActionPanel } from '../ActionPanel/ActionPanel';
import { MissionCardComponent } from '../MissionCard/MissionCard';
import { RulesModal } from '../RulesModal/RulesModal';
import { useGameStore } from '../../store/gameStore';
import { canDrawFromNeighbourDiscard, getAdjacentPlayerIndices } from '../../engine/validators';

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

  const currentPlayer = state.players[state.currentTurnIndex];
  const isHumanTurn = currentPlayer.type === 'HUMAN';
  const { actionPhase, selectedTargetPlayerId, turnStartTimestamp } = state;

  // Find human player slot
  const human = state.players.find(p => p.type === 'HUMAN') ?? state.players[0];
  const humanIdx = state.players.indexOf(human);
  const isHumanBotControlled = human.name.includes('(Bot)');

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

  function handleShelfSlotClick(playerIndex: number, slotIndex: number) {
    if (isHumanBotControlled) {
      reclaimHumanPlayer(human.id);
    }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col p-3 gap-4 overflow-auto" dir="rtl">

      {/* Top Navbar with Rules & Reclaim Button */}
      <div className="flex items-center justify-between px-2 py-1 bg-black/40 rounded-xl border border-white/10 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <img src="/assets/Logo.png" alt="הסדרנים" className="h-7 rounded" />
          <span className="text-yellow-400 font-black text-sm">הסדרנים</span>
        </div>

        {/* If player was converted to bot, show a Reclaim button */}
        {isHumanBotControlled && (
          <motion.button
            onClick={() => reclaimHumanPlayer(human.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-3 py-1 bg-green-500 hover:bg-green-400 text-slate-950 rounded-lg text-xs font-black shadow-lg animate-pulse"
          >
            👋 חזרתי! בטל את הבוט וקח שליטה בחזרה
          </motion.button>
        )}

        <button
          onClick={() => setIsRulesOpen(true)}
          className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg text-xs font-bold border border-blue-500/30 transition-all flex items-center gap-1"
        >
          <span>📖</span> איך משחקים?
        </button>
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
                onClick={() => setSelectedMobileOpponentIdx(idx)}
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
              if (isHumanBotControlled) reclaimHumanPlayer(human.id);
              doDrawPool();
            }}
            onDrawDiscard={() => {
              if (isHumanBotControlled) reclaimHumanPlayer(human.id);
              drawNeighbourDiscard();
            }}
            canDrawDiscard={canDrawFromNeighbourDiscard(state)}
            disabled={!canDraw}
          />
          {isHumanTurn && (
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
              <span className="text-yellow-300 font-bold text-xs">🛒 המדף שלך</span>
              {isHumanBotControlled && (
                <span className="text-[10px] bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-full font-semibold animate-pulse">
                  🤖 בוט פועל כרגע בשמך
                </span>
              )}
            </div>
            <div className="rounded-2xl p-1 bg-white/5 border border-white/10 shadow-xl">
              <Shelf
                player={human}
                isCurrentPlayer={state.currentTurnIndex === humanIdx}
                actionPhase={actionPhase}
                allowRearrange={true}
                onSlotClick={(slot) => handleShelfSlotClick(humanIdx, slot)}
                highlightSlots={
                  human.hasPushPlaceholder && human.pushSlotIndex !== null
                    ? [human.pushSlotIndex]
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
    </div>
  );
};
