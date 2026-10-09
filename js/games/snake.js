// Snake — swipe, D-pad or arrow keys
const CELL = 22, COLS = 17, ROWS = 20;
export function mount(api) {
  const { el, t, vibrate, shell } = api;
  const W = COLS * CELL, H = ROWS * CELL;
  const statScore = shell.addStat('score', t('score'));
  const statBest = shell.addStat('best', t('best'));
  shell.addSpacer();
  shell.addButton(t('pause'), '⏸', () => togglePause());
  shell.addButton(t('restart'), '↻', () => reset(true));
  const best0 = api.getBest()?.score ?? 0;
  statBest.set(best0);

  const cv = el('canvas', { width: W, height: H });
  cv.style.width = 'min(100%, ' + W + 'px)';
  shell.stage.appendChild(cv);
  const ctx = cv.getContext('2d');

  let snake, dir, nextDir, food, score, alive, paused, started, loop;

  function reset(autoplay = false) {
    snake = [{ x: 8, y: 10 }, { x: 7, y: 10 }, { x: 6, y: 10 }];
    dir = { x: 1, y: 0 }; nextDir = dir;
    score = 0; alive = true; paused = false; started = autoplay;
    statScore.set(0);
    placeFood();
    shell.closeOverlay();
    if (autoplay) startLoop(); else showStart();
  }
  function placeFood() {
    do { food = { x: rint(COLS), y: rint(ROWS) }; }
    while (snake.some((s) => s.x === food.x && s.y === food.y));
  }
  function startLoop() {
    clearInterval(loop);
    loop = setInterval(step, Math.max(70, 150 - score * 2));
  }
  function step() {
    if (!alive || paused) return;
    dir = nextDir;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    if (head.x < 0 || head.y < 0 || head.x >= COLS || head.y >= ROWS ||
        snake.some((s) => s.x === head.x && s.y === head.y)) return die();
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      score += 1;
      statScore.set(score);
      vibrate(20);
      placeFood();
      startLoop();
    } else snake.pop();
    draw();
  }
  function die() {
    alive = false; clearInterval(loop);
    vibrate(80);
    api.submit(score);
    statBest.set(api.getBest()?.score ?? best0);
    shell.overlay(t('game_over'), t('score') + ': ' + score,
      [['↻ ' + t('restart'), () => reset(true)]]);
  }
  function showStart() {
    shell.overlay('🐍 ' + t('tap_to_start'), api.meta.how,
      [['▶ ' + t('start'), () => { started = true; shell.closeOverlay(); startLoop(); }]], { dismissible: false });
    draw();
  }
  function togglePause() {
    if (!started || !alive) return;
    paused = !paused;
    if (paused) shell.overlay('⏸ ' + t('pause'), '', [['▶ ' + t('resume'), () => { paused = false; shell.closeOverlay(); }]]);
    else shell.closeOverlay();
  }
  function setDir(d) {
    if (!started || !alive || paused) return;
    if (d.x === -dir.x && d.y === -dir.y) return;
    nextDir = d;
  }
  function draw() {
    const dark = document.documentElement.dataset.theme !== 'light';
    ctx.fillStyle = dark ? '#0d1326' : '#dfe6f5';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(127,127,127,.08)';
    for (let i = 0; i <= COLS; i++) { ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, H); ctx.stroke(); }
    for (let i = 0; i <= ROWS; i++) { ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(W, i * CELL); ctx.stroke(); }
    ctx.fillStyle = '#f87171';
    ctx.beginPath();
    ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL * .36, 0, 7);
    ctx.fill();
    snake.forEach((s, i) => {
      const g = ctx.createLinearGradient(s.x * CELL, s.y * CELL, (s.x + 1) * CELL, (s.y + 1) * CELL);
      g.addColorStop(0, i === 0 ? '#22d3ee' : '#7c5cff');
      g.addColorStop(1, i === 0 ? '#34d399' : '#5b3fd6');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.roundRect(s.x * CELL + 2, s.y * CELL + 2, CELL - 4, CELL - 4, 6);
      ctx.fill();
    });
  }

  let ts = null;
  shell.stage.addEventListener('touchstart', (e) => { ts = e.touches[0]; }, { passive: true });
  shell.stage.addEventListener('touchend', (e) => {
    if (!ts) return;
    const dx = e.changedTouches[0].clientX - ts.clientX;
    const dy = e.changedTouches[0].clientY - ts.clientY;
    if (Math.abs(dx) > Math.abs(dy)) setDir({ x: Math.sign(dx) || 1, y: 0 });
    else setDir({ x: 0, y: Math.sign(dy) });
    ts = null;
  }, { passive: true });
  const onKey = (e) => {
    const map = { ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 }, ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 } };
    if (map[e.key]) { e.preventDefault(); setDir(map[e.key]); }
    if (e.key === ' ') togglePause();
  };
  window.addEventListener('keydown', onKey);
  [['←', { x: -1, y: 0 }], ['→', { x: 1, y: 0 }], ['↑', { x: 0, y: -1 }], ['↓', { x: 0, y: 1 }]]
    .forEach(([ic, d]) => shell.addPad(ic, () => setDir(d)));

  reset(false);
  return () => { clearInterval(loop); window.removeEventListener('keydown', onKey); };
}
function rint(n) { return Math.floor(Math.random() * n); }
