// GameBox UI helpers
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === 'class') node.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (v !== null && v !== undefined && v !== false) node.setAttribute(k, v);
  }
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    node.append(c.nodeType ? c : document.createTextNode(c));
  }
  return node;
}

let toastTimer;
export function toast(msg, ms = 2200) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add('hidden'), ms);
}

export function openModal(build) {
  const root = document.getElementById('modal-root');
  root.innerHTML = '';
  const back = el('div', { class: 'modal-back' });
  const sheet = el('div', { class: 'modal' });
  back.appendChild(sheet);
  back.addEventListener('click', (e) => { if (e.target === back) closeModal(); });
  build(sheet, closeModal);
  root.appendChild(back);
}
export function closeModal() {
  document.getElementById('modal-root').innerHTML = '';
}

export function fmtTime(totalSec) {
  const s = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(s / 60), r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}
export function fmtStopwatch(ms) {
  const cs = Math.floor(ms / 10) % 100;
  const s = Math.floor(ms / 1000) % 60;
  const m = Math.floor(ms / 60000);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Game shell: HUD (score/best/time) + stage + overlay(pause/gameover) + controls
export function createGameShell(host, opts = {}) {
  host.innerHTML = '';
  const shell = el('div', { class: 'game-shell' });
  const hud = el('div', { class: 'game-hud' });
  const stage = el('div', { class: 'game-stage' });
  const pad = el('div', { class: 'game-pad' });
  shell.append(hud, stage);
  if (opts.pad !== false) shell.append(pad);
  host.appendChild(shell);

  const api = {
    shell, hud, stage, pad,
    stats: {},
    addStat(key, label) {
      const wrap = el('div', { class: 'hud-item' }, label);
      const b = el('b', {}, '0');
      wrap.appendChild(b);
      hud.appendChild(wrap);
      api.stats[key] = { set: (v) => { b.textContent = v; } };
      return api.stats[key];
    },
    addSpacer() { hud.appendChild(el('div', { class: 'hud-spacer' })); },
    addButton(label, icon, onClick) {
      const b = el('button', { class: 'btn small' }, icon ? icon + ' ' : '', label);
      b.addEventListener('click', onClick);
      hud.appendChild(b);
      return b;
    },
    addPad(icon, onClick) {
      const b = el('button', { class: 'pad-btn', 'aria-label': icon }, icon);
      b.addEventListener('click', onClick);
      pad.appendChild(b);
      return b;
    },
    overlay(title, body, buttons, opts2 = {}) {
      api.closeOverlay();
      const ov = el('div', { class: 'game-overlay' });
      const box = el('div', { class: 'go-box' },
        el('h2', {}, title),
        el('p', {}, body),
        el('div', { class: 'btn-row', style: { justifyContent: 'center' } },
          ...buttons.map(([label, fn, cls]) =>
            el('button', { class: 'btn ' + (cls || 'primary'), onclick: fn }, label))
        )
      );
      if (opts2.dismissible !== false) {
        const dismiss = el('button', { class: 'icon-btn', style: { position: 'absolute', top: '10px', insetInlineEnd: '10px' } }, '✕');
        dismiss.addEventListener('click', () => api.closeOverlay());
        ov.appendChild(dismiss);
      }
      ov.appendChild(box);
      stage.appendChild(ov);
      api.onOverlay?.(true);
      return ov;
    },
    closeOverlay() {
      stage.querySelector('.game-overlay')?.remove();
      api.onOverlay?.(false);
    },
    onOverlay: null,
    canvas(w, h) {
      const c = el('canvas', { width: w, height: h });
      stage.appendChild(c);
      return c;
    },
    destroy() { host.innerHTML = ''; },
  };
  return api;
}

export function vibrate(ms = 15) {
  if (navigator.vibrate) { try { navigator.vibrate(ms); } catch {} }
}
