import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import type { AILevel } from '../../types/game';
import { getShareableUrl, getWhatsAppShareUrl, getTelegramShareUrl } from '../../services/roomSync';
import { RulesModal } from '../RulesModal/RulesModal';

export const Lobby: React.FC = () => {
  const { settings, updateSettings, startGame, state, joinRoom, togglePlayerReady } = useGameStore();

  const [inputRoomCode, setInputRoomCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isRulesOpen, setIsRulesOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam && !state) {
      setJoining(true);
      joinRoom(roomParam).then(success => {
        setJoining(false);
        if (!success) setJoinError('חדר המשחק לא נמצא או פג תוקף');
      });
    }
  }, []);

  const totalPlayers = settings.playerCount;
  const aiCount = totalPlayers - settings.humanCount;
  const roomCode = state?.roomCode || settings.roomCode || 'SADR8';

  const shareUrl = getShareableUrl(roomCode);
  const whatsappUrl = getWhatsAppShareUrl(roomCode);
  const telegramUrl = getTelegramShareUrl(roomCode);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleJoinManual = async () => {
    if (!inputRoomCode.trim()) return;
    setJoining(true);
    setJoinError(null);
    const ok = await joinRoom(inputRoomCode.trim().toUpperCase());
    setJoining(false);
    if (!ok) setJoinError('קוד החדר לא נמצא');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4" dir="rtl">
      <motion.div
        className="w-full max-w-md bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm p-6 flex flex-col gap-5 shadow-2xl"
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      >
        <div className="flex flex-col items-center gap-2">
          <img src="/assets/Logo.png" alt="הסדרנים" className="w-52 rounded-2xl shadow-xl border border-white/10" />
          <h1 className="text-3xl font-black text-yellow-400 tracking-tight mt-1">
            הסדרנים
          </h1>
          <p className="text-white/50 text-xs text-center">משחק סידור מדפים בסופרמרקט בזמן אמת</p>
        </div>

        {/* ── BUTTON TO OPEN HOW TO PLAY INSTRUCTIONS ── */}
        <button
          onClick={() => setIsRulesOpen(true)}
          className="w-full py-2.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-2xl border border-blue-500/30 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow"
        >
          <span>📖</span> לחץ כאן לקריאת הוראות המשחק (איך משחקים?)
        </button>

        {/* ── ROOM INVITATION & SHARE ENGINE ── */}
        <div className="bg-black/40 rounded-2xl p-4 border border-white/10 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-white/70 text-xs font-bold">קוד חדר משחק:</span>
            <span className="text-yellow-300 font-mono font-black text-lg bg-yellow-400/10 px-3 py-0.5 rounded-lg border border-yellow-400/30">
              {roomCode}
            </span>
          </div>

          <div className="text-xs text-white/50 font-medium">שתף והזמן שחקנים אנושיים לחדר:</div>

          <div className="grid grid-cols-3 gap-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 px-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow transition-all"
            >
              <span>💬</span> WhatsApp
            </a>

            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 px-2 bg-blue-500 hover:bg-blue-400 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow transition-all"
            >
              <span>✈️</span> Telegram
            </a>

            <button
              onClick={handleCopyLink}
              className="py-2 px-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 border border-white/20 transition-all"
            >
              <span>🔗</span> {copied ? 'הועתק!' : 'העתק קישור'}
            </button>
          </div>
        </div>

        {/* ── JOIN EXISTING ROOM MANUALLY ── */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="הזן קוד חדר (לדוגמה SADR8)"
            value={inputRoomCode}
            onChange={(e) => setInputRoomCode(e.target.value)}
            className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-xs font-mono uppercase focus:outline-none focus:border-yellow-400"
          />
          <button
            onClick={handleJoinManual}
            disabled={joining}
            className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold rounded-xl text-xs transition-all shadow"
          >
            {joining ? 'מצטרף…' : 'הצטרף לחדר'}
          </button>
        </div>
        {joinError && <p className="text-red-400 text-xs text-center">{joinError}</p>}

        {/* ── GAME ROOM SETTINGS & READINESS ── */}
        {state?.gameStatus === 'WAITING_FOR_READIES' ? (
          <div className="bg-black/30 rounded-2xl p-4 border border-white/10 flex flex-col gap-3">
            <span className="text-yellow-300 font-bold text-xs text-center">
              ממתין לאישור השחקנים האנושיים...
            </span>
            <div className="space-y-1.5">
              {state.players.map((p) => (
                <div key={p.id} className="flex items-center justify-between bg-white/5 px-3 py-2 rounded-xl text-xs">
                  <span className="text-white font-semibold">{p.name} {p.type === 'AI' ? '🤖' : '👤'}</span>
                  {p.isReady ? (
                    <span className="text-green-400 font-bold">✓ מאשר / מוכן</span>
                  ) : (
                    <span className="text-orange-300 font-medium animate-pulse">ממתין לאישור...</span>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={() => togglePlayerReady(state.players[0].id)}
              className="w-full py-3 bg-gradient-to-r from-green-400 to-emerald-500 text-slate-950 font-black text-sm rounded-xl shadow-lg"
            >
              ✓ אני מאשר / מוכן לבד!
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <label className="text-white/70 text-sm font-semibold">מספר שחקנים בחדר</label>
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
                    {n === 1 ? '1 (נגד AI)' : n === totalPlayers ? `${n} (מול מוזמנים)` : n}
                  </button>
                ))}
              </div>
              {aiCount > 0 && (
                <p className="text-white/40 text-xs text-center">{aiCount} בוטים יכנסו אוטומטית</p>
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
              🚀 התחל משחק!
            </motion.button>
          </>
        )}

        {/* ── ALWAYS VISIBLE SUMMARY OF GAME RULES ── */}
        <div className="bg-black/30 rounded-2xl p-4 border border-white/10 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-yellow-300 font-bold text-xs">📖 תמצית חוקי המשחק:</span>
            <button
              onClick={() => setIsRulesOpen(true)}
              className="text-[11px] text-blue-300 underline font-semibold"
            >
              להסבר המלא ←
            </button>
          </div>
          <ul className="text-white/70 text-[11px] space-y-1 list-disc list-inside leading-relaxed">
            <li>סדר את 8 האריחים במדף הסופרמרקט שלך בהתאמה לכרטיס המשימה.</li>
            <li>שלוף קלף מהקופה או קח את האריח שהשכן מימינך זרק להשלכות.</li>
            <li>ניתן להחליף מיקומים במדף שלך (Drag & Drop) חופשי ללא איבוד תור!</li>
            <li>🔴 Push 🔵 Switch 💛 Steal ⭐ Sale (ג'וקר חליפי למוצר - עד 1 למדף).</li>
          </ul>
        </div>
      </motion.div>

      {/* ── FULL RULES MODAL ── */}
      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />
    </div>
  );
};
