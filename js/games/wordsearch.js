// Word Search — drag to select hidden words
import { shuffle } from '../ui.js';
export function mount(api) {
  const { el, t, shell } = api;
  const WORDS = ['GAME', 'PLAY', 'SNAKE', 'PUZZLE', 'SCORE', 'LEVEL', 'WIN', 'BONUS', 'QUEST', 'HERO', 'LOGIC', 'TILE'];
  let size = 'easy', N, grid, placed, found, selPath, dragging, statFound;

  function start() {
    N = size === 'easy' ? 8 : size === 'medium' ? 10 : 12;
    const wordCount = size === 'easy' ? 5 : size === 'medium' ? 7 : 9;
    const words = shuffle(WORDS).slice(0, wordCount);
    grid = Array.from({ length: N }, () => Array(N).fill(''));
    placed = [];
    for (const w of words) if (!placeWord(w)) { /* retry whole grid */ return start(); }
    // fill remaining with random letters
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      if (!grid[r][c]) grid[r][c] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
    }
    found = new Set(); selPath = [];
    shell.hud.innerHTML = ''; shell.pad.innerHTML = ''; shell.closeOverlay();
    statFound = shell.addStat('found', '0/' + words.length);
    shell.addSpacer();
    shell.addButton(t('restart'), '↻', () => start());
    const dBtn = shell.addButton('⚙ ' + t(size), '', () => {
      size = size === 'easy' ? 'medium' : size === 'medium' ? 'hard' : 'easy';
      start();
    });
    renderList(words);
    render();
  }
  function placeWord(w) {
    for (let tries = 0; tries < 200; tries++) {
      const horiz = Math.random() < .45;
      const vert = !horiz && Math.random() < .6;
      const diag = !horiz && !vert;
      const len = w.length;
      const r0 = rint(N - (vert || diag ? len : 1) + (vert || diag ? 0 : 1));
      const c0 = rint(N - (horiz || diag ? len : 1) + (horiz || diag ? 0 : 1));
      const path = [];
      let fits = true;
      for (let k = 0; k < len; k++) {
        const r = vert || diag ? r0 + k : r0;
        const c = horiz || diag ? c0 + k : c0;
        if (r >= N || c >= N) { fits = false; break; }
        if (grid[r][c] && grid[r][c] !== w[k]) { fits = false; break; }
        path.push([r, c]);
      }
      if (!fits) continue;
      path.forEach(([r, c], k) => { grid[r][c] = w[k]; });
      placed.push({ word: w, path });
      return true;
    }
    return false;
  }
  let listEl = null;
  function renderList(words) {
    listEl?.remove();
    const box = el('div', { class: 'card', style: { marginTop: '10px' } });
    const chips = el('div', { class: 'chips' });
    words.forEach((w) => chips.appendChild(el('span', { class: 'chip', id: 'ws-' + w }, w)));
    box.appendChild(chips);
    shell.shell.appendChild(box);
    listEl = box;
  }
  function render() {
    shell.stage.innerHTML = '';
    const board = el('div', {
      class: 'mem-grid', style: { gridTemplateColumns: `repeat(${N}, 1fr)`, gap: '4px', width: 'min(100%, 400px)' },
    });
    const cells = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const cell = el('button', {
        class: 'ms-cell', style: { aspectRatio: '1', fontSize: 'clamp(10px,3vw,15px)', borderRadius: '8px' },
      }, grid[r][c]);
      cell.dataset.rc = r + ',' + c;
      cells.push(cell);
      board.appendChild(cell);
    }
    shell.stage.appendChild(board);

    const startPt = (e) => {
      const t = e.touches ? e.touches[0] : e;
      const cell = document.elementFromPoint(t.clientX, t.clientY)?.dataset.rc;
      if (cell) { dragging = true; selPath = [cell.split(',').map(Number)]; paint(); }
    };
    const movePt = (e) => {
      if (!dragging) return;
      const t2 = e.touches ? e.touches[0] : e;
      const cell = document.elementFromPoint(t2.clientX, t2.clientY)?.dataset.rc;
      if (!cell) return;
      const [r, c] = cell.split(',').map(Number);
      const last = selPath[selPath.length - 1];
      if (!last) return;
      if ((Math.abs(last[0] - r) > 1 || Math.abs(last[1] - c) > 1)) {
        // allow snapping along straight lines only
        const first = selPath[0];
        const dr = r - first[0], dc = c - first[1];
        if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return;
        selPath = linePath(first, [r, c]);
      } else if (!selPath.some(([pr, pc]) => pr === r && pc === c)) {
        selPath.push([r, c]);
      }
      paint();
    };
    const endPt = () => {
      if (!dragging) return;
      dragging = false;
      const str = selPath.map(([r, c]) => grid[r][c]).join('');
      const rev = [...str].reverse().join('');
      const hit = placed.find((p) => !found.has(p.word) && (p.word === str || p.word === rev));
      if (hit) {
        found.add(hit.word);
        document.getElementById('ws-' + hit.word)?.classList.add('active');
        statFound.set(found.size + '/' + placed.length);
        api.vibrate?.(30);
        if (found.size === placed.length) {
          api.submit(Math.max(1, 1000 - placed.length * 10));
          shell.overlay('🎉 ' + t('you_win'), '', [['↻ ' + t('restart'), () => start()]]);
          return;
        }
      }
      selPath = [];
      paint();
    };
    board.addEventListener('touchstart', startPt, { passive: true });
    board.addEventListener('touchmove', movePt, { passive: true });
    board.addEventListener('touchend', endPt);
    board.addEventListener('mousedown', startPt);
    board.addEventListener('mousemove', movePt);
    window.addEventListener('mouseup', endPt);
  }
  function linePath([r0, c0], [r1, c1]) {
    const len = Math.max(Math.abs(r1 - r0), Math.abs(c1 - c0));
    const dr = Math.sign(r1 - r0), dc = Math.sign(c1 - c0);
    const out = [];
    for (let k = 0; k <= len; k++) out.push([r0 + dr * k, c0 + dc * k]);
    return out;
  }
  function paint() {
    shell.stage.querySelectorAll('.ms-cell').forEach((cellEl) => {
      const [r, c] = cellEl.dataset.rc.split(',').map(Number);
      const inSel = selPath.some(([pr, pc]) => pr === r && pc === c);
      cellEl.style.background = inSel ? 'var(--accent)' : '';
      cellEl.style.color = inSel ? '#fff' : '';
    });
  }

  start();
  return () => {};
}
function rint(n) { return Math.max(0, Math.floor(Math.random() * n)); }
