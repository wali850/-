// Tic-Tac-Toe — vs AI (3 levels) or 2-player pass-and-play
export function mount(api) {
  const { el, t, vibrate, shell } = api;
  let mode = 'ai', diff = 'medium', turn = 'X', cells, over, statScore, wins;

  function build() {
    shell.hud.innerHTML = '';
    shell.pad.innerHTML = '';
    shell.closeOverlay();
    statScore = shell.addStat('turn', turn === 'X' ? t('player') + ' X' : mode === 'ai' ? '🤖' : t('player') + ' O');
    shell.addSpacer();
    shell.addButton(t('restart'), '↻', () => start());
    const modeBtn = shell.addButton(mode === 'ai' ? '🤖 AI' : '👥 2P', '', () => {
      mode = mode === 'ai' ? '2p' : 'ai';
      start();
    });
    if (mode === 'ai') {
      const diffBtn = shell.addButton('⚙ ' + t(diff), '', () => {
        diff = diff === 'easy' ? 'medium' : diff === 'medium' ? 'hard' : 'easy';
        diffBtn.textContent = '⚙ ' + t(diff);
      });
    }
  }
  function start() {
    build();
    cells = Array(9).fill('');
    over = false; turn = 'X';
    render();
    if (mode === 'ai' && turn === 'O') setTimeout(aiMove, 350);
  }
  function setStat() {
    statScore.set(turn === 'X' ? t('player') + ' X' : mode === 'ai' ? '🤖' : t('player') + ' O');
  }
  function winner(g) {
    const L = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (const [a, b, c] of L) if (g[a] && g[a] === g[b] && g[a] === g[c]) return { p: g[a], line: [a, b, c] };
    return g.every(Boolean) ? { p: '-', line: [] } : null;
  }
  function place(i) {
    if (over || cells[i]) return;
    cells[i] = turn;
    vibrate(10);
    const w = winner(cells);
    render(w?.line);
    if (w) return finish(w);
    turn = turn === 'X' ? 'O' : 'X';
    setStat();
    if (mode === 'ai' && turn === 'O' && !over) setTimeout(aiMove, 380);
  }
  function finish(w) {
    over = true;
    const msg = w.p === '-' ? '—' : (w.p === 'X' ? 'X ' + t('you_win') : (mode === 'ai' ? '🤖 ' + t('you_win') : 'O ' + t('you_win')));
    if (w.p === 'X') api.submit(1);
    shell.overlay(w.p === '-' ? '🤝' : '🎉', msg, [['↻ ' + t('restart'), () => start()]]);
  }
  function bestMove(g, player, depth) {
    const w = winner(g);
    if (w) return { s: w.p === player ? 10 - depth : w.p === '-' ? 0 : depth - 10 };
    const scores = [];
    g.forEach((v, i) => {
      if (v) return;
      g[i] = player;
      scores.push({ i, s: bestMove(g, player === 'O' ? 'X' : 'O', depth + 1).s });
      g[i] = '';
    });
    return player === 'O'
      ? scores.reduce((a, b) => (b.s > a.s ? b : a))
      : scores.reduce((a, b) => (b.s < a.s ? b : a));
  }
  function aiMove() {
    if (over) return;
    const empty = cells.map((v, i) => (v ? null : i)).filter((i) => i !== null);
    let pick;
    if (diff === 'easy') pick = empty[Math.floor(Math.random() * empty.length)];
    else if (diff === 'medium') {
      // win/block if possible, else random
      pick = findLine('O') ?? findLine('X') ?? empty[Math.floor(Math.random() * empty.length)];
    } else pick = bestMove([...cells], 'O', 0).i;
    place(pick);

    function findLine(p) {
      const L = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
      for (const line of L) {
        const vals = line.map((i) => cells[i]);
        if (vals.filter((v) => v === p).length === 2 && vals.includes('')) return line[vals.indexOf('')];
      }
      return null;
    }
  }
  function render(winLine) {
    shell.stage.innerHTML = '';
    const board = el('div', { class: 'ttt-board' });
    cells.forEach((v, i) => {
      const c = el('button', { class: 'ttt-cell' }, v);
      if (winLine?.includes(i)) c.classList.add('win');
      c.addEventListener('click', () => {
        if (mode === 'ai' && turn === 'O') return;
        place(i);
      });
      board.appendChild(c);
    });
    shell.stage.appendChild(board);
  }

  start();
  return () => {};
}
