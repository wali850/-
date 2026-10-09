// GameBox storage — safe localStorage wrapper + profile/scores/history/favorites
const PREFIX = 'gb.';

export function load(key, fallback = null) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch { return fallback; }
}
export function save(key, value) {
  try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch {}
}
export function remove(key) {
  try { localStorage.removeItem(PREFIX + key); } catch {}
}
export function clearAll() {
  try {
    Object.keys(localStorage).filter((k) => k.startsWith(PREFIX)).forEach((k) => localStorage.removeItem(k));
  } catch {}
}

// ---------- Profile ----------
export const profile = {
  get: () => load('profile', { name: '', theme: 'dark', created: Date.now() }),
  set(p) { save('profile', p); },
};

// ---------- Favorites ----------
export function getFavs() { return load('favs', []); }
export function isFav(id) { return getFavs().includes(id); }
export function toggleFav(id) {
  const favs = getFavs();
  const i = favs.indexOf(id);
  if (i >= 0) favs.splice(i, 1); else favs.push(id);
  save('favs', favs);
  return i < 0;
}

// ---------- Scores ----------
export function getBest(gameId) { return load('best.' + gameId, null); }
export function submitScore(gameId, score, meta = {}) {
  const prev = getBest(gameId);
  const lowerBetter = meta.lowerBetter === true;
  const better = prev == null || (lowerBetter ? score < prev.score : score > prev.score);
  if (better) {
    save('best.' + gameId, { score, at: Date.now(), ...meta });
  }
  return better;
}
export function getScores(gameId, n = 5) {
  return load('scores.' + gameId, []).slice(0, n);
}
export function pushScore(gameId, score, meta = {}) {
  const list = load('scores.' + gameId, []);
  list.unshift({ score, at: Date.now(), ...meta });
  save('scores.' + gameId, list.slice(0, 20));
}

// ---------- History / playtime ----------
export function logPlay(id, type, minutes = 0) {
  const hist = load('history', []);
  const now = Date.now();
  const last = hist[0];
  if (last && last.id === id && now - last.at < 90 * 1000) last.at = now;
  else hist.unshift({ id, type, at: now });
  save('history', hist.slice(0, 60));
  bumpStat('plays', 1);
  if (minutes > 0) bumpStat('minutes', minutes);
}
export function getHistory() { return load('history', []); }

// ---------- Stats & achievements ----------
export function getStats() {
  return load('stats', { plays: 0, minutes: 0, firstDay: Date.now() });
}
export function bumpStat(key, delta) {
  const s = getStats();
  s[key] = (s[key] || 0) + delta;
  save('stats', s);
}
export function getPlayedIds() {
  return [...new Set(getHistory().map((h) => h.id))];
}

const ACH_DEFS = [
  { id: 'first_play', key: 'ach_first_play', ico: '🎬', test: (c) => c.plays >= 1 },
  { id: 'explorer', key: 'ach_explorer', ico: '🧭', test: (c) => c.playedGames >= 5 },
  { id: 'favorite', key: 'ach_favorite', ico: '⭐', test: (c) => c.favs >= 1 },
  { id: 'snake10', key: 'ach_snake10', ico: '🐍', test: (c) => (c.best.snake?.score ?? 0) >= 10 },
  { id: 't2048', key: 'ach_2048_256', ico: '🔢', test: (c) => (c.best.g2048?.score ?? 0) >= 256 },
  { id: 'night', key: 'ach_night', ico: '🌙', test: (c) => c.usedDark },
];
export function getAchievements() {
  const s = getStats();
  const cond = {
    plays: s.plays,
    playedGames: getPlayedIds().length,
    favs: getFavs().length,
    best: Object.fromEntries(
      Object.keys(localStorage).filter((k) => k.startsWith(PREFIX + 'best.'))
        .map((k) => [k.slice((PREFIX + 'best.').length), load(k.slice(PREFIX.length))])
    ),
    usedDark: profile.get().theme === 'dark',
  };
  const earned = load('ach', []);
  ACH_DEFS.forEach((a) => { if (!earned.includes(a.id) && a.test(cond)) earned.push(a.id); });
  save('ach', earned);
  return ACH_DEFS.map((a) => ({ ...a, earned: earned.includes(a.id) }));
}

export function exportAll() {
  const data = {};
  try {
    Object.keys(localStorage).filter((k) => k.startsWith(PREFIX))
      .forEach((k) => { data[k] = localStorage.getItem(k); });
  } catch {}
  return data;
}
