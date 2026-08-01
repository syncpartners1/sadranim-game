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
          <img src="/assets/cards/jambo front.png" alt="הסדרנים" className="w-24 rounded-xl shadow-lg" />
          <h1 className="text-4xl font-black text-yellow-400 tracking-tight">
            הסדרנים
          </h1>
          <p className="text-white/50 text-sm text-center">משחק סידור מדפים בסופרמרקט</p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-white/70 text-sm font-semibold">מספר שחקנים</label>
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
                {n} שחקנים
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-white/70 text-sm font-semibold">שחקנים אנושיים</label>
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
                {n === 1 ? '1 (נגד AI)' : n === totalPlayers ? `${n} (Pass & Play)` : n}
              </button>
            ))}
          </div>
          {aiCount > 0 && (
            <p className="text-white/40 text-xs text-center">{aiCount} בוטים ישחקו איתך</p>
          )}
        </div>

        {aiCount > 0 && (
          <div className="flex flex-col gap-2">
            <label className="text-white/70 text-sm font-semibold">רמת קושי ה-AI</label>
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
                  {level === 'EASY' ? '😊 קל' : level === 'MEDIUM' ? '🎯 בינוני' : '🔥 קשה'}
                </button>
              ))}
            </div>
          </div>
        )}

        <motion.button
          onClick={startGame}
          className="w-full py-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-slate-900 font-black text-xl rounded-2xl shadow-lg shadow-yellow-400/30"
          whileHover={{ scale: 1.03, boxShadow: '0 0 30px rgba(250,204,21,0.5)' }}
          whileTap={{ scale: 0.97 }}
        >
          🛒 להתחיל לשחק!
        </motion.button>

        <details className="text-white/40 text-xs" dir="rtl">
          <summary className="cursor-pointer text-white/60 font-medium">איך משחקים?</summary>
          <ul className="mt-2 space-y-1 list-disc list-inside leading-relaxed text-right">
            <li>סדר את המדף שלך לפי כרטיס המשימה הסודי</li>
            <li>בכל תור: שלוף אריח, הנח במדף או זרוק להשלכות</li>
            <li>ניתן להחליף מיקומים במדף שלך בכל עת ללא איבוד תור!</li>
            <li>🔴 Push (דחיפה) — דוחף אריח ממדף שכן</li>
            <li>🔵 Switch (החלפה) — מחליף אריח מול שחקן יריב</li>
            <li>💛 Steal (גניבה) — גונב אריח ממדף יריב</li>
            <li>⭐ Sale (מבצע) — ג'וקר המשמש ככל מוצר (עד 1 במדף)</li>
            <li>הראשון שמסיים את המדף מנצח בסבב!</li>
            <li>המשחק מסתיים לאחר 18 סבבים</li>
          </ul>
        </details>
      </motion.div>
    </div>
  );
};
