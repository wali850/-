// GameBox main app — router, theme, dashboard, search, profile
import { initI18n, t, setLang, cycleLang, getLang, onChange } from './i18n.js';
import {
  profile, getFavs, getHistory, getStats, getAchievements, getPlayedIds,
  getBest, clearAll, toggleFav, isFav,
} from './store.js';
import { el, toast, openModal, closeModal } from './ui.js';
import { GAMES, CATS } from './games/registry.js';
import { renderGamePage, stopActiveGame } from './games/launch.js';
import { TOOLS } from './tools/registry.js';
import { renderToolPage, stopActiveTool } from './tools/launch.js';

const view = document.getElementById('view');
const title = document.getElementById('topbar-title');
const searchInput = document.getElementById('search');
const backBtn = document.getElementById('nav-back');

// ---------- theme ----------
function setTheme(theme, persist = true) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name=theme-color]').content = theme === 'light' ? '#eef1f9' : '#0b1020';
  const p = profile.get();
  p.theme = theme;
  if (persist) profile.set(p);
}
document.getElementById('btn-theme').addEventListener('click', () => {
  setTheme(document.documentElement.dataset.theme === 'light' ? 'dark' : 'light');
});
document.getElementById('btn-lang').addEventListener('click', cycleLang);

// ---------- connectivity indicator ----------
const netInd = el('div', { class: 'net-ind hidden' });
document.body.appendChild(netInd);
function netState() {
  const online = navigator.onLine;
  netInd.classList.toggle('off', !online);
  netInd.textContent = online ? '● ' + t('online') : '○ ' + t('offline');
  netInd.classList.remove('hidden');
  setTimeout(() => netInd.classList.add('hidden'), 2400);
}
window.addEventListener('online', netState);
window.addEventListener('offline', netState);

// ---------- router ----------
const routes = { home: renderHome, games: renderGames, tools: renderTools, profile: renderProfile };
let currentTab = 'home';
let lastRendered = null;

