import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { GameState } from '../../types/game';
import { Shelf } from '../Shelf/Shelf';
import { DrawPool } from '../DrawPool/DrawPool';
import { ActionPanel } from '../ActionPanel/ActionPanel';
import { MissionCardComponent } from '../MissionCard/MissionCard';
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
  } = useGameStore();

  const [selectedMobileOpponentIdx, setSelectedMobileOpponentIdx] = useState<number>(0);

  const currentPlayer = state.players[state.currentTurnIndex];
  const isHumanTurn = currentPlayer.type === 'HUMAN';
  const { actionPhase, selectedTargetPlayerId } = state;

  const canDraw = isHumanTurn && actionPhase === 'IDLE';
  const canPlace = isHumanTurn && (actionPhase === 'TILE_DRAWN' || actionPhase === 'PUSH_RESOLVE');

  const adjacentIdxs = getAdjacentPlayerIndices(state);
  const canTargetAll = actionPhase === 'SWITCH_SELECT_TARGET' || actionPhase === 'STEAL_SELECT_TARGET';
  const canTargetAdjacent = actionPhase === 'PUSH_SELECT_TARGET';

  function isPlayerTargetable(playerIndex: number): boolean {
    if (!isHumanTurn) return false;
    if (playerIndex === state.currentTurnIndex) return false;
    if (canTargetAll) return true;
    if (canTargetAdjacent) return adjacentIdxs.includes(playerIndex);
    return false;
  }

  function handleShelfSlotClick(playerIndex: number, slotIndex: number) {
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

  const human = state.players.find(p => p.type === 'HUMAN') ?? state.players[0];
  const humanIdx = state.players.indexOf(human);
  const opponents = state.players.filter((_, i) => i !== humanIdx);

  const activeMobileOpponent = opponents[selectedMobileOpponentIdx] ?? opponents[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col p-2 gap-3 overflow-auto" dir="rtl">

      {/* ── TOP: OPPONENT SHELVES ───────────────────────────────── */}

      {/* MOBILE (< 768px): Tabbed navigation for opponents */}
      <div className="flex flex-col items-center gap-2 md:hidden">
        <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl max-w-full overflow-x-auto">
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
                    ? 'bg-yellow-400 text-slate-900 shadow-md'
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

        {/* Selected opponent shelf on mobile */}
        {activeMobileOpponent && (
          <div className="flex flex-col items-center">
            {(() => {
              const playerIdx = state.players.indexOf(activeMobileOpponent);
              const isCurrent = state.currentTurnIndex === playerIdx;
              return (
                <motion.div
                  key={activeMobileOpponent.id}
                  className="flex flex-col items-center"
                  animate={isCurrent ? { y: [0, -3, 0] } : {}}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
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
                    <motion.div
                      className="text-yellow-300 text-xs mt-0.5 font-medium"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                    >
                      🤖 ה-AI חושב…
                    </motion.div>
                  )}
                </motion.div>
              );
            })()}
          </div>
        )}
      </div>

      {/* DESKTOP (≥ 768px): Virtual seating table layout (all opponents visible) */}
      <div className="hidden md:flex justify-center gap-6 flex-wrap">
        {opponents.map((opp) => {
          const playerIdx = state.players.indexOf(opp);
          const isCurrent = state.currentTurnIndex === playerIdx;
          return (
            <motion.div
              key={opp.id}
              className="flex flex-col items-center"
              animate={isCurrent ? { y: [0, -4, 0] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
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
                <motion.div
                  className="text-yellow-300 text-xs mt-1 font-medium"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                >
                  🤖 ה-AI חושב…
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* ── CENTER: Draw Pool & Discard & Mission Stack Row ────────────── */}
      <div className="flex justify-center my-1">
        <div className="bg-black/30 rounded-2xl p-3 border border-white/10">
          <DrawPool
            state={state}
            onDrawPool={doDrawPool}
            onDrawDiscard={drawNeighbourDiscard}
            canDrawDiscard={canDrawFromNeighbourDiscard(state)}
            disabled={!canDraw}
          />
        </div>
      </div>

      {/* ── BOTTOM: Player Area — Side-by-Side Shelf + Secret Mission Card ── */}
      <div className="flex flex-col items-center gap-3 mt-auto">
        <div className="w-full max-w-xl">
          <ActionPanel state={state} />
        </div>

        <div className="flex items-center justify-center gap-4 flex-wrap max-w-2xl w-full">
          {/* Player Shelf Board */}
          <motion.div
            animate={state.currentTurnIndex === humanIdx
              ? { boxShadow: ['0 0 0px #fde047', '0 0 20px #fde047', '0 0 0px #fde047'] }
              : { boxShadow: 'none' }
            }
            transition={{ duration: 2, repeat: Infinity }}
            className="rounded-2xl p-1 bg-white/5 border border-white/10"
          >
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
          </motion.div>

          {/* Secret Mission Card — Side by Side */}
          {human.mission && (
            <div className="flex flex-col items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-2xl">
              <span className="text-yellow-300 font-bold text-xs">🎯 כרטיס המשימה שלך</span>
              <MissionCardComponent
                mission={human.mission}
                revealed={true}
                compact={false}
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 text-white/50 text-xs">
          <span>סבב {state.roundNumber}</span>
          <span>•</span>
          <span>{state.drawPool.length} אריחים בקופה</span>
          <span>•</span>
          <span>{state.missionsPool.length} משימות נותרו</span>
        </div>
      </div>
    </div>
  );
};
