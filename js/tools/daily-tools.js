// Everyday tools: calculator, converter, notes, QR gen/scan, password, calendar, world clock, file viewer
import { el, toast, openModal, closeModal, vibrate } from '../ui.js';
import { load, save } from '../store.js';
import { t } from '../i18n.js';

export const mountCalculator = (api) => {
  const { shell } = api;
  let scientific = false, expr = '';
  const out = el('div', { class: 'calc-out' }, '0');
  const grid = el('div', { class: 'calc-grid' });
  shell.stage.style.padding = '12px';
  shell.stage.append(el('div', { style: { width: '100%' } }, out, grid));
  shell.addSpacer();
  const sBtn = shell.addButton(api.t('scientific'), 'ƒ', () => {
    scientific = !scientific;
    sBtn.textContent = (scientific ? '✓ ' : '') + api.t('scientific');
    build();
  });
  const BASIC = [['C', 'fn'], ['(', 'op'], [')', 'op'], ['÷', 'op'], ['7', ''], ['8', ''], ['9', ''], ['×', 'op'],
    ['4', ''], ['5', ''], ['6', ''], ['−', 'op'], ['1', ''], ['2', ''], ['3', ''], ['+', 'op'], ['0', ''], ['.', ''], ['⌫', 'fn'], ['=', 'eq']];
  const SCI = [['sin', 'fn'], ['cos', 'fn'], ['tan', 'fn'], ['√', 'fn'], ['x²', 'fn'], ['π', 'fn'], ['log', 'fn'], ['ln', 'fn'], ['xʸ', 'fn']];
  function build() {
    grid.innerHTML = '';
    const keys = scientific ? [...SCI, ...BASIC] : BASIC;
    if (scientific) grid.style.gridTemplateColumns = 'repeat(5, 1fr)';
    else grid.style.gridTemplateColumns = 'repeat(4, 1fr)';
    keys.forEach(([k, cls]) => {
      const b = el('button', { class: cls }, k);
      b.addEventListener('click', () => press(k));
      grid.appendChild(b);
    });
  }
  function press(k) {
    vibrate(6);
    if (k === 'C') expr = '';
    else if (k === '⌫') expr = expr.slice(0, -1);
    else if (k === '=') {
      try {
        expr = String(evalExpr(expr));
      } catch { toast('⚠️ Error'); }
    } else if (k === 'xʸ') expr += '^';
    else if (k === 'x²') expr += '²';
    else expr += k;
    out.textContent = expr || '0';
  }
  function evalExpr(e) {
    // translate to JS, then whitelist-validate before evaluating
    const clean = e
      .replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-')
      .replace(/π/g, 'Math.PI').replace(/√(\d+\.?\d*)/g, 'Math.sqrt($1)')
      .replace(/(\d+\.?\d*|Math\.PI|\([^)]*\))²/g, 'Math.pow($1,2)')
      .replace(/sin\(/g, 'Math.sin(').replace(/cos\(/g, 'Math.cos(').replace(/tan\(/g, 'Math.tan(')
      .replace(/log\(/g, 'Math.log10(').replace(/ln\(/g, 'Math.log(')
      .replace(/(\d+\.?\d*|Math\.PI|\([^)]*\))\^(\d+\.?\d*|Math\.PI)/g, 'Math.pow($1,$2)');
    const stripped = clean.replace(/Math\.(PI|sqrt|sin|cos|tan|log10|log|pow)/g, 'M');
    if (!/^[0-9+\-*/().,\sM]+$/.test(stripped)) throw new Error('bad input');
    const val = Function('"use strict";return (' + clean + ')')();
    if (typeof val !== 'number' || !isFinite(val)) throw new Error('bad result');
    return Math.round(val * 1e10) / 1e10;
  }
  build();
  return () => {};
};

export const mountConverter = (api) => {
  const { shell } = api;
  const UNITS = {
    length: { m: 1, km: 1000, cm: .01, mm: .001, mile: 1609.344, yard: .9144, foot: .3048, inch: .0254 },
    weight: { kg: 1, g: .001, ton: 1000, pound: .453592, ounce: .0283495 },
    volume: { liter: 1, ml: .001, gallon: 3.78541, cup: .24 },
    speed: { 'km/h': 1, 'm/s': 3.6, mph: 1.609344, knot: 1.852 },
    data: { MB: 1, KB: 1 / 1024, GB: 1024, byte: 1 / 1048576 },
  };
  const TEMPS = { c: '°C', f: '°F', k: 'K' };
  let cat = 'length', from = 'm', to = 'km';
  const val = el('input', { type: 'number', value: '1', style: { width: '100%', padding: '11px 14px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card)' } });
  const catSel = el('select', { style: { width: '100%', padding: '10px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card)' } });
  const fromSel = el('select', { style: { flex: '1', padding: '10px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card)' } });
  const toSel = el('select', { style: { flex: '1', padding: '10px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card)' } });
  const res = el('div', { class: 'big-display', style: { fontSize: '26px' } }, '—');
  Object.keys(UNITS).concat(['temperature']).forEach((k) => {
    catSel.appendChild(el('option', { value: k }, k));
  });
  function fillSels() {
    const units = cat === 'temperature' ? Object.keys(TEMPS) : Object.keys(UNITS[cat]);
    fromSel.innerHTML = ''; toSel.innerHTML = '';
    units.forEach((u) => {
      fromSel.appendChild(el('option', { value: u }, u));
      toSel.appendChild(el('option', { value: u }, u));
    });
    from = units[0]; to = units[1];
    fromSel.value = from; toSel.value = to;
    convert();
  }
  function convert() {
    const v = +val.value;
    if (isNaN(v)) { res.textContent = '—'; return; }
    let out;
    if (cat === 'temperature') {
      const toC = { c: (x) => x, f: (x) => (x - 32) * 5 / 9, k: (x) => x - 273.15 }[fromSel.value](v);
      out = { c: (x) => x, f: (x) => x * 9 / 5 + 32, k: (x) => x + 273.15 }[toSel.value](toC);
    } else {
      out = v * UNITS[cat][fromSel.value] / UNITS[cat][toSel.value];
    }
    res.textContent = (Math.round(out * 1e6) / 1e6) + ' ' + toSel.value;
  }
  catSel.addEventListener('change', () => { cat = catSel.value; fillSels(); });
  fromSel.addEventListener('change', convert);
  toSel.addEventListener('change', convert);
  val.addEventListener('input', convert);
  shell.stage.style.padding = '14px';
  shell.stage.append(el('div', { style: { width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' } }, catSel, val,
    el('div', { style: { display: 'flex', gap: '8px', alignItems: 'center' } }, fromSel, '→', toSel), res));
  fillSels();
  return () => {};
};

export const mountNotes = (api) => {
  const { shell } = api;
  let notes = load('notes', []);
  const list = el('div', { class: 'row-list', style: { width: '100%' } });
  const input = el('input', { placeholder: api.t('add_note'), style: { flex: '1', padding: '11px 14px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card)' } });
  shell.stage.style.padding = '10px';
  shell.stage.append(el('div', { style: { width: '100%' } },
    el('div', { style: { display: 'flex', gap: '8px' } }, input,
      el('button', { class: 'btn small primary', onclick: () => {
        const v = input.value.trim();
        if (!v) return;
        notes.unshift({ text: v, done: false, at: Date.now() });
        input.value = '';
        save('notes', notes);
        render();
        vibrate(10);
      } }, '+ ' + api.t('add'))),
    list));
  function render() {
    list.innerHTML = '';
    if (!notes.length) {
      list.appendChild(el('div', { class: 'state-box' }, el('div', { class: 's-ico' }, '📝'), el('p', {}, api.t('no_notes'))));
      return;
    }
    notes.forEach((n, i) => {
      list.appendChild(el('div', { class: 'note-item card' },
        el('input', { type: 'checkbox', checked: n.done, onchange: (e) => { n.done = e.target.checked; save('notes', notes); render(); } }),
        el('div', { class: 'r-main', style: n.done ? { textDecoration: 'line-through', color: 'var(--text-dim)' } : {} }, n.text),
        el('button', { class: 'icon-btn', style: { width: '32px', height: '32px' }, onclick: () => { notes.splice(i, 1); save('notes', notes); render(); } }, '🗑')));
    });
  }
  render();
  return () => {};
};

export const mountQrGen = (api) => {
  const { shell } = api;
  const input = el('input', { placeholder: api.t('qr_text'), style: { width: '100%', padding: '11px 14px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card)' } });
  const imgBox = el('div', { style: { display: 'grid', placeItems: 'center', minHeight: '180px' } });
  shell.stage.style.padding = '14px';
  shell.stage.append(el('div', { style: { width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' } }, input, imgBox));
  shell.addSpacer();
  shell.addButton(api.t('generate'), '▦', () => {
    const text = input.value.trim();
    if (!text) { api.toast('⚠️ ' + api.t('qr_text')); return; }
    try {
      const qr = window.qrcode(0, 'M');
      qr.addData(text);
      qr.make();
      const cellCount = qr.getModuleCount();
      const size = Math.min(280, cellCount * 6);
      const c = el('canvas', { width: size, height: size });
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = '#0b1020';
      const cs = size / cellCount;
      for (let r = 0; r < cellCount; r++) for (let col = 0; col < cellCount; col++) {
        if (qr.isDark(r, col)) ctx.fillRect(col * cs, r * cs, cs, cs);
      }
      imgBox.innerHTML = '';
      const wrap = el('div', { style: { background: '#fff', padding: '10px', borderRadius: '14px' } }, c);
      c.addEventListener('click', () => {
        c.toBlob((blob) => {
          const a = el('a', { href: URL.createObjectURL(blob), download: 'gamebox-qr.png' });
          a.click();
          api.toast('⬇️ PNG');
        });
      });
      imgBox.appendChild(wrap);
    } catch (e) {
      api.toast('⚠️ ' + e.message);
    }
  });
  return () => {};
};

export const mountQrScan = (api) => {
  const { shell } = api;
  const video = el('video', { playsinline: '', autoplay: '', muted: '' });
  video.style.cssText = 'width:100%;max-width:100%;border-radius:12px;background:#000';
  const out = el('div', { style: { fontSize: '13px', marginTop: '10px', wordBreak: 'break-all', color: 'var(--text-dim)' } });
  shell.stage.style.padding = '12px';
  shell.stage.append(el('div', { style: { width: '100%' } }, video, out));
  let stream = null, raf;
  shell.addSpacer();
  const btn = shell.addButton(api.t('qr_start'), '📷', async () => {
    if (stream) return;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      video.srcObject = stream;
      await video.play();
      out.textContent = '';
      scan();
    } catch (e) {
      out.textContent = '⚠️ ' + api.t('qr_perm');
      api.toast('⚠️ ' + api.t('qr_perm'));
      stream = null;
    }
  });
  async function scan() {
    if (!stream) return;
    try {
      if ('BarcodeDetector' in window) {
        const det = new window.BarcodeDetector();
        const found = await det.detect(video);
        if (found.length) {
          out.textContent = api.t('qr_done') + ' ' + found[0].rawValue;
          api.toast('✅ ' + found[0].rawValue);
          vibrate(60);
          stop();
          return;
        }
      } else {
        out.textContent = '⚠️ BarcodeDetector ' + api.t('not_available').toLowerCase();
        stop();
        return;
      }
    } catch {}
    raf = requestAnimationFrame(scan);
  }
  function stop() {
    cancelAnimationFrame(raf);
    stream?.getTracks().forEach((tr) => tr.stop());
    stream = null;
  }
  return () => stop();
};

export const mountPassword = (api) => {
  const { shell } = api;
  const out = el('div', { style: { fontFamily: 'monospace', fontSize: '17px', fontWeight: '700', background: 'var(--card-strong)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px', wordBreak: 'break-all', textAlign: 'center', width: '100%' } }, '—');
  const len = el('input', { type: 'number', min: '8', max: '40', value: '16', style: { width: '90px', padding: '8px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--card)', textAlign: 'center' } });
  const chk = (label, checked) => {
    const c = el('input', { type: 'checkbox', checked });
    c.dataset.on = checked;
    c.addEventListener('change', () => { c.dataset.on = c.checked; });
    return el('label', { class: 'chip', style: { display: 'flex', gap: '6px', alignItems: 'center' } }, c, label);
  };
  const sym = chk(api.t('symbols'), true);
  const num = chk(api.t('numbers'), true);
  const upp = chk(api.t('uppercase'), true);
  shell.stage.style.padding = '14px';
  shell.stage.append(el('div', { style: { width: '100%', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' } },
    out,
    el('div', { class: 'btn-row', style: { justifyContent: 'center' } }, len,
      el('span', { style: { fontSize: '11px', color: 'var(--text-dim)', alignSelf: 'center' } }, api.t('length'))),
    el('div', { class: 'chips', style: { justifyContent: 'center' } }, upp, num, sym)));
  shell.addSpacer();
  const gen = () => {
    const L = Math.min(40, Math.max(8, +len.value || 16));
    let chars = 'abcdefghijkmnopqrstuvwxyz';
    if (upp.querySelector('input').checked) chars += 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    if (num.querySelector('input').checked) chars += '23456789';
    if (sym.querySelector('input').checked) chars += '!@#$%^&*_-+=?';
    const arr = new Uint32Array(L);
    crypto.getRandomValues(arr);
    out.textContent = [...arr].map((v) => chars[v % chars.length]).join('');
  };
  shell.addButton(api.t('generate'), '🔑', gen);
  shell.addButton(api.t('copy'), '📋', () => {
    navigator.clipboard?.writeText(out.textContent).then(() => api.toast('✅ ' + api.t('copied')));
  });
  return () => {};
};

export const mountCalendar = (api) => {
  const { shell } = api;
  const now = new Date();
  let y = now.getFullYear(), m = now.getMonth();
  const head = el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' } });
  const grid = el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', width: '100%' } });
  function render2() {
    head.innerHTML = '';
    head.append(
      el('button', { class: 'icon-btn', onclick: () => { m--; if (m < 0) { m = 11; y--; } render2(); } }, '‹'),
      el('b', {}, new Date(y, m, 1).toLocaleDateString(document.documentElement.lang, { month: 'long', year: 'numeric' })),
      el('button', { class: 'icon-btn', onclick: () => { m++; if (m > 11) { m = 0; y++; } render2(); } }, '›'));
    grid.innerHTML = '';
    ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach((d) => grid.appendChild(el('div', { style: { textAlign: 'center', fontSize: '11px', color: 'var(--text-dim)', fontWeight: '800' } }, d)));
    const first = new Date(y, m, 1).getDay();
    const days = new Date(y, m + 1, 0).getDate();
    for (let i = 0; i < first; i++) grid.appendChild(el('div', {}));
    for (let d = 1; d <= days; d++) {
      const isToday = d === now.getDate() && m === now.getMonth() && y === now.getFullYear();
      grid.appendChild(el('div', {
        style: {
          textAlign: 'center', padding: '7px 0', borderRadius: '10px', fontSize: '13px', fontWeight: isToday ? '800' : '500',
          background: isToday ? 'linear-gradient(90deg,var(--accent),var(--accent2))' : 'transparent',
          color: isToday ? '#fff' : 'var(--text)',
        },
      }, String(d)));
    }
  }
  shell.stage.style.padding = '12px';
  shell.stage.append(el('div', { style: { width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' } }, head, grid));
  render2();
  return () => {};
};

export const mountWorldClock = (api) => {
  const { shell } = api;
  const CITIES = [['Kabul', 'Asia/Kabul'], ['London', 'Europe/London'], ['New York', 'America/New_York'], ['Dubai', 'Asia/Dubai'], ['Tokyo', 'Asia/Tokyo'], ['Paris', 'Europe/Paris']];
  const list = el('div', { class: 'row-list', style: { width: '100%' } });
  shell.stage.style.padding = '10px';
  shell.stage.append(list);
  let iv;
  function tick() {
    list.innerHTML = '';
    CITIES.forEach(([city, tz]) => {
      const time = new Date().toLocaleTimeString(document.documentElement.lang, { timeZone: tz, hour: '2-digit', minute: '2-digit' });
      list.appendChild(el('div', { class: 'score-row' }, city, el('b', { style: { fontVariantNumeric: 'tabular-nums' } }, time)));
    });
  }
  tick();
  iv = setInterval(tick, 5000);
  return () => clearInterval(iv);
};

export const mountViewer = (api) => {
  const { shell } = api;
  const input = el('input', { type: 'file', accept: 'image/*,application/pdf', style: { display: 'none' } });
  const box = el('div', { style: { width: '100%', display: 'grid', placeItems: 'center', minHeight: '220px' } },
    el('div', { class: 'state-box' },
      el('div', { class: 's-ico' }, '🖼️'),
      el('p', {}, api.t('viewer_hint')),
      el('div', { class: 'badge perm' }, api.t('viewer_perm'))));
  shell.stage.style.padding = '10px';
  input.addEventListener('change', () => {
    const f = input.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    box.innerHTML = '';
    if (f.type.startsWith('image/')) {
      box.appendChild(el('img', { src: url, style: { maxWidth: '100%', maxHeight: '60vh', borderRadius: '12px' } }));
    } else if (f.type === 'application/pdf') {
      box.appendChild(el('embed', { src: url, type: 'application/pdf', style: { width: '100%', height: '60vh', borderRadius: '12px' } }));
    } else {
      box.innerHTML = '';
      box.appendChild(el('div', { class: 'state-box' }, el('div', { class: 's-ico' }, '⚠️'), el('p', {}, api.t('not_available'))));
    }
  });
  shell.addSpacer();
  shell.addButton(api.t('pick_file'), '📂', () => input.click());
  shell.stage.append(el('div', { style: { width: '100%' } }, input, box));
  return () => {};
};