function navigate(hash, push = true) {
  stopActiveGame();
  stopActiveTool();
  closeModal();
  const [path, arg] = hash.replace(/^#\/?/, '').split('/');
  view.innerHTML = '';
  backBtn.classList.toggle('hidden', !arg);
  searchInput.value = '';
  if (path === 'game' && arg) {
    title.textContent = t('games');
    setActiveTab('games');
    renderGamePage(view, arg);
  } else if (path === 'tool' && arg) {
    title.textContent = t('tools');
    setActiveTab('tools');
    renderToolPage(view, arg);
  } else if (path === 'cat' && arg) {
    title.textContent = t('cat_' + arg) || arg;
    setActiveTab('games');
    renderGames(view, arg);
  } else if (path === 'fav') {
    title.textContent = t('all_favorites');
    setActiveTab('games');
    renderList(view, GAMES.filter((g) => getFavs().includes(g.id)), 'games', t('empty_favorites'), t('empty_favorites_sub'));
  } else if (routes[path]) {
    setActiveTab(path === 'home' || path === 'games' || path === 'tools' || path === 'profile' ? path : currentTab);
    title.textContent = path === 'home' ? t('app') : t('tab_' + path);
    routes[path](view);
  } else {
    title.textContent = t('app');
    renderHome(view);
  }
  if (push) location.hash = '#/' + hash.replace(/^#\/?/, '');
  lastRendered = '#/' + hash.replace(/^#\/?/, '');
  window.scrollTo(0, 0);
}
function setActiveTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab').forEach((tb) => tb.classList.toggle('active', tb.dataset.tab === tab));
}
document.querySelectorAll('.tab').forEach((tb) => tb.addEventListener('click', () => navigate(tb.dataset.tab)));
backBtn.addEventListener('click', () => history.back());
window.addEventListener('hashchange', () => {
  if (location.hash === lastRendered) return;
  navigate(location.hash || '#/home', false);
});
onChange(() => { // re-render static labels
  document.querySelectorAll('.tab').forEach((tb) => {
    const k = 'tab_' + tb.dataset.tab;
    tb.querySelector('span:last-child').textContent = t(k);
  });
  if (!location.hash.includes('game/') && !location.hash.includes('tool/')) navigate(location.hash || '#/home', false);
});

// ---------- search ----------
searchInput.addEventListener('input', () => {
  const q = searchInput.value.trim().toLowerCase();
  if (!q) { navigate(location.hash || '#/home', false); return; }
  const games = GAMES.filter((g) => (g.name + ' ' + g.sub + ' ' + g.cats.join(' ')).toLowerCase().includes(q));
  const tools = TOOLS.filter((x) => (x.name + ' ' + x.sub).toLowerCase().includes(q));
  view.innerHTML = '';
  if (!games.length && !tools.length) {
    view.appendChild(el('div', { class: 'state-box card' },
      el('div', { class: 's-ico' }, '🔍'), el('p', {}, t('no_results'), t('no_results_sub'))));
    return;
  }
  if (games.length) renderGridSection(view, t('games'), games.map((g) => gameTile(g)), null);
  if (tools.length) renderGridSection(view, t('tools'), tools.map((x) => toolTile(x)), null);
});

// ---------- dashboard ----------
function renderHome(v) {
  const stats = getStats();
  const favs = getFavs();
  const played = getPlayedIds();
  v.append(
    el('div', { class: 'hero' },
      el('h1', {}, '🎮 ' + t('app')),
      el('p', {}, t('tagline') + ' — ' + t('subtitle')),
      el('div', { class: 'hero-stats' },
        el('div', { class: 'hstat' }, el('b', {}, String(stats.plays)), t('plays')),
        el('div', { class: 'hstat' }, el('b', {}, String(played.length)), t('games')),
        el('div', { class: 'hstat' }, el('b', {}, String(favs.length)), t('favorites')))),

    el('div', { class: 'section-title' }, '⭐ ' + t('favorites'),
      el('button', { class: 'more', onclick: () => navigate('fav') }, t('all_favorites') + ' ›')),
    favs.length ? el('div', { class: 'grid' }, favs.slice(0, 8).map((id) => gameTile(GAMES.find((g) => g.id === id) || TOOLS.find((x) => x.id === id)))) : emptyBox('⭐', t('empty_favorites'), t('empty_favorites_sub')),

    el('div', { class: 'section-title' }, '🕒 ' + t('recently_played')),
    played.length ? el('div', { class: 'row-list' }, played.slice(0, 4).map((id) => {
      const g = GAMES.find((x) => x.id === id);
      if (!g) return null;
      const best = getBest(id);
      return el('button', { class: 'row-item', onclick: () => navigate('game/' + id) },
        el('div', { class: 'r-ico' }, g.ico),
        el('div', { class: 'r-main' }, el('div', { class: 'r-name' }, g.name), el('div', { class: 'r-sub' }, g.sub)),
        best ? el('div', { class: 'r-meta' }, t('best') + ': ' + best.score) : null);
    }).filter(Boolean)) : emptyBox('🕒', t('empty_recent'), t('empty_recent_sub')),

    el('div', { class: 'section-title' }, '📂 ' + t('categories'),
      el('button', { class: 'more', onclick: () => navigate('games') }, t('all_games') + ' ›')),
    el('div', { class: 'grid' }, CATS.slice(1, 9).map((c) =>
      el('button', { class: 'tile cat-tile', onclick: () => navigate('cat/' + c) },
        el('div', { class: 't-ico' }, catIcon(c)),
        el('div', { class: 't-name' }, t('cat_' + c)),
        el('div', { class: 't-cat' }, GAMES.filter((g) => g.cats.includes(c)).length + ' ' + t('games'))))),

    el('div', { class: 'section-title' }, '🧰 ' + t('quick_tools')),
    el('div', { class: 'grid' }, ['stopwatch', 'timer', 'dice', 'calculator', 'notes', 'password'].map((id) => toolTile(TOOLS.find((x) => x.id === id))))
  );
}
function catIcon(c) {
  return { arcade: '🕹️', puzzle: '🧩', brain: '🧠', strategy: '♟️', adventure: '🗺️', platform: '🏃', board: '🎯', educational: '📚', casual: '✨', multiplayer: '👥', offline: '📴', sports: '⚽', racing: '🏎️', card: '🃏' }[c] || '🎮';
}
function emptyBox(ico, msg, sub) {
  return el('div', { class: 'state-box card' }, el('div', { class: 's-ico' }, ico), el('p', {}, msg, sub ? ' — ' + sub : ''));
}

// ---------- games / tools lists ----------
function renderGames(v, cat = 'all') {
  const chips = el('div', { class: 'chips' });
  CATS.forEach((c) => {
    const chip = el('button', { class: 'chip' + (c === cat ? ' active' : '') }, t('cat_' + c));
    chip.addEventListener('click', () => navigate('cat/' + c));
    chips.appendChild(chip);
  });
  let games = cat === 'all' ? GAMES : GAMES.filter((g) => g.cats.includes(cat));
  v.append(chips);
  const gridWrap = el('div', {});
  v.appendChild(gridWrap);
  drawList(gridWrap, games, t('empty_favorites_sub'));
  function drawList(wrap, list) {
    wrap.innerHTML = '';
    if (!list.length) {
      wrap.appendChild(emptyBox('🎮', t('coming_soon'), t('no_results_sub')));
      return;
    }
    renderGridSection(wrap, null, list.map(gameTile), null);
  }
}
function renderTools(v) {
  const mkSection = (label, grp) => {
    const list = TOOLS.filter((x) => x.grp === grp);
    const grid = el('div', { class: 'grid' });
    list.forEach((x) => grid.appendChild(toolTile(x)));
    return [el('div', { class: 'section-title' }, label), grid];
  };
  v.append(...mkSection('🎮 ' + t('gaming_tools'), 'gaming'), ...mkSection('🧰 ' + t('everyday_tools'), 'daily'));
}
function renderList(v, list, kind, emptyMsg, emptySub) {
  if (!list.length) { v.appendChild(emptyBox('⭐', emptyMsg, emptySub)); return; }
  const grid = el('div', { class: 'grid' });
  list.forEach((g) => grid.appendChild(kind === 'games' ? gameTile(g) : toolTile(g)));
  v.appendChild(grid);
}
function gameTile(g) {
  if (!g) return null;
  const fav = isFav(g.id);
  const star = el('button', { class: 'fav-star' }, fav ? '★' : '☆');
  star.addEventListener('click', (e) => {
    e.stopPropagation();
    const on = toggleFav(g.id);
    star.textContent = on ? '★' : '☆';
    toast(on ? '★ ' + t('favorites') : '☆');
  });
  const net = navigator.onLine;
  return el('div', { class: 'tile', onclick: () => navigate('game/' + g.id) },
    star,
    el('div', { class: 't-ico' }, g.ico),
    el('div', { class: 't-name' }, g.name),
    el('div', { class: 't-cat' }, g.cats.map((c) => t('cat_' + c)).join(', ')));
}
function toolTile(x) {
  if (!x) return null;
  const tile = el('div', { class: 'tile', onclick: () => navigate('tool/' + x.id) },
    el('div', { class: 't-ico' }, x.ico),
    el('div', { class: 't-name' }, x.name),
    el('div', { class: 't-cat' }, x.sub));
  if (x.perm) tile.appendChild(el('span', { class: 'badge perm', style: { position: 'absolute', top: '6px', insetInlineEnd: '6px', fontSize: '9px', padding: '2px 6px' } }, '📷'));
  return tile;
}
function renderGridSection(v, label, tiles) {
  if (label) v.appendChild(el('div', { class: 'section-title' }, label));
  const grid = el('div', { class: 'grid' });
  tiles.filter(Boolean).forEach((x) => grid.appendChild(x));
  v.appendChild(grid);
}

// ---------- profile ----------
function renderProfile(v) {
  const p = profile.get();
  const stats = getStats();
  const achs = getAchievements();
  const earned = achs.filter((a) => a.earned).length;
  const nameIn = el('input', { value: p.name || '', placeholder: t('player_name'), style: { flex: '1', padding: '11px 14px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card)' } });

  const v2 = el('div', {},
    el('div', { class: 'card' },
      el('div', { style: { display: 'flex', gap: '12px', alignItems: 'center' } },
        el('div', { class: 'r-ico', style: { fontSize: '28px', width: '54px', height: '54px' } }, '👤'),
        el('div', { style: { flex: '1' } },
          el('div', { style: { fontWeight: '800', fontSize: '16px' } }, p.name || t('player_name')),
          el('div', { style: { fontSize: '11.5px', color: 'var(--text-dim)' } }, t('days_visited') + ': ' + Math.max(1, Math.ceil((Date.now() - stats.firstDay) / 86400000)))),
        el('span', { class: 'badge' }, getLang().toUpperCase())),
      el('div', { style: { display: 'flex', gap: '8px', marginTop: '12px' } },
        nameIn,
        el('button', { class: 'btn small primary', onclick: () => {
          const pp = profile.get();
          pp.name = nameIn.value.trim();
          profile.set(pp);
          toast('✅ ' + t('profile_saved'));
        } }, t('save')))),

    el('div', { class: 'section-title' }, '📊 ' + t('your_stats')),
    el('div', { class: 'stat-grid' },
      statBox(stats.plays, t('total_plays')), statBox(Math.round(stats.minutes), t('playtime')),
      statBox(playedCount(), t('games_played')), statBox(getFavs().length, t('fav_count')),
      statBox(earned + '/' + achs.length, t('achievements'))),

    el('div', { class: 'section-title' }, '🏆 ' + t('achievements') + ' (' + earned + '/' + achs.length + ')'),
    el('div', { class: 'row-list' }, achs.map((a) =>
      el('div', { class: 'ach' + (a.earned ? ' earned' : '') },
        el('div', { class: 'a-ico' }, a.earned ? a.ico : '🔒'),
        el('div', { class: 'r-main' },
          el('div', { class: 'r-name', style: { fontSize: '13px' } }, t(a.key)),
          el('div', { class: 'r-sub' }, a.earned ? '✓ ' + t('unlocked') : t('locked')))))),

    el('div', { class: 'section-title' }, '📈 ' + t('high_scores')),
    bestScores(),

    el('div', { class: 'section-title' }, '🕘 ' + t('game_history')),
    historyList(),

    el('div', { class: 'section-title' }, '⚙️ ' + t('settings')),
    el('div', { class: 'card' },
      el('div', { class: 'kv' }, el('span', {}, t('language')), langPicker()),
      el('div', { class: 'kv' }, el('span', {}, t('theme')), themePicker()),
      el('div', { style: { marginTop: '12px' } },
        el('button', { class: 'btn danger small', onclick: () => {
          openModal((sheet, close) => {
            sheet.append(
              el('h3', {}, '⚠️ ' + t('clear_data')),
              el('p', { style: { fontSize: '13px', color: 'var(--text-dim)' } }, t('clear_confirm')),
              el('div', { class: 'btn-row' },
                el('button', { class: 'btn small', onclick: close }, t('cancel')),
                el('button', { class: 'btn danger small', onclick: () => { clearAll(); close(); location.hash = ''; location.reload(); } }, t('confirm'))));
          });
        } }, '🗑 ' + t('clear_data')))),
    el('p', { style: { fontSize: '11px', color: 'var(--text-dim)', textAlign: 'center', marginTop: '14px', lineHeight: '1.6' } }, t('install_hint'))
  );
  v.appendChild(v2);
}
function statBox(v, label) {
  return el('div', { class: 'card stat-box' }, el('b', {}, String(v)), el('span', {}, label));
}
function playedCount() {
  return new Set(getHistory().map((h) => h.id)).size;
}
function bestScores() {
  const bests = Object.keys(localStorage).filter((k) => k.startsWith('gb.best.')).map((k) => {
    const id = k.slice('gb.best.'.length);
    const g = GAMES.find((x) => x.id === id);
    return g ? { g, ...getBest(id) } : null;
  }).filter(Boolean).sort((a, b) => b.at - a.at);
  if (!bests.length) return el('div', { class: 'state-box card' }, el('p', {}, t('no_scores')));
  return el('div', { class: 'card' }, bests.map((b) =>
    el('div', { class: 'score-row' }, b.g.ico + ' ' + b.g.name, el('b', {}, String(b.score)))));
}
function historyList() {
  const hist = getHistory();
  if (!hist.length) return el('div', { class: 'state-box card' }, el('p', {}, t('no_history')));
  return el('div', { class: 'card' }, hist.slice(0, 10).map((h) => {
    const g = GAMES.find((x) => x.id === h.id) || TOOLS.find((x) => x.id === h.id);
    return el('div', { class: 'score-row' }, (g?.ico || '•') + ' ' + (g?.name || h.id), new Date(h.at).toLocaleDateString());
  }));
}
function langPicker() {
  const sel = el('select', { style: { padding: '6px 10px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--card)' } });
  [['en', 'English'], ['ps', 'پښتو'], ['fa', 'دری']].forEach(([v, label]) => {
    const o = el('option', { value: v }, label);
    if (v === getLang()) o.selected = true;
    sel.appendChild(o);
  });
  sel.addEventListener('change', () => setLang(sel.value));
  return sel;
}
function themePicker() {
  const wrap = el('div', { style: { display: 'flex', gap: '6px' } });
  [['dark', t('dark')], ['light', t('light')]].forEach(([v, label]) => {
    const b = el('button', { class: 'chip' + (document.documentElement.dataset.theme === v ? ' active' : '') }, label);
    b.addEventListener('click', () => { setTheme(v); wrap.querySelectorAll('.chip').forEach((c) => c.classList.remove('active')); b.classList.add('active'); });
    wrap.appendChild(b);
  });
  return wrap;
}

// ---------- boot ----------
initI18n(localStorage.getItem('gb.lang')?.replace(/"/g, '') || 'en');
setTheme(profile.get().theme || 'dark', false);
document.querySelectorAll('.tab').forEach((tb) => tb.querySelector('span:last-child').textContent = t('tab_' + tb.dataset.tab));
if (!location.hash) history.replaceState(null, '', '#/home');
navigate(location.hash || '#/home', false);
