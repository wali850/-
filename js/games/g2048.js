// 2048 — swipe to merge tiles
export function mount(api) {
  const { el, t, vibrate, shell } = api;
  const statScore = shell.addStat('score', t('score'));
  const statBest = shell.addStat('best', t('best'));
  shell.addSpacer();
  shell.addButton(t('restart'), '↻', () => reset(true));
  statBest.set(api.getBest()?.score ?? 0);

  const N = 4;
  const board = el('div', { class: 'g2048-board', style: { gridTemplateColumns: `repeat(${N}, 1fr)` } });
  shell.stage.appendChild(board);
  const cells = [];
  for (let i = 0; i < N * N; i++) {
    const c = el('div', { class: 'g2048-cell' });
    cells.push(c);
    board.appendChild(c);
  }

  let grid, score, won, over, started;
  const COLORS = { 2: '#eee4da', 4: '#ede0c8', 8: '#f2b179', 16: '#f59563', 32: '#f67c5f', 64: '#f65e3b', 128: '#edcf72', 256: '#edcc61', 512: '#edc850', 1024: '#edc53f', 2048: '#edc22e' };

  function reset(autoplay = false) {
    grid = Array.from({ length: N }, () => Array(N).fill(0));
    score = 0; won = false; over = false; started = autoplay;
    statScore.set(0);
    spawn(); spawn();
    shell.closeOverlay();
    render();
    if (!autoplay) shell.overlay('🔢 2048', api.meta.how, [['▶ ' + t('start'), () => { started = true; shell.closeOverlay(); }]], { dismissible: false });
  }
  function spawn() {
    const empty = [];
    grid.forEach((row, r) => row.forEach((v, c) => { if (!v) empty.push([r, c]); }));
    if (!empty.length) return;
    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    grid[r][c] = Math.random() < .9 ? 2 : 4;
  }
  const slide = (row) => {
    const vals = row.filter((v) => v);
    const out = [];
    for (let i = 0; i < vals.length; i++) {
      if (vals[i] === vals[i + 1]) { out.push(vals[i] * 2); score += vals[i] * 2; i++; }
      else out.push(vals[i]);
    }
    while (out.length < N) out.push(0);
    return out;
  };
  function move(dx, dy) {
    if (!started || over) return;
    const before = JSON.stringify(grid);
    if (dx) grid = grid.map((row) => dx > 0 ? slide([...row].reverse()).reverse() : slide(row));
    if (dy) {
      for (let c = 0; c < N; c++) {
        const col = grid.map((row) => row[c]);
        const moved = dy > 0 ? slide([...col].reverse()).reverse() : slide(col);
        moved.forEach((v, r) => { grid[r][c] = v; });
      }
    }
    if (JSON.stringify(grid) === before) return;
    vibrate(12);
    spawn(); render();
    if (score > 0) statScore.set(score);
    checkEnd();
  }
  function checkEnd() {
    const max = Math.max(...grid.flat());
    if (max >= 2048 && !won) {
      won = true;
      api.submit(score);
      shell.overlay('🎉 ' + t('you_win'), t('score') + ': ' + score,
        [['▶ ' + t('resume'), () => shell.closeOverlay()], ['↻ ' + t('restart'), () => reset(true)]]);
      return;
    }
    if (score) statScore.set(score);
    const canMove = grid.some((row, r) => row.some((v, c) =>
      !v || (c < N - 1 && v === grid[r][c + 1]) || (r < N - 1 && v === grid[r + 1][c])));
    if (!canMove) {
      over = true;
      api.submit(score);
      shell.overlay(t('game_over'), t('score') + ': ' + score, [['↻ ' + t('restart'), () => reset(true)]]);
    }
  }
  function render() {
    cells.forEach((cell, i) => {
      const v = grid[Math.floor(i / N)][i % N];
      cell.textContent = v || '';
      cell.style.background = v ? (COLORS[v] || '#3c3a32') : 'rgba(238,228,218,.35)';
      if (v) cell.style.color = v <= 4 ? '#776e65' : '#f9f6f2';
      if (v) { cell.classList.remove('pop'); void cell.offsetWidth; cell.classList.add('pop'); }
    });
  }

  let ts = null;
  shell.stage.addEventListener('touchstart', (e) => { ts = e.touches[0]; }, { passive: true });
  shell.stage.addEventListener('touchend', (e) => {
    if (!ts) return;
    const dx = e.changedTouches[0].clientX - ts.clientX;
    const dy = e.changedTouches[0].clientY - ts.clientY;
    if (Math.abs(dx) < 18 && Math.abs(dy) < 18) return;
    if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 1 : -1, 0);
    else move(0, dy > 0 ? 1 : -1);
    ts = null;
  }, { passive: true });
  const onKey = (e) => {
    const map = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (map[e.key]) { e.preventDefault(); move(...map[e.key]); }
  };
  window.addEventListener('keydown', onKey);

  reset(false);
  return () => window.removeEventListener('keydown', onKey);
}
