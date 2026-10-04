// arcade-engine.js
// Small shared toolkit so each arcade game doesn't reinvent canvas setup,
// theming, the game loop, or touch/keyboard input.

const ArcadeUtil = {
  // Read a theme color from CSS variables so games match light/dark mode.
  css(varName, fallback) {
    const v = getComputedStyle(document.body).getPropertyValue(varName).trim();
    return v || fallback;
  },

  // Creates a canvas with a fixed internal resolution that scales to fit its container.
  makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    c.style.width = '100%';
    c.style.maxWidth = w + 'px';
    c.style.display = 'block';
    c.style.margin = '0 auto';
    c.style.touchAction = 'none';
    c.style.borderRadius = '12px';
    c.className = 'arcade-canvas';
    c.addEventListener('contextmenu', e => e.preventDefault());
    return c;
  },

  // requestAnimationFrame loop with delta-time (seconds) passed to fn. Returns a stop function.
  loop(fn) {
    let raf;
    let running = true;
    let last = performance.now();
    function frame(t) {
      if (!running) return;
      const dt = Math.min((t - last) / 1000, 0.05); // clamp so tab-switches don't jump
      last = t;
      fn(dt, t);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => { running = false; cancelAnimationFrame(raf); };
  },

  // Maps pointer/touch events on a canvas to a simple onDown/onMove/onUp callback set,
  // with coordinates converted into the canvas's own internal (unscaled) pixel space.
  bindPointer(canvas, { onDown, onMove, onUp } = {}) {
    function toLocal(e) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
    }
    const down = e => { e.preventDefault(); onDown && onDown(toLocal(e)); };
    const move = e => { e.preventDefault(); onMove && onMove(toLocal(e)); };
    const up = e => { e.preventDefault(); onUp && onUp(toLocal(e)); };
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    return () => {
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointercancel', up);
    };
  },

  // Tracks currently-held keys. Returns { isDown(key), stop() }.
  bindKeys() {
    const held = new Set();
    const down = e => held.add(e.key);
    const up = e => held.delete(e.key);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return {
      isDown: k => held.has(k),
      stop: () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); }
    };
  },

  // Builds a small HUD bar (score / lives / status) above the canvas.
  makeHud() {
    const bar = document.createElement('div');
    bar.className = 'arcade-hud-bar';
    const score = document.createElement('span');
    const status = document.createElement('span');
    bar.appendChild(score);
    bar.appendChild(status);
    return {
      el: bar,
      setScore: text => { score.textContent = text; },
      setStatus: text => { status.textContent = text; }
    };
  },

  // Builds a 4-direction on-screen D-pad for grid games. onDir receives 'up'|'down'|'left'|'right'.
  makeDpad(onDir) {
    const wrap = document.createElement('div');
    wrap.className = 'arcade-dpad';
    const layout = [
      [null, 'up', null],
      ['left', null, 'right'],
      [null, 'down', null]
    ];
    layout.forEach(row => {
      const rowEl = document.createElement('div');
      rowEl.className = 'dpad-row';
      row.forEach(dir => {
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'dpad-btn';
        if (dir) {
          cell.textContent = { up: '\u2191', down: '\u2193', left: '\u2190', right: '\u2192' }[dir];
          cell.onclick = () => onDir(dir);
          cell.addEventListener('contextmenu', e => e.preventDefault());
        } else {
          cell.style.visibility = 'hidden';
        }
        rowEl.appendChild(cell);
      });
      wrap.appendChild(rowEl);
    });
    return wrap;
  },

  // Simple restartable "game over" overlay button, appended inside container.
  makeOverlayButton(label, onClick) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'primary-btn arcade-restart';
    btn.textContent = label;
    btn.onclick = onClick;
    return btn;
  },

  rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  },

  // Friendly placeholder for a game that's registered but not built yet.
  // Every stub game file (see js/games/_stub-template.js) calls this from its
  // mount() so it shows up correctly in the Library and can still be
  // story-gated, even before there's a real game behind it.
  stubScreen(container, opts) {
    opts = opts || {};
    container.innerHTML = `
      <div class="stub-screen">
        <div class="stub-icon">${opts.icon || '\u{1F6E0}\uFE0F'}</div>
        <p class="section-heading" style="margin-top:0;">${opts.title || 'Coming soon'}</p>
        <p class="hint">${opts.note || "This game isn't built yet — check back after a future update."}</p>
      </div>`;
    return { unmount() {} };
  }
};