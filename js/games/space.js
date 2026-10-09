// Space Adventure — drag ship, auto-fire, asteroids & waves
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
  shell.addButton(t('pause'), '⏸', () => { paused = !paused; if (paused) shell.overlay('⏸ ' + t('pause'), '', [['▶ ' + t('resume'), () => { paused = false; shell.closeOverlay(); }]]); else shell.closeOverlay(); });
  shell.addButton(t('restart'), '↻', () => reset(true));
  statBest.set(String(api.getBest()?.score ?? 0));

  let ship, bullets, rocks, stars, score, lives, wave, over, running, raf, paused, cool;

  function reset(autoplay = false) {
    ship = { x: W / 2, y: H - 60, w: 30, h: 30 };
    bullets = []; rocks = [];
    stars = Array.from({ length: 40 }, () => ({ x: Math.random() * W, y: Math.random() * H, s: .4 + Math.random() * 1.6 }));
    score = 0; lives = 3; wave = 1; over = false; running = autoplay; paused = false; cool = 0;
    statScore.set('0'); statLives.set('❤❤❤');
    shell.closeOverlay();
    if (autoplay) startRaf();
    else shell.overlay('🚀 ' + t('tap_to_start'), api.meta.how,
      [['▶ ' + t('start'), () => { running = true; shell.closeOverlay(); startRaf(); }]], { dismissible: false });
  }
  function startRaf() {
    cancelAnimationFrame(raf);
    const tick = () => {
      if (running && !paused && !over) update();
      draw();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }
  function update() {
    cool--;
    // auto fire
    if (cool <= 0) { bullets.push({ x: ship.x, y: ship.y - 18 }); cool = 14; }
    bullets.forEach((b) => { b.y -= 7; });
    bullets = bullets.filter((b) => b.y > -10);
    // spawn rocks
    if (Math.random() < .022 + wave * .004) {
      rocks.push({ x: 20 + Math.random() * (W - 40), y: -20, r: 12 + Math.random() * 12, vx: (Math.random() - .5) * 1.4, vy: 1.4 + Math.random() * 1.6 + wave * .12, hp: 1 });
    }
    rocks.forEach((o) => { o.x += o.vx; o.y += o.vy; });
    rocks = rocks.filter((o) => o.y < H + 30 && o.x > -30 && o.x < W + 30);
    stars.forEach((s) => { s.y += s.s; if (s.y > H) { s.y = 0; s.x = Math.random() * W; } });
    // bullet hits
    for (const b of bullets) {
      for (const o of rocks) {
        if (o.hp > 0 && Math.hypot(b.x - o.x, b.y - o.y) < o.r + 3) {
          o.hp = 0; b.y = -100;
          score += 10; statScore.set(String(score));
          vibrate(12);
          break;
        }
      }
    }
    rocks = rocks.filter((o) => o.hp > 0);
    // ship collisions
    for (const o of rocks) {
      if (Math.hypot(ship.x - o.x, ship.y - o.y) < o.r + 12) {
        o.hp = 0;
        lives--;
        statLives.set('❤'.repeat(Math.max(0, lives)));
        vibrate(90);
        if (lives <= 0) return gameOver();
      }
    }
    if (score > wave * 150) wave++;
  }
  function gameOver() {
    over = true; running = false;
    cancelAnimationFrame(raf);
    api.submit(score);
    statBest.set(String(api.getBest()?.score ?? 0));
    shell.overlay(t('game_over'), t('score') + ': ' + score, [['↻ ' + t('restart'), () => reset(true)]]);
  }
  function draw() {
    const dark = document.documentElement.dataset.theme !== 'light';
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, dark ? '#0a0f22' : '#dfe7fb');
    bg.addColorStop(1, dark ? '#141a36' : '#c9d6f4');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = dark ? 'rgba(255,255,255,.6)' : 'rgba(40,50,90,.3)';
    stars.forEach((s) => ctx.fillRect(s.x, s.y, s.s, s.s * 2));
    // bullets
    ctx.fillStyle = '#22d3ee';
    bullets.forEach((b) => ctx.fillRect(b.x - 2, b.y - 8, 4, 12));
    // rocks
    rocks.forEach((o) => {
      ctx.fillStyle = '#8b8ba7';
      ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,.25)';
      ctx.beginPath(); ctx.arc(o.x + o.r * .25, o.y + o.r * .2, o.r * .45, 0, 7); ctx.fill();
    });
    // ship
    ctx.save();
    ctx.translate(ship.x, ship.y);
    const g = ctx.createLinearGradient(0, -16, 0, 16);
    g.addColorStop(0, '#7c5cff'); g.addColorStop(1, '#22d3ee');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, -16); ctx.lineTo(12, 14); ctx.lineTo(0, 8); ctx.lineTo(-12, 14);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  function moveShip(clientX, clientY) {
    const r = cv.getBoundingClientRect();
    ship.x = Math.max(16, Math.min(W - 16, (clientX - r.left) * (W / r.width)));
    ship.y = Math.max(40, Math.min(H - 20, (clientY - r.top) * (H / r.height)));
  }
  shell.stage.addEventListener('touchmove', (e) => moveShip(e.touches[0].clientX, e.touches[0].clientY - 70), { passive: true });
  shell.stage.addEventListener('touchstart', (e) => moveShip(e.touches[0].clientX, e.touches[0].clientY - 70), { passive: true });
  shell.stage.addEventListener('mousemove', (e) => moveShip(e.clientX, e.clientY - 70));
  shell.addPad('⬅', () => { ship.x = Math.max(16, ship.x - 26); });
  shell.addPad('➡', () => { ship.x = Math.min(W - 16, ship.x + 26); });

  reset(false);
  return () => { cancelAnimationFrame(raf); };
}
