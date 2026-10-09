// Memory Match — flip cards, find pairs
export function mount(api) {
  const { el, t, vibrate, shell } = api;
  const SIZES = { easy: [4, 3], medium: [4, 4], hard: [6, 4] };
  let size = 'easy', ICONS = ['🍎', '🚀', '🌈', '🐸', '🎲', '⚡', '🎧', '🦊', '🌵', '🍕', '🐙', '🎈'];
  let cols, rows, deck, openSet, matchedIdx, matched, moves, statMoves, statPairs, best0;

  function start() {
    [cols, rows] = SIZES[size];
    deck = [...ICONS.slice(0, (cols * rows) / 2), ...ICONS.slice(0, (cols * rows) / 2)]
      .sort(() => Math.random() - .5);
    openSet = []; matchedIdx = new Set(); matched = 0; moves = 0;
    best0 = api.getBest()?.score ?? 0;
    shell.hud.innerHTML = ''; shell.pad.innerHTML = ''; shell.closeOverlay();
    statMoves = shell.addStat('moves', t('moves'));
    statPairs = shell.addStat('pairs', '0 / ' + (cols * rows) / 2);
    shell.addSpacer();
    shell.addButton(t('restart'), '↻', () => start());
    const dBtn = shell.addButton('⚙ ' + t(size), '', () => {
      size = size === 'easy' ? 'medium' : size === 'medium' ? 'hard' : 'easy';
      start();
    });
    render();
  }
  function flip(i) {
    if (openSet.length === 2 || matchedIdx.has(i) || openSet.includes(i)) return;
    openSet.push(i);
    render();
    vibrate(8);
    if (openSet.length === 2) {
      moves++;
      statMoves.set(String(moves));
      const [a, b] = openSet;
      if (deck[a] === deck[b]) {
        matchedIdx.add(a); matchedIdx.add(b);
        matched++;
        statPairs.set(matched + ' / ' + (cols * rows) / 2);
        openSet = [];
        vibrate(30);
        render();
        if (matched === (cols * rows) / 2) {
          api.submit(Math.max(1, 1000 - moves * 5), { moves });
          shell.overlay('🎉 ' + t('you_win'), t('moves') + ': ' + moves,
            [['↻ ' + t('restart'), () => start()]]);
        }
      } else {
        setTimeout(() => { openSet = []; render(); }, 700);
      }
    }
  }
  function render() {
    shell.stage.innerHTML = '';
    const grid = el('div', { class: 'mem-grid', style: { gridTemplateColumns: `repeat(${cols}, 1fr)` } });
    deck.forEach((v, i) => {
      const isMatched = matchedIdx.has(i);
      const isOpen = openSet.includes(i) || isMatched;
      const card = el('button', { class: 'mem-card' + (isOpen ? ' open' : '') + (isMatched ? ' done' : '') },
        isOpen ? v.replace('✔', '') : '');
      card.addEventListener('click', () => flip(i));
      grid.appendChild(card);
    });
    shell.stage.appendChild(grid);
  }
  start();
  return () => {};
}
