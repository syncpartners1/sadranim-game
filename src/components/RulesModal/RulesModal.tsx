import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4" dir="rtl" onClick={onClose}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="relative max-w-lg w-full bg-slate-900 border border-white/20 rounded-3xl p-6 flex flex-col gap-4 shadow-2xl max-h-[85vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="text-2xl font-black text-yellow-400 flex items-center gap-2">
              📖 איך משחקים ב"הסדרנים"?
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-sm flex items-center justify-center"
            >
              ✕
            </button>
          </div>

          {/* Body content */}
          <div className="space-y-4 text-xs text-white/80 leading-relaxed">
            {/* Goal */}
            <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
              <h3 className="font-bold text-sm text-yellow-300 mb-1">🎯 מטרת המשחק</h3>
              <p>
                להיות השחקן הראשון שמסדר את 8 המשבצות במדף הסופרמרקט שלו בהתאמה מדויקת לכרטיס המשימה הסודי שקיבל!
              </p>
            </div>

            {/* Turn Steps */}
            <div className="bg-white/5 p-3 rounded-2xl border border-white/10 space-y-2">
              <h3 className="font-bold text-sm text-yellow-300">🛒 מהלך התור:</h3>
              <ol className="list-decimal list-inside space-y-1 text-white/90">
                <li>
                  <strong className="text-white">שליפת אריח:</strong> לחץ על קופת המשחק המרכזית לשליפה, או קח את האריח העליון שזרק השחקן שמימינך (שליפה מהשכן מחייבת הנחה במדף).
                </li>
                <li>
                  <strong className="text-white">הנחה או זריקה:</strong> הנח את האריח שנשלף בתוך משבצת במדף שלך, או לחץ על "לזרוק להשלכות".
                </li>
                <li>
                  <strong className="text-white">סידור חופשי במדף (Drag & Drop):**</strong> ניתן לגרור או ללחוץ על 2 אריחים במדף שלך בכל עת כדי להחליף מיקומים <strong className="text-yellow-300">ללא איבוד תור!</strong>
                </li>
              </ol>
            </div>

            {/* Special Tiles */}
            <div className="bg-white/5 p-3 rounded-2xl border border-white/10 space-y-2">
              <h3 className="font-bold text-sm text-yellow-300">✨ אריחים מיוחדים:</h3>
              <ul className="space-y-1 text-white/90">
                <li>🔴 <strong className="text-orange-300">Push (דחיפה):</strong> דוחף אריח ממדף שכן לערמת ההשלכות שלו ומציב אריח דחיפה זמני שעל השכן להחליף בתורו.</li>
                <li>🔵 <strong className="text-blue-300">Switch (החלפה):</strong> החלפה מיידית בין אריח מהמדף שלך לבין אריח במדף יריב.</li>
                <li>💛 <strong className="text-yellow-300">Steal (גניבה):</strong> גניבת אריח ממדף יריב אל המדף שלך.</li>
                <li>⭐ <strong className="text-emerald-300">Sale (מבצע):</strong> ג'וקר המשמש ככל מוצר חסר (מותר לכל היותר אריח מבצע 1 למדף).</li>
              </ul>
            </div>

            {/* Win & AFK */}
            <div className="bg-white/5 p-3 rounded-2xl border border-white/10 space-y-1">
              <h3 className="font-bold text-sm text-yellow-300">🏆 ניצחון ומנגנון AFK:</h3>
              <p>
                המשחק מזהה אוטומטית כשהמדף שלך תואם למשימה! ניתן גם ללחוץ בכל עת על כפתור <strong>"סיימתי!"</strong>.
              </p>
              <p className="text-white/60">
                ⏱ שחקן שלא מבצע מהלך במשך 5 דקות או מתנתק — מנוע ה-AI יחליף אותו כבוט באופן אוטומטי.
              </p>
            </div>
          </div>

          {/* Footer */}
          <button
            onClick={onClose}
            className="w-full py-3 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-sm rounded-2xl shadow-lg transition-all mt-2"
          >
            הבנתי, סגור ויאללה לשחק! 🚀
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
