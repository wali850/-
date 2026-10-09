// Gaming tools: stopwatch, countdown, RNG, teams, dice, coin, reaction, focus, score tracker
import { el, fmtTime, fmtStopwatch, shuffle, openModal, closeModal, toast, vibrate } from '../ui.js';
import { load, save, getStats, bumpStat } from '../store.js';
import { t } from '../i18n.js';

export const mountStopwatch = (api) => {
  const { shell } = api;
  const out = el('div', { class: 'big-display' }, '00:00.00');
  const laps = el('div', { class: 'row-list' });
  shell.stage.style.padding = '10px';
  shell.stage.append(el('div', {}, out, laps));
  let running = false, elapsed = 0, lastTick = 0, raf, lapNo = 0;
  shell.addSpacer();
  const b = shell.addButton(t('start'), '▶', toggle);
  shell.addButton(t('lap'), '🚩', () => {
    if (!running) return;
    lapNo++;
    laps.prepend(el('div', { class: 'score-row' }, t('lap') + ' ' + lapNo, fmtStopwatch(elapsed)));
  });
  shell.addButton(t('reset'), '↻', () => {
    running = false; cancelAnimationFrame(raf); elapsed = 0; lapNo = 0;
    out.textContent = '00:00.00'; laps.innerHTML = ''; b.textContent = '▶ ' + t('start');
  });
  function toggle() {
    running = !running;
    if (running) { lastTick = performance.now(); b.textContent = '⏸ ' + t('stop'); raf = requestAnimationFrame(tick); }
    else cancelAnimationFrame(raf);
  }
  function tick(now) {
    if (!running) return;
    elapsed += now - lastTick; lastTick = now;
    out.textContent = fmtStopwatch(elapsed);
    raf = requestAnimationFrame(tick);
  }
  return () => cancelAnimationFrame(raf);
};

export const mountTimer = (api) => {
  const { shell } = api;
  let total = 300, left = 300, running = false, iv;
  const out = el('div', { class: 'big-display' }, fmtTime(left));
  shell.stage.style.padding = '10px';
  const mins = el('input', { type: 'number', min: '0', max: '180', value: '5', class: 'btn', style: { width: '110px', textAlign: 'center' } });
  shell.stage.append(el('div', { style: { textAlign: 'center' } }, out,
    el('div', { class: 'btn-row', style: { justifyContent: 'center', marginTop: '8px' } }, mins, el('span', { style: { alignSelf: 'center', fontSize: '12px', color: 'var(--text-dim)' } }, t('minutes')))));
  shell.addSpacer();
  const b = shell.addButton(t('start_timer'), '▶', () => {
    if (running) { running = false; clearInterval(iv); b.textContent = '▶ ' + t('start_timer'); return; }
    if (!running) total = left = Math.max(1, (+mins.value || 5) * 60);
    running = true;
    b.textContent = '⏸ ' + t('stop');
    iv = setInterval(() => {
      left--;
      out.textContent = fmtTime(left);
      if (left <= 0) {
        clearInterval(iv); running = false;
        b.textContent = '▶ ' + t('start_timer');
        vibrate(400);
        toast('⏰ ' + t('timer_done'), 4000);
        shell.overlay('⏰', t('timer_done'), [['✕ ' + t('cancel'), () => shell.closeOverlay()]]);
      }
    }, 1000);
  });
  shell.addButton(t('add_min'), '＋', () => {
    mins.value = String((+mins.value || 0) + 1);
    total = left = (+mins.value) * 60;
    out.textContent = fmtTime(left);
  });
  shell.addButton(t('reset'), '↻', () => {
    running = false; clearInterval(iv);
    left = total = Math.max(1, (+mins.value || 5) * 60);
    out.textContent = fmtTime(left);
    b.textContent = '▶ ' + t('start_timer');
  });
  return () => clearInterval(iv);
};

export const mountRng = (api) => {
  const { shell } = api;
  const min = el('input', { type: 'number', value: '1', class: 'btn', style: { width: '110px', textAlign: 'center' } });
  const max = el('input', { type: 'number', value: '100', class: 'btn', style: { width: '110px', textAlign: 'center' } });
  const out = el('div', { class: 'big-display' }, '—');
  shell.stage.style.padding = '10px';
  shell.stage.append(el('div', { style: { textAlign: 'center' } }, out,
    el('div', { class: 'btn-row', style: { justifyContent: 'center', marginTop: '8px' } },
      min, el('span', { style: { alignSelf: 'center', color: 'var(--text-dim)' } }, '→'), max)));
  shell.addButton(t('generate'), '🎲', () => {
    const a = +min.value, b2 = +max.value;
    if (isNaN(a) || isNaN(b2) || a > b2) { toast('⚠️ ' + t('min') + ' ≤ ' + t('max')); return; }
    out.textContent = String(Math.floor(Math.random() * (b2 - a + 1)) + a);
    vibrate(15);
  });
  return () => {};
};

