// Brick Breaker — paddle + ball physics, touch & buttons
export function mount(api) {
  const { el, t, vibrate, shell } = api;
  const W = 360, H = 480;
  const cv = el('canvas', { width: W, height: H });
  cv.style.width = 'min(100%, ' + W + 'px)';
  shell.stage.appendChild(cv);
  const ctx = cv.getContext('2d');

  const statScore = shell.addStat('score', t('score'));
  const statBest = shell.addStat('best', t('best'));
  const statLives = shell.addStat('lives', '❤️');
  shell.addSpacer();
  shell.addButton(t('pause'), '⏸', () => { paused = !paused; if (paused) showPause(); else shell.closeOverlay(); });
  shell.addButton(t('restart'), '↻', () => reset(true));
  statBest.set(String(api.getBest()?.score ?? 0));

  let paddle, ball, bricks, score, lives, level, paused, running, raf;
  const ROWS = 5, COLS = 7;

  function reset(autoplay = false) {
    paddle = { w: 80, h: 12, x: W / 2 - 40, y: H - 30 };
    ball = { x: W / 2, y: H - 50, r: 7, vx: 2.4, vy: -3.6 };
    score = 0; lives = 3; level = 1; paused = false; running = autoplay;
    statScore.set('0'); statLives.set('❤❤❤');
    buildBricks();
    shell.closeOverlay();
    if (autoplay) startRaf(); else {
      shell.overlay('🧱 ' + t('tap_to_start'), api.meta.how,
        [['▶ ' + t('start'), () => { running = true; shell.closeOverlay(); startRaf(); }]], { dismissible: false });
    }
  }
  function buildBricks() {
    bricks = [];
    const bw = (W - 20 - (COLS - 1) * 6) / COLS, bh = 18;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      bricks.push({ x: 10 + c * (bw + 6), y: 50 + r * (bh + 6), w: bw, h: bh, hp: r < 2 ? 2 : 1, hue: (r * 50 + level * 30) % 360 });
    }
  }
  function startRaf() {
    cancelAnimationFrame(raf);
    const tick = () => {
      if (running && !paused) update();
      draw();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }
  function update() {
    ball.x += ball.vx; ball.y += ball.vy;
    if (ball.x < ball.r || ball.x > W - ball.r) { ball.vx *= -1; ball.x = Math.max(ball.r, Math.min(W - ball.r, ball.x)); }
    if (ball.y < ball.r) ball.vy *= -1;
    // paddle
    if (ball.y + ball.r >= paddle.y && ball.y < paddle.y + paddle.h && ball.x > paddle.x && ball.x < paddle.x + paddle.w && ball.vy > 0) {
      ball.vy = -Math.abs(ball.vy);
      ball.vx += ((ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2)) * 2;
      ball.vx = Math.max(-6, Math.min(6, ball.vx));
      vibrate(10);
    }
    // lose
    if (ball.y > H + 20) {
      lives--;
      statLives.set('❤'.repeat(Math.max(0, lives)));
      if (lives <= 0) return gameOver();
      ball = { x: W / 2, y: H - 50, r: 7, vx: 2.4 * Math.sign(Math.random() - .5), vy: -3.6 };
    }
    // bricks
    for (const b of bricks) {
      if (b.hp <= 0) continue;
      if (ball.x > b.x - ball.r && ball.x < b.x + b.w + ball.r && ball.y > b.y - ball.r && ball.y < b.y + b.h + ball.r) {
        b.hp--;
        score += 10 * level;
        statScore.set(String(score));
        vibrate(15);
        const fromSide = ball.x < b.x || ball.x > b.x + b.w;
        if (fromSide) ball.vx *= -1; else ball.vy *= -1;
        break;
      }
    }
    if (bricks.every((b) => b.hp <= 0)) {
      level++;
      buildBricks();
      ball = { x: W / 2, y: H - 50, r: 7, vx: 2.4, vy: -(3.6 + level * .4) };
      paddle.w = Math.max(56, 80 - level * 6);
    }
  }
  function gameOver() {
    running = false;
    cancelAnimationFrame(raf);
    vibrate(90);
    api.submit(score);
    statBest.set(String(api.getBest()?.score ?? 0));
    shell.overlay(t('game_over'), t('score') + ': ' + score, [['↻ ' + t('restart'), () => reset(true)]]);
  }
  function showPause() {
    shell.overlay('⏸ ' + t('pause'), '', [['▶ ' + t('resume'), () => { paused = false; shell.closeOverlay(); }]]);
  }
  function draw() {
    const dark = document.documentElement.dataset.theme !== 'light';
    ctx.fillStyle = dark ? '#0d1326' : '#e8edf8';
    ctx.fillRect(0, 0, W, H);
    for (const b of bricks) {
      if (b.hp <= 0) continue;
      ctx.fillStyle = `hsl(${b.hue} 80% ${b.hp > 1 ? 62 : 50}%)`;
      ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, 5); ctx.fill();
    }
    const g = ctx.createLinearGradient(0, 0, W, 0);
    g.addColorStop(0, '#22d3ee'); g.addColorStop(1, '#7c5cff');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.roundRect(paddle.x, paddle.y, paddle.w, paddle.h, 6); ctx.fill();
    ctx.fillStyle = '#f472b6';
    ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, 7); ctx.fill();
  }
  function setPaddle(x) {
    paddle.x = Math.max(0, Math.min(W - paddle.w, x - paddle.w / 2));
  }
  shell.stage.addEventListener('touchmove', (e) => {
    const r = cv.getBoundingClientRect();
    setPaddle((e.touches[0].clientX - r.left) * (W / r.width));
  }, { passive: true });
  shell.stage.addEventListener('touchstart', (e) => {
    const r = cv.getBoundingClientRect();
    setPaddle((e.touches[0].clientX - r.left) * (W / r.width));
  }, { passive: true });
  shell.stage.addEventListener('mousemove', (e) => {
    const r = cv.getBoundingClientRect();
    setPaddle((e.clientX - r.left) * (W / r.width));
  });
  ['←', '→'].forEach((ic) => shell.addPad(ic, () => setPaddle(paddle.x + paddle.w / 2 + (ic === '←' ? -34 : 34))));
  const onKey = (e) => {
    if (e.key === 'ArrowLeft') setPaddle(paddle.x + paddle.w / 2 - 34);
    if (e.key === 'ArrowRight') setPaddle(paddle.x + paddle.w / 2 + 34);
    if (e.key === ' ') { paused = !paused; if (paused) showPause(); else shell.closeOverlay(); }
  };
  window.addEventListener('keydown', onKey);

  reset(false);
  return () => { cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey); };
}
