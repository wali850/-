# GameBox — Ultimate Games & Tools

A mobile-first gaming dashboard PWA: **10 fully playable offline games**, **18 working tools**, player profile with scores, history and achievements, dark/light themes, and full **Pashto / Dari / English** support with right-to-left layouts.

## Run

```bash
npm start          # zero-dependency static server → http://localhost:8080
```

Open on a phone or in DevTools mobile view. Install as an app via the browser menu → “Add to Home screen” (PWA, works fully offline after first visit).

## Games (all playable — scoring, pause, restart, game-over)

| Game | Category | Controls |
|---|---|---|
| 🐍 Snake | Arcade | Swipe / D-pad / arrows |
| 🔢 2048 | Puzzle | Swipe / arrows |
| 🧩 Sudoku | Puzzle, Brain | Tap cell + number pad (unique-solution generator) |
| ⭕ Tic-Tac-Toe | Board, Multiplayer | vs AI (3 levels) or 2-player |
| 💣 Minesweeper | Puzzle, Strategy | Tap open, long-press flag |
| 🧠 Memory Match | Brain, Casual | Tap cards |
| 🔤 Word Search | Educational | Drag across letters |
| 🧱 Brick Breaker | Arcade | Drag paddle / buttons |
| 🏃 Endless Runner | Platform, Arcade | Tap to jump |
| 🚀 Space Adventure | Adventure, Arcade | Drag ship, auto-fire |

Racing, Sports, and Card categories are **honest empty states** ("Coming soon") — no fake games. The framework (`js/games/registry.js` + shell in `js/ui.js`) is built so each new game is one module + one registry line + one loader entry.

## Tools

**Gaming:** stopwatch, countdown timer, score tracker, random number, team generator, dice, coin flip, reaction test, focus timer.
**Everyday:** calculator (standard + scientific), unit converter, notes & to-do, QR generator (offline), QR scanner (camera permission, Android 10+ BarcodeDetector), password generator, calendar, world clock, file viewer (images/PDF, local only).

Tools that need internet or permissions are labeled with badges — nothing is hidden.

## Profile

Local profile, favorites, high scores per game, game history, playtime stats, 6 achievements, data export/clear — all stored locally (`localStorage`). No fake statistics; only your real usage is shown.

## Android APK

See **docs/android.md** — Capacitor is wired up (`capacitor.config.json`, `npm run android:*`). The APK itself must be built on a machine with the Android SDK; this is documented honestly there.

## Structure

```
index.html            app shell (topbar, tabs, search)
css/app.css           glassmorphism theme, dark/light, RTL
js/i18n.js            en / ps / fa translations
js/store.js           localStorage profile, scores, history, achievements
js/ui.js              DOM helpers + game shell framework
js/app.js             router, dashboard, search, profile
js/games/*            one module per game + registry + lazy launcher
js/tools/*            same pattern for tools
sw.js                 offline cache (whole app, including games)
```
