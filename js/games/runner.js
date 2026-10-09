// Endless Runner — tap to jump, dodge obstacles
export function mount(api) {
  const { el, t, vibrate, shell } = api;
  const W = 360, H = 240, GROUND = H - 34;
  const cv = el('canvas', { width: W, height: H });
  cv.style.width = 'min(100%, ' + W + 'px)';
  shell.stage.appendChild(cv);
  const ctx = cv.getContext('2d');

  const statScore = shell.addStat('score', t('score'));
  const statBest = shell.addStat('best', t('best'));
  shell.addSpacer();
  shell.addButton(t('restart'), '↻', () => reset(true));
  statBest.set(String(api.getBest()?.score ?? 0));

  let runner, obs, speed, score, over, running, raf, started;

  function reset(autoplay = false) {
    runner = { x: 50, y: GROUND, vy: 0, h: 30, onGround: true };
    obs = []; speed = 3.4; score = 0; over = false; running = autoplay; started = autoplay;
    statScore.set('0');
    shell.closeOverlay();
    if (autoplay) startRaf();
    else shell.overlay('🏃 ' + t('tap_to_start'), api.meta.how,
      [['▶ ' + t('start'), () => { running = started = true; shell.closeOverlay(); startRaf(); }]], { dismissible: false });
    draw();
  }
  function startRaf() {
    cancelAnimationFrame(raf);
    const tick = () => {
      if (running && !over) update();
      draw();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }
  function jump() {
    if (!started || over) { if (!running) { running = started = true; shell.closeOverlay(); startRaf(); } return; }
    if (runner.onGround) { runner.vy = -8.4; runner.onGround = false; vibrate(10); }
  }
  function update() {
    runner.vy += .45;
    runner.y += runner.vy;
    if (runner.y >= GROUND) { runner.y = GROUND; runner.vy = 0; runner.onGround = true; }
    speed = 3.4 + score / 400;
    if (!obs.length || obs[obs.length - 1].x < W - 110 - Math.random() * 130) {
      const h = 16 + Math.floor(Math.random() * 3) * 8;
      obs.push({ x: W + 20, w: 12 + Math.floor(Math.random() * 14), h, fly: Math.random() < .22 });
    }
    obs.forEach((o) => { o.x -= speed; });
    obs = obs.filter((o) => o.x + o.w > 0);
    score += 1;
    if (score % 10 === 0) statScore.set(String(Math.floor(score / 10)));
    // collision
    for (const o of obs) {
      const oy = o.fly ? GROUND - 34 : GROUND - o.h;
      if (runner.x + 14 > o.x && runner.x - 8 < o.x + o.w && runner.y > oy + (o.fly ? 14 : 0) && runner.y - runner.h < oy + o.h) {
        return die();
      }
    }
  }
  function die() {
    over = true; running = false;
    cancelAnimationFrame(raf);
    vibrate(90);
    const sc = Math.floor(score / 10);
    api.submit(sc);
    statBest.set(String(api.getBest()?.score ?? 0));
    shell.overlay(t('game_over'), t('score') + ': ' + sc, [['↻ ' + t('restart'), () => reset(true)]]);
  }
  function draw() {
    const dark = document.documentElement.dataset.theme !== 'light';
    ctx.fillStyle = dark ? '#0d1326' : '#dfe9fb';
    ctx.fillRect(0, 0, W, H);
    // stars/hills decor
    ctx.fillStyle = dark ? 'rgba(255,255,255,.15)' : 'rgba(0,0,60,.08)';
    for (let i = 0; i < 8; i++) ctx.fillRect(((i * 47 + score) % W), 30 + (i * 23) % 60, 2, 2);
    ctx.strokeStyle = dark ? '#2a3352' : '#b9c6e2';
    ctx.beginPath(); ctx.moveTo(0, GROUND + 4); ctx.lineTo(W, GROUND + 4); ctx.stroke();
    // obstacles
    obs.forEach((o) => {
      ctx.fillStyle = o.fly ? '#fbbf24' : '#7c5cff';
      const oy = o.fly ? GROUND - 34 : GROUND - o.h;
      ctx.beginPath(); ctx.roundRect(o.x, oy, o.w, o.h, 4); ctx.fill();
    });
    // runner
    ctx.fillStyle = '#22d3ee';
    ctx.beginPath(); ctx.roundRect(runner.x - 10, runner.y - runner.h, 20, runner.h, 6); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillRect(runner.x + 2, runner.y - runner.h + 6, 4, 4);
  }

  shell.stage.addEventListener('pointerdown', jump);
  const onKey = (e) => { if (e.key === ' ' || e.key === 'ArrowUp') { e.preventDefault(); jump(); } };
  window.addEventListener('keydown', onKey);
  shell.addPad('⬆', jump);

  reset(false);
  return () => { cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey); };
}