export const mountTeams = (api) => {
  const { shell } = api;
  const names = el('textarea', { class: 'field', placeholder: api.t('players_ph'), style: { width: '100%', minHeight: '80px', padding: '10px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card)' } });
  const per = el('input', { type: 'number', min: '2', max: '10', value: '2', style: { width: '90px', padding: '8px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--card)' } });
  const out = el('div', { class: 'row-list', style: { marginTop: '10px' } });
  shell.stage.style.padding = '10px';
  shell.stage.append(el('div', { style: { width: '100%' } }, names,
    el('div', { class: 'btn-row', style: { marginTop: '8px' } }, per, el('span', { style: { alignSelf: 'center', fontSize: '12px', color: 'var(--text-dim)' } }, api.t('team_size'))), out));
  shell.addButton(api.t('make_teams'), '👥', () => {
    const list = names.value.split(/[,،\n]/).map((s) => s.trim()).filter(Boolean);
    if (list.length < 2) { api.toast('⚠️ ' + api.t('players_ph')); return; }
    const size = Math.max(2, +per.value || 2);
    const shuffled = shuffle(list);
    const nTeams = Math.ceil(list.length / size);
    out.innerHTML = '';
    for (let i = 0; i < nTeams; i++) {
      const members = shuffled.slice(i * size, (i + 1) * size);
      if (!members.length) continue;
      out.appendChild(el('div', { class: 'card' },
        el('b', { style: { color: 'var(--accent2)' } }, api.t('team') + ' ' + (i + 1)),
        el('div', { style: { fontSize: '13px', marginTop: '6px' } }, members.join(' • '))));
    }
    vibrate(20);
  });
  return () => {};
};

export const mountDice = (api) => {
  const { shell } = api;
  const out = el('div', { style: { display: 'flex', gap: '10px', fontSize: '54px', flexWrap: 'wrap', justifyContent: 'center' } }, '🎲');
  const hist = el('div', { style: { display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '10px', color: 'var(--text-dim)', fontSize: '13px' } });
  const count = el('input', { type: 'number', min: '1', max: '6', value: '2', style: { width: '70px', padding: '8px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--card)', textAlign: 'center' } });
  shell.stage.style.padding = '16px';
  shell.stage.append(el('div', { style: { textAlign: 'center', width: '100%' } }, out, hist,
    el('div', { class: 'btn-row', style: { justifyContent: 'center', marginTop: '12px' } }, count)));
  shell.addSpacer();
  shell.addButton(api.t('roll'), '🎲', () => {
    const n = Math.min(6, Math.max(1, +count.value || 1));
    const rolls = Array.from({ length: n }, () => 1 + Math.floor(Math.random() * 6));
    out.innerHTML = '';
    rolls.forEach((r) => out.appendChild(el('span', {}, ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][r - 1])));
    hist.textContent = '';
    hist.append('Σ ' + rolls.reduce((a, b) => a + b, 0));
    vibrate(20);
  });
  return () => {};
};

export const mountCoin = (api) => {
  const { shell } = api;
  const out = el('div', { class: 'big-display' }, '🪙');
  let heads = 0, tails = 0;
  const tally = el('div', { style: { textAlign: 'center', color: 'var(--text-dim)', fontSize: '13px' } });
  shell.stage.style.padding = '10px';
  shell.stage.append(el('div', { style: { textAlign: 'center', width: '100%' } }, out, tally));
  shell.addSpacer();
  shell.addButton(api.t('flip'), '🪙', () => {
    const isHead = Math.random() < .5;
    if (isHead) heads++; else tails++;
    out.textContent = isHead ? '🟡 ' + api.t('heads') : '⚪ ' + api.t('tails');
    tally.textContent = api.t('heads') + ': ' + heads + ' • ' + api.t('tails') + ': ' + tails;
    vibrate(15);
  });
  return () => {};
};

export const mountReaction = (api) => {
  const { shell } = api;
  const pad = el('div', {
    class: 'card', style: { width: '100%', height: '100%', minHeight: '240px', display: 'grid', placeItems: 'center', fontSize: '20px', fontWeight: '800', textAlign: 'center', cursor: 'pointer', borderRadius: '16px' },
  }, api.t('wait_green'));
  pad.style.background = 'var(--bad)';
  pad.style.color = '#fff';
  shell.stage.style.padding = '10px';
  shell.stage.append(pad);
  let state = 'wait', t0 = 0, timeout, tries = 0;
  pad.addEventListener('pointerdown', () => {
    if (state === 'wait') {
      state = 'red';
      pad.textContent = api.t('too_soon');
      vibrate(60);
      timeout = setTimeout(() => {
        state = 'go';
        pad.style.background = 'var(--good)';
        pad.textContent = api.t('click_now');
        t0 = performance.now();
      }, 900 + Math.random() * 2200);
    } else if (state === 'go') {
      state = 'wait';
      const ms = Math.round(performance.now() - t0);
      tries++;
      api.submit(ms, { lowerBetter: true });
      pad.style.background = 'var(--card-strong)';
      pad.style.color = 'var(--text)';
      pad.textContent = api.t('your_time') + ': ' + ms + ' ' + api.t('ms') + '\n' + api.t('tap_to_start');
      api.toast('⚡ ' + ms + api.t('ms'));
    } else if (state === 'red') {
      clearTimeout(timeout);
      state = 'wait';
      pad.style.background = 'var(--bad)';
      pad.textContent = api.t('wait_green');
    }
  });
  return () => clearTimeout(timeout);
};

