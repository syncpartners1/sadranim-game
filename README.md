# 🛒 סידור המדפים — Shelf Sorting Game

אפליקציית משחק לוח/קלפים מלאה בדפדפן, **Progressive Web App (PWA)** ו-**Telegram Mini App (TMA)** המבוססת על משחק "סידור המדפים". המשחק משלב אסטרטגיה, סידור מוצרים בסופרמרקט ופעולות מיוחדות נגד שחקנים יריבים.

![Live App Banner](public/assets/cards/jambo%20front.png)

## 🌐 הקישור למשחק החי
👉 **[https://sadranim-game.web.app](https://sadranim-game.web.app)**

---

## 🎯 חוקי המשחק והלוגיקה

### רכיבי המשחק:
- **80+ אריחים (Tiles):**
  - **8 סוגי מוצרים:** טונה (`tuna`), דוריטוס (`doritos`), פרינגלס (`pringles`), צ'יפס (`chips`), מרק (`soup`), מיץ תפוזים (`orangejuice`), שימורים (`cans`), קטשופ (`ketchup`).
  - **4 אריחים מיוחדים (Action Tiles & Wildcard):**
    - 🔴 **Push (דחיפה):** דוחף אריח ממדף שחקן שכן לערמת ההשלכה שלו ומציב אריח דחיפה זמני. בתור הבא הנפגע חייב להחליף אותו.
    - 🔵 **Switch (החלפה):** החלפה מיידית של אריח מדף עם אריח ממדף יריב.
    - 💛 **Steal (גניבה):** גניבת אריח ממדף של שחקן אחר למדף שלך.
    - ⭐ **Sale (מבצע):** ג'וקר המשמש ככל מוצר חסר (עד 1 מותר למדף).
- **18 כרטיסי משימה סודיים (`P1` - `P18`):** תבנית סידור בת 8 משבצות.
- **כרטיס מדף (Jambo Front):** גריד של 4 שורות × 2 עמודות (8 משבצות).

### מהלך התור:
1. **שליפת אריח:** מקופת המשחק המרכזית או מהאריח העליון בהשלכות של השחקן שמימין.
2. **ריקון קופה:** כאשר הקופה המרכזית מסתיימת, כל ערמות ההשלכה נגרסות ונערבות מחדש לקופה.
3. **שינוי מיקום במדף (Drag & Drop):** ניתן לגרור אריחים או ללחוץ על שני אריחים במדף שלך כדי להחליף מיקומים באופן חופשי.
4. **תנאי ניצחון:** השחקן הראשון שמסדר את 8 המשבצות במדף בהתאמה מדויקת לקלף המשימה מנצח בסבב. המשחק כולו מסתיים לאחר סיום 18 כרטיסי המשימה.

---

## 📱 Telegram Mini App Integration

המשחק מותאם באופן מלא ל-**Telegram Mini Apps**:
- **Full Screen:** נפתח במסך מלא בסלולרי.
- **Haptics:** רטט בלחיצות, החלפות וניצחונות (`@telegram-apps/sdk`).
- **Theme Awareness:** התאמה לצבעי הנושא של טלגרם.

### 🤖 חיבור ל-Telegram Bot:
1. פתח בטלגרם את `@BotFather`.
2. שלח `/newapp` ובחר את הבוט שלך.
3. הגדר את ה-Web App URL ל:
   ```
   https://sadranim-game.web.app
   ```

---

## 🛠️ טכנולוגיות

- **Frontend:** React 18 + Vite 5 + TypeScript (Strict Mode)
- **Styling:** TailwindCSS v3 + Custom Design System
- **Animations:** Framer Motion
- **State Management:** Zustand
- **PWA:** Vite PWA Plugin + Workbox Offline Cache
- **Hosting & Cloud:** GCP Firebase Hosting (`sadranim-game`)
- **CI/CD:** GitHub Actions (`.github/workflows/deploy.yml`)

---

## 🚀 פיתוח מקומי (Local Setup)

```bash
# להתקנת התלויות
npm install

# להרצת שרת פיתוח מקומי
npm run dev

# לבניית גרסת Production
npm run build
```

---

## 🔄 פריסה אוטומטית (Automated CI/CD Deployment)

בכל Push לענף `master` או `main` ב-GitHub, ה-GitHub Action בונים את האפליקציה ומעדכנים אותה ב-**Firebase Hosting**:

```bash
git add .
git commit -m "Update game features"
git push origin master
```
