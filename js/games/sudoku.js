// Sudoku — generated puzzles (unique solution), 3 difficulties
export function mount(api) {
  const { el, t, shell } = api;
  const HOLES = { easy: 36, medium: 45, hard: 52 };
  let size = 'easy', puzzle, solution, sel = null, user, errors, statErr;

  function genFull() {
    const g = Array.from({ length: 81 }, () => 0);
    fill(g, 0);
    return g;

    function fill(g, i) {
      if (i === 81) return true;
      if (g[i]) return fill(g, i + 1);
      const nums = [1,2,3,4,5,6,7,8,9].sort(() => Math.random() - .5);
      for (const n of nums) {
        if (ok(g, i, n)) {
          g[i] = n;
          if (fill(g, i + 1)) return true;
          g[i] = 0;
        }
      }
      return false;
    }
  }
  function ok(g, i, n) {
    const r = Math.floor(i / 9), c = i % 9;
    for (let k = 0; k < 9; k++) {
      if (g[r * 9 + k] === n || g[k * 9 + c] === n) return false;
    }
    const br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3;
    for (let dr = 0; dr < 3; dr++) for (let dc = 0; dc < 3; dc++) {
      if (g[(br + dr) * 9 + bc + dc] === n) return false;
    }
    return true;
  }
  function countSolutions(g, i = 0, cap = 2) {
    if (i === 81) return 1;
    if (g[i]) return countSolutions(g, i + 1, cap);
    let count = 0;
    for (let n = 1; n <= 9 && count < cap; n++) {
      if (ok(g, i, n)) { g[i] = n; count += countSolutions(g, i + 1, cap); g[i] = 0; }
    }
    return count;
  }
  function makePuzzle(holes) {
    solution = genFull();
    puzzle = [...solution];
    const idx = Array.from({ length: 81 }, (_, i) => i).sort(() => Math.random() - .5);
    let removed = 0;
    for (const i of idx) {
      if (removed >= holes) break;
      const backup = puzzle[i];
      puzzle[i] = 0;
      if (countSolutions([...puzzle]) !== 1) puzzle[i] = backup;
      else removed++;
    }
    user = Array(81).fill(0);
  }
  function start() {
    statErr?.set?.('0');
    shell.hud.innerHTML = ''; shell.pad.innerHTML = ''; shell.closeOverlay();
    const errStat = shell.addStat('errors', t('errors'));
    statErr = { set: (v) => errStat.set(String(v)) };
    errors = 0; sel = null;
    makePuzzle(HOLES[size]);
    shell.addSpacer();
    shell.addButton(t('restart'), '↻', () => start());
    const dBtn = shell.addButton('⚙ ' + t(size), '', () => {
      size = size === 'easy' ? 'medium' : size === 'medium' ? 'hard' : 'easy';
      start();
    });
    render();
  }
  function setCell(n) {
    if (sel === null || puzzle[sel]) return;
    user[sel] = user[sel] === n ? 0 : n;
    if (n !== 0 && n !== solution[sel]) {
      errors++;
      statErr.set(String(errors));
    }
    render();
    checkWin();
  }
  function checkWin() {
    for (let i = 0; i < 81; i++) {
      const v = puzzle[i] || user[i];
      if (!v || v !== solution[i]) return;
    }
    api.submit(Math.max(1, 5000 - errors * 100), { errors });
    shell.overlay('🎉 ' + t('you_win'), '', [['↻ ' + t('restart'), () => start()]]);
  }
  function render() {
    shell.stage.innerHTML = '';
    const board = el('div', { class: 'sud-board' });
    for (let i = 0; i < 81; i++) {
      const r = Math.floor(i / 9), c = i % 9;
      const isGiven = !!puzzle[i];
      const v = puzzle[i] || user[i];
      const cell = el('button', {
        class: 'sud-cell'
          + (isGiven ? ' given' : v ? ' user' : '')
          + (v && v !== solution[i] ? ' err' : '')
          + (sel === i ? ' sel' : '')
          + (c % 3 === 2 && c !== 8 ? ' br' : '')
          + (r % 3 === 2 && r !== 8 ? ' bb' : ''),
      }, v ? String(v) : '');
      cell.addEventListener('click', () => { sel = i; render(); });
      board.appendChild(cell);
    }
    const pad = el('div', { class: 'num-pad' });
    for (let n = 1; n <= 9; n++) {
      pad.appendChild(el('button', { onclick: () => setCell(n) }, String(n)));
    }
    shell.stage.append(board, pad);
  }

  start();
  return () => {};
}
