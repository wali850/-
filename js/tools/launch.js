// Tool launcher — lazy-loads tool modules, wraps them in a game shell
import { TOOLS } from './registry.js';
import { t } from '../i18n.js';
import { el, toast, createGameShell, vibrate } from '../ui.js';

const LOADERS = {
  stopwatch: () => import('./games-tools.js').then((m) => m.mountStopwatch),
  timer: () => import('./games-tools.js').then((m) => m.mountTimer),
  scoretracker: () => import('./games-tools.js').then((m) => m.mountScoreTracker),
  rng: () => import('./games-tools.js').then((m) => m.mountRng),
  teams: () => import('./games-tools.js').then((m) => m.mountTeams),
  dice: () => import('./games-tools.js').then((m) => m.mountDice),
  coin: () => import('./games-tools.js').then((m) => m.mountCoin),
  reaction: () => import('./games-tools.js').then((m) => m.mountReaction),
  focus: () => import('./games-tools.js').then((m) => m.mountFocus),
  calculator: () => import('./daily-tools.js').then((m) => m.mountCalculator),
  converter: () => import('./daily-tools.js').then((m) => m.mountConverter),
  notes: () => import('./daily-tools.js').then((m) => m.mountNotes),
  qrgen: () => import('./daily-tools.js').then((m) => m.mountQrGen),
  qrscan: () => import('./daily-tools.js').then((m) => m.mountQrScan),
  password: () => import('./daily-tools.js').then((m) => m.mountPassword),
  calendar: () => import('./daily-tools.js').then((m) => m.mountCalendar),
  worldclock: () => import('./daily-tools.js').then((m) => m.mountWorldClock),
  viewer: () => import('./daily-tools.js').then((m) => m.mountViewer),
};

let activeCleanup = null;

export function renderToolPage(view, id) {
  const meta = TOOLS.find((x) => x.id === id);
  if (!meta) return;
  if (activeCleanup) { try { activeCleanup(); } catch {} activeCleanup = null; }

  view.innerHTML = '';
  const head = el('div', { class: 'card', style: { marginBottom: '12px' } },
    el('div', { style: { display: 'flex', gap: '12px', alignItems: 'center' } },
      el('div', { class: 'r-ico', style: { fontSize: '34px', width: '56px', height: '56px' } }, meta.ico),
      el('div', { style: { flex: '1', minWidth: '0' } },
        el('div', { style: { fontWeight: '800', fontSize: '17px' } }, meta.name),
        el('div', { style: { fontSize: '12px', color: 'var(--text-dim)' } }, meta.sub)),
      meta.perm ? el('span', { class: 'badge perm' }, '📷 ' + t('needs_perm')) : null));
  const host = el('div', {});
  view.append(head, host);

  const shell = createGameShell(host, { pad: false });
  shell.stage.style.minHeight = '260px';

  LOADERS[id]().then((mount) => {
    if (!view.isConnected) return;
    activeCleanup = mount({
      meta, t, el, toast, vibrate, shell,
      submit: () => {},
      getBest: () => null,
    });
  }).catch((err) => {
    console.error('tool load failed', err);
    host.innerHTML = '';
    host.appendChild(el('div', { class: 'state-box card' },
      el('div', { class: 's-ico' }, '⚠️'),
      el('p', {}, 'Tool failed to load: ' + err.message)));
  });
}

export function stopActiveTool() {
  if (activeCleanup) { try { activeCleanup(); } catch {} activeCleanup = null; }
}
