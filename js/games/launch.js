// Game launcher — lazy-loads each game module on first play (code-split by import())
import { GAMES } from './registry.js';
import { t } from '../i18n.js';
import { logPlay, getBest, submitScore, pushScore, getScores, toggleFav, isFav } from '../store.js';
import { el, toast, openModal, closeModal, createGameShell, vibrate } from '../ui.js';

const LOADERS = {
  snake: () => import('./snake.js'),
  g2048: () => import('./g2048.js'),
  sudoku: () => import('./sudoku.js'),
  tictactoe: () => import('./tictactoe.js'),
  minesweeper: () => import('./minesweeper.js'),
  memory: () => import('./memory.js'),
  wordsearch: () => import('./wordsearch.js'),
  brickbreaker: () => import('./brickbreaker.js'),
  runner: () => import('./runner.js'),
  space: () => import('./space.js'),
};

let activeCleanup = null;

export function renderGamePage(view, id) {
  const meta = GAMES.find((g) => g.id === id);
  if (!meta) return;
  if (activeCleanup) { try { activeCleanup(); } catch {} activeCleanup = null; }
  const started = Date.now();

  view.innerHTML = '';
  const favBtn = el('button', { class: 'btn small' }, (isFav(id) ? '★ ' : '☆ ') + t('favorites'));
  favBtn.addEventListener('click', () => {
    const on = toggleFav(id);
    favBtn.textContent = (on ? '★ ' : '☆ ') + t('favorites');
    toast(on ? '★ ' + t('favorites') : t('favorites'));
  });

  const head = el('div', { class: 'card', style: { marginBottom: '12px' } },
    el('div', { style: { display: 'flex', gap: '12px', alignItems: 'center' } },
      el('div', { class: 'r-ico', style: { fontSize: '34px', width: '56px', height: '56px' } }, meta.ico),
      el('div', { style: { flex: '1', minWidth: '0' } },
        el('div', { style: { fontWeight: '800', fontSize: '17px' } }, meta.name),
        el('div', { style: { fontSize: '12px', color: 'var(--text-dim)' } }, meta.sub))),
    el('div', { class: 'btn-row', style: { marginTop: '12px' } },
      favBtn,
      el('button', { class: 'btn small', onclick: () => showHow(meta) }, '❓ ' + t('how_to_play'))));

  const host = el('div', {});
  view.append(head, host);
  const shell = createGameShell(host);
  logPlay(id, 'game');
  showHow(meta, true);

  const api = {
    meta, t, el, toast, vibrate, shell,
    getBest: () => getBest(id),
    submit: (score, extra) => {
      const better = submitScore(id, score, extra);
      pushScore(id, score, extra);
      if (better) toast('🏆 ' + t('new_best') + ' (' + score + ')');
      return better;
    },
    recentScores: () => getScores(id),
  };

  LOADERS[id]().then((mod) => {
    if (!view.isConnected) return;
    activeCleanup = mod.mount(api) || null;
  }).catch((err) => {
    console.error('game load failed', err);
    host.innerHTML = '';
    host.appendChild(el('div', { class: 'state-box card' },
      el('div', { class: 's-ico' }, '⚠️'),
      el('p', {}, 'Game failed to load: ' + err.message)));
  });
}

export function stopActiveGame() {
  if (activeCleanup) { try { activeCleanup(); } catch {} activeCleanup = null; }
}

function showHow(meta, first = false) {
  const best = getBest(meta.id);
  openModal((sheet, close) => {
    sheet.append(
      el('h3', {}, meta.ico + ' ' + meta.name),
      el('p', { style: { fontSize: '13.5px', color: 'var(--text-dim)', lineHeight: '1.6' } }, meta.how),
      best ? el('div', { class: 'kv' }, el('span', {}, t('best')), el('b', {}, String(best.score))) : null,
      el('div', { class: 'btn-row', style: { marginTop: '12px' } },
        el('button', { class: 'btn primary', onclick: () => { close(); } }, '▶ ' + t('play')))
    );
  });
}
