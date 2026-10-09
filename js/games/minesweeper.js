// Minesweeper — tap to open, long-press to flag, 3 difficulties
export function mount(api) {
  const { el, t, vibrate, shell } = api;
  const SIZES = { easy: [9, 9, 10], medium: [12, 12, 22], hard: [14, 16, 40] };
  let size = 'easy', W, H, MINES, grid, opened, flags, over, started, time, timer, statTime, statMines;

  function build() {
    shell.hud.innerHTML = ''; shell.pad.innerHTML = '';
    [W, H, MINES] = SIZES[size];
    statTime = shell.addStat('time', t('time'));
    statMines = shell.addStat('mines', '💣');
    shell.addSpacer();
    shell.addButton(t('restart'), '↻', () => start());
    const dBtn = shell.addButton('⚙ ' + t(size), '', () => {
      size = size === 'easy' ? 'medium' : size === 'medium' ? 'hard' : 'easy';
      start();
    });
    shell.stage.innerHTML = '';
  }
  function start() {
    build();
    grid = Array.from({ length: H }, () => Array(W).fill(0));
    opened = Array.from({ length: H }, () => Array(W).fill(false));
    flags = Array.from({ length: H }, () => Array(W).fill(false));
    over = false; started = false; time = 0;
    statTime.set('0:00'); statMines.set(String(MINES));
    clearInterval(timer);
    render();
    shell.overlay('💣 ' + t('minesweeper'), api.meta.how + ' (' + t(size) + ')',
      [['▶ ' + t('start'), () => shell.closeOverlay()]], { dismissible: false });
  }
  function placeMines(sr, sc) {
    let placed = 0;
    while (placed < MINES) {
      const r = rint(H), c = rint(W);
      if (grid[r][c] === -1 || (Math.abs(r - sr) <= 1 && Math.abs(c - sc) <= 1)) continue;
      grid[r][c] = -1; placed++;
    }
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
      if (grid[r][c] === -1) continue;
      grid[r][c] = neighbors(r, c).filter(([nr, nc]) => grid[nr][nc] === -1).length;
    }
    timer = setInterval(() => {
      if (over || !started) return;
      time++;
      statTime.set(fmt(time));
    }, 1000);
  }
  function neighbors(r, c) {
    const out = [];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nc >= 0 && nr < H && nc < W) out.push([nr, nc]);
    }
    return out;
  }
  function open(r, c) {
    if (over || flags[r][c] || opened[r][c]) return;
    if (!started) { started = true; placeMines(r, c); }
    opened[r][c] = true;
    vibrate(8);
    if (grid[r][c] === -1) return die(r, c);
    if (grid[r][c] === 0) neighbors(r, c).forEach(([nr, nc]) => { if (!opened[nr][nc]) open(nr, nc); });
    render();
    checkWin();
  }
  function flag(r, c) {
    if (over || opened[r][c]) return;
    flags[r][c] = !flags[r][c];
    const n = flags.flat().filter(Boolean).length;
    statMines.set(String(Math.max(0, MINES - n)));
    render();
  }
  function die(r, c) {
    over = true; clearInterval(timer);
    vibrate(90);
    api.submit(0, { lowerBetter: false, lost: true });
    opened[r][c] = true;
    render();
    shell.overlay('💥 ' + t('game_over'), '', [['↻ ' + t('restart'), () => start()]]);
  }
  function checkWin() {
    const safe = W * H - MINES;
    const openCount = opened.flat().filter(Boolean).length;
    if (openCount === safe) {
      over = true; clearInterval(timer);
      api.submit(Math.max(1, 9999 - time * 10), { seconds: time });
      shell.overlay('🎉 ' + t('you_win'), t('time') + ': ' + fmt(time), [['↻ ' + t('restart'), () => start()]]);
    }
  }
  function render() {
    shell.stage.innerHTML = '';
    const board = el('div', { class: 'ms-board', style: { gridTemplateColumns: `repeat(${W}, 1fr)` } });
    let pressTimer;
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
      const cell = el('button', { class: 'ms-cell' });
      if (opened[r][c]) {
        cell.classList.add('open');
        if (grid[r][c] === -1) { cell.classList.add('mine'); cell.textContent = '💣'; }
        else if (grid[r][c] > 0) { cell.classList.add('ms-c' + grid[r][c]); cell.textContent = String(grid[r][c]); }
      } else if (flags[r][c]) cell.textContent = '🚩';
      cell.addEventListener('click', () => open(r, c));
      cell.addEventListener('contextmenu', (e) => { e.preventDefault(); flag(r, c); });
      cell.addEventListener('touchstart', () => {
        pressTimer = setTimeout(() => { flag(r, c); pressTimer = null; }, 400);
      }, { passive: true });
      cell.addEventListener('touchend', () => { if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; } }, { passive: true });
      cell.addEventListener('touchmove', () => { clearTimeout(pressTimer); }, { passive: true });
      board.appendChild(cell);
    }
    shell.stage.appendChild(board);
  }
  function fmt(s) { return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }

  start();
  return () => clearInterval(timer);
}
function rint(n) { return Math.floor(Math.random() * n); }