export const mountFocus = (api) => {
  const { shell } = api;
  let phase = 'focus', left = 25 * 60, running = false, iv;
  const fm = el('input', { type: 'number', value: '25', min: '1', max: '90', style: { width: '80px', padding: '8px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--card)', textAlign: 'center' } });
  const bm = el('input', { type: 'number', value: '5', min: '1', max: '30', style: { width: '80px', padding: '8px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--card)', textAlign: 'center' } });
  const out = el('div', { class: 'big-display' }, fmtTime(left));
  const label = el('div', { style: { textAlign: 'center', fontSize: '13px', fontWeight: '800', color: 'var(--accent2)' } }, '🎯 ' + api.t('focus_timer'));
  shell.stage.style.padding = '10px';
  shell.stage.append(el('div', { style: { textAlign: 'center', width: '100%' } }, label, out,
    el('div', { class: 'btn-row', style: { justifyContent: 'center', marginTop: '8px' } },
      fm, el('span', { style: { alignSelf: 'center', fontSize: '11px', color: 'var(--text-dim)' } }, api.t('focus_min')),
      bm, el('span', { style: { alignSelf: 'center', fontSize: '11px', color: 'var(--text-dim)' } }, api.t('break_min')))));
  shell.addSpacer();
  const b = shell.addButton(api.t('start'), '▶', () => {
    running = !running;
    if (running) {
      if (left === 0) left = (phase === 'focus' ? +fm.value : +bm.value) * 60;
      iv = setInterval(() => {
        left--;
        out.textContent = fmtTime(left);
        if (left <= 0) {
          clearInterval(iv); running = false; b.textContent = '▶ ' + api.t('start');
          vibrate(400);
          const done = phase === 'focus';
          toast(done ? '🎉 ' + api.t('focus_done') : '⏰ ' + api.t('break_done'), 4000);
          if (done) bumpStat('focusSessions', 1);
          phase = done ? 'break' : 'focus';
          label.textContent = (done ? '☕' : '🎯') + ' ' + api.t(done ? 'break_min' : 'focus_timer');
          left = (done ? +bm.value : +fm.value) * 60;
          out.textContent = fmtTime(left);
        }
      }, 1000);
      b.textContent = '⏸ ' + api.t('stop');
    } else { clearInterval(iv); b.textContent = '▶ ' + api.t('start'); }
  });
  shell.addButton(api.t('reset'), '↻', () => {
    running = false; clearInterval(iv); b.textContent = '▶ ' + api.t('start');
    phase = 'focus'; left = (+fm.value) * 60;
    label.textContent = '🎯 ' + api.t('focus_timer');
    out.textContent = fmtTime(left);
  });
  return () => clearInterval(iv);
};

export const mountScoreTracker = (api) => {
  const { shell } = api;
  let players = load('scoretracker', []);
  const list = el('div', { class: 'row-list', style: { width: '100%' } });
  shell.stage.style.padding = '10px';
  const nameIn = el('input', { placeholder: api.t('player'), style: { flex: '1', padding: '9px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--card)' } });
  shell.stage.append(el('div', { style: { width: '100%' } },
    el('div', { style: { display: 'flex', gap: '8px' } }, nameIn,
      el('button', { class: 'btn small primary', onclick: () => {
        const n = nameIn.value.trim();
        if (!n) return;
        players.push({ name: n, score: 0 });
        nameIn.value = '';
        save('scoretracker', players);
        render();
      } }, '+ ' + api.t('add_player'))),
    list));
  shell.addSpacer();
  shell.addButton(api.t('reset'), '↻', () => {
    players.forEach((p) => { p.score = 0; });
    save('scoretracker', players);
    render();
  });
  function render() {
    list.innerHTML = '';
    [...players].sort((a, b) => b.score - a.score).forEach((p) => {
      list.appendChild(el('div', { class: 'row-item' },
        el('div', { class: 'r-main' }, el('div', { class: 'r-name' }, p.name)),
        el('div', { style: { display: 'flex', gap: '6px', alignItems: 'center' } },
          el('button', { class: 'btn small primary', onclick: () => { p.score++; save('scoretracker', players); render(); vibrate(8); } }, api.t('add_point')),
          el('b', { style: { minWidth: '30px', textAlign: 'center', fontVariantNumeric: 'tabular-nums' } }, String(p.score)))));
    });
  }
  render();
  return () => {};
};
