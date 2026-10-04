// gardentrail.js
// "Garden Trail" — the arcade finale for the Creation & the Garden arc.
// A Snake-and-apple spinoff themed to Genesis 2-3: wind through the garden
// gathering the fruit God gave freely (every fruit you eat makes your trail
// grow), while ONE tree's fruit — glowing, unmistakable — is never to be
// touched. Touch it, or the wall, or your own trail, and the round ends.
// "Of every tree of the garden thou mayest freely eat: But of the tree of
// the knowledge of good and evil, thou shalt not eat of it." (Genesis 2:16-17)

GameRegistry.register({
  id: 'gardentrail',
  title: 'Garden Trail',
  sub: 'Eat the good fruit freely — but stay clear of the tree of the knowledge of good and evil.',
  mount(container) {
    const CELL = 20, COLS = 17, ROWS = 17;

    const hint = document.createElement('p');
    hint.className = 'hint';
    hint.style.margin = '0 0 10px';
    hint.textContent = 'Use the arrows (or arrow keys) to move. Eat the good fruit to grow — but the tree of the knowledge of good and evil is not to be touched.';

    const hud = ArcadeUtil.makeHud();
    const canvas = ArcadeUtil.makeCanvas(COLS * CELL, ROWS * CELL);
    const ctx = canvas.getContext('2d');

    container.appendChild(hint);
    container.appendChild(hud.el);
    container.appendChild(canvas);

    let snake, dir, nextDir, fruit, forbidden, score, fruitEaten, alive, tickMs, acc, overlay;
    let best = typeof Storage !== 'undefined' ? Storage.getHighScore('gardentrail') : 0;

    function occupiedBySnake(x, y) {
      return snake.some(s => s.x === x && s.y === y);
    }

    function randomCell(avoid) {
      let x, y, tries = 0;
      do {
        x = Math.floor(Math.random() * COLS);
        y = Math.floor(Math.random() * ROWS);
        tries++;
      } while (tries < 300 && (occupiedBySnake(x, y) || (avoid && x === avoid.x && y === avoid.y)));
      return { x, y };
    }

    function placeFruit() { fruit = randomCell(forbidden); }
    function placeForbidden() { forbidden = randomCell(fruit); }

    function reset() {
      snake = [{ x: 8, y: 9 }, { x: 7, y: 9 }, { x: 6, y: 9 }];
      dir = { x: 1, y: 0 };
      nextDir = { x: 1, y: 0 };
      score = 0;
      fruitEaten = 0;
      alive = true;
      tickMs = 150;
      acc = 0;
      if (overlay) { overlay.remove(); overlay = null; }
      placeFruit();
      placeForbidden();
      updateHud();
    }

    function updateHud() {
      hud.setScore('Fruit gathered: ' + score + '   \u2b50 Best: ' + Math.max(best, score));
      hud.setStatus(alive ? '' : 'Game over');
    }

    function trySetDir(dx, dy) {
      if (!alive) return;
      // No reversing straight back into your own trail.
      if (snake.length > 1 && dx === -dir.x && dy === -dir.y) return;
      nextDir = { x: dx, y: dy };
    }

    function step() {
      dir = nextDir;
      const head = snake[0];
      const nx = head.x + dir.x, ny = head.y + dir.y;

      if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) return gameOver('wall');
      if (occupiedBySnake(nx, ny)) return gameOver('self');
      if (forbidden && nx === forbidden.x && ny === forbidden.y) return gameOver('forbidden');

      snake.unshift({ x: nx, y: ny });
      let grew = false;
      if (nx === fruit.x && ny === fruit.y) {
        score++;
        fruitEaten++;
        grew = true;
        placeFruit();
        if (fruitEaten % 5 === 0) placeForbidden();
        tickMs = Math.max(90, 150 - fruitEaten * 3);
      }
      if (!grew) snake.pop();
      updateHud();
    }

    function gameOver(reason) {
      alive = false;
      const isNewBest = typeof Storage !== 'undefined' ? Storage.saveHighScore('gardentrail', score) : false;
      if (isNewBest) best = score;
      updateHud();
      const messages = {
        wall: "You wandered past the garden's edge.",
        self: 'You tangled in your own trail.',
        forbidden: '\u201cOf every tree of the garden thou mayest freely eat: but of the tree of the knowledge of good and evil, thou shalt not eat of it: for in the day that thou eatest thereof thou shalt surely die.\u201d (Genesis 2:16-17) You touched it.'
      };
      setTimeout(() => {
        overlay = document.createElement('div');
        overlay.className = 'quiz-result';
        overlay.innerHTML = `
          <div style="font-size:12px;color:var(--ink-soft);text-transform:uppercase;letter-spacing:.05em;">Garden Trail</div>
          <div class="score">${score}</div>
          ${isNewBest ? '<p style="color:var(--good);font-weight:700;margin:0 0 6px;">\u2b50 New high score!</p>' : `<p class="hint" style="margin:0 0 6px;">Best: ${best}</p>`}
          <p class="hint">${messages[reason] || ''}</p>`;
        overlay.appendChild(ArcadeUtil.makeOverlayButton('Play again', reset));
        container.appendChild(overlay);
      }, 60);
    }

    // The tree of the knowledge of good and evil — not a fruit, since it's
    // the tree itself that's not to be touched (Genesis 2:16-17).
    function drawTree(gx, gy, canopyColor, glow) {
      const cx = gx * CELL + CELL / 2, cy = gy * CELL + CELL / 2;
      const r = CELL * 0.34;
      // trunk
      ctx.fillStyle = '#6b4423';
      ctx.fillRect(cx - r * 0.16, cy + r * 0.1, r * 0.32, r * 0.9);
      // canopy — a small cluster of circles for a fuller foliage shape
      ctx.save();
      if (glow) { ctx.shadowColor = canopyColor; ctx.shadowBlur = 10; }
      ctx.fillStyle = canopyColor;
      ctx.beginPath(); ctx.arc(cx, cy - r * 0.25, r * 0.85, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx - r * 0.55, cy, r * 0.55, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + r * 0.55, cy, r * 0.55, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    function drawApple(gx, gy, bodyColor, glow) {
      const cx = gx * CELL + CELL / 2, cy = gy * CELL + CELL / 2;
      const r = CELL * 0.33;
      ctx.save();
      if (glow) { ctx.shadowColor = bodyColor; ctx.shadowBlur = 10; }
      // body — two overlapping circles for a slight apple-ish dimple at top
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.arc(cx - r * 0.42, cy + r * 0.12, r * 0.72, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + r * 0.42, cy + r * 0.12, r * 0.72, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      // stem
      ctx.strokeStyle = '#6b4423';
      ctx.lineWidth = Math.max(1.3, r * 0.2);
      ctx.beginPath();
      ctx.moveTo(cx, cy - r * 0.55);
      ctx.lineTo(cx + r * 0.25, cy - r * 1.15);
      ctx.stroke();
      // leaf
      ctx.fillStyle = '#4c7a4c';
      ctx.beginPath();
      ctx.ellipse(cx + r * 0.7, cy - r * 0.95, r * 0.4, r * 0.2, -0.6, 0, Math.PI * 2);
      ctx.fill();
      // highlight
      ctx.fillStyle = 'rgba(255,255,255,0.32)';
      ctx.beginPath();
      ctx.ellipse(cx - r * 0.3, cy - r * 0.05, r * 0.22, r * 0.34, -0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawSnake() {
      const bodyColor = ArcadeUtil.css('--brass-deep', '#7c581f');
      const headColor = ArcadeUtil.css('--brass', '#a9793f');
      const r = CELL * 0.42;

      // Body first (tail to just before head), so the head draws on top.
      for (let i = snake.length - 1; i >= 1; i--) {
        const s = snake[i];
        const cx = s.x * CELL + CELL / 2, cy = s.y * CELL + CELL / 2;
        const shrink = i === snake.length - 1 ? 0.78 : 1; // slightly tapered tail tip
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.arc(cx, cy, r * shrink, 0, Math.PI * 2);
        ctx.fill();
      }

      // Head
      const head = snake[0];
      const hx = head.x * CELL + CELL / 2, hy = head.y * CELL + CELL / 2;
      ctx.fillStyle = headColor;
      ctx.beginPath();
      ctx.arc(hx, hy, r * 1.05, 0, Math.PI * 2);
      ctx.fill();

      // Eyes — perpendicular to the direction of travel, forward-biased.
      const perpX = -dir.y, perpY = dir.x;
      const eyeForward = r * 0.35, eyeOffset = r * 0.42;
      [-1, 1].forEach(side => {
        const ex = hx + dir.x * eyeForward + perpX * eyeOffset * side;
        const ey = hy + dir.y * eyeForward + perpY * eyeOffset * side;
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(ex, ey, r * 0.24, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath(); ctx.arc(ex + dir.x * r * 0.08, ey + dir.y * r * 0.08, r * 0.12, 0, Math.PI * 2); ctx.fill();
      });

      // A flicking forked tongue out the front, alive only while moving.
      if (alive && Math.floor(Date.now() / 260) % 2 === 0) {
        ctx.strokeStyle = '#b3392a';
        ctx.lineWidth = 1.4;
        const baseX = hx + dir.x * r, baseY = hy + dir.y * r;
        const tipX = hx + dir.x * r * 1.9, tipY = hy + dir.y * r * 1.9;
        ctx.beginPath(); ctx.moveTo(baseX, baseY); ctx.lineTo(tipX, tipY); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(tipX, tipY); ctx.lineTo(tipX + perpX * 3.5 + dir.x * 2, tipY + perpY * 3.5 + dir.y * 2);
        ctx.moveTo(tipX, tipY); ctx.lineTo(tipX - perpX * 3.5 + dir.x * 2, tipY - perpY * 3.5 + dir.y * 2);
        ctx.stroke();
      }
    }

    function render() {
      const bg = ArcadeUtil.css('--parchment-raised', '#f7f8f3');
      const line = ArcadeUtil.css('--line', 'rgba(0,0,0,.1)');
      const good = ArcadeUtil.css('--good', '#4c7a4c');
      const bad = ArcadeUtil.css('--bad', '#a8452f');

      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = line;
      ctx.lineWidth = 1;
      for (let x = 0; x <= COLS; x++) { ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, ROWS * CELL); ctx.stroke(); }
      for (let y = 0; y <= ROWS; y++) { ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(COLS * CELL, y * CELL); ctx.stroke(); }

      if (fruit) drawApple(fruit.x, fruit.y, good, false);
      if (forbidden) drawTree(forbidden.x, forbidden.y, bad, true);

      drawSnake();
    }

    function handleDir(d) {
      if (d === 'up') trySetDir(0, -1);
      else if (d === 'down') trySetDir(0, 1);
      else if (d === 'left') trySetDir(-1, 0);
      else if (d === 'right') trySetDir(1, 0);
    }
    const dpad = ArcadeUtil.makeDpad(handleDir);
    container.appendChild(dpad);

    function onKeyDown(e) {
      const navKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Spacebar'];
      if (navKeys.includes(e.key)) e.preventDefault(); // stop the page itself from scrolling
      if (e.key === 'ArrowUp') trySetDir(0, -1);
      else if (e.key === 'ArrowDown') trySetDir(0, 1);
      else if (e.key === 'ArrowLeft') trySetDir(-1, 0);
      else if (e.key === 'ArrowRight') trySetDir(1, 0);
      else if (e.key === ' ' || e.key === 'Spacebar') { if (!alive) reset(); }
    }
    window.addEventListener('keydown', onKeyDown);

    reset();
    const stop = ArcadeUtil.loop(dt => {
      if (alive) {
        acc += dt * 1000;
        while (acc >= tickMs && alive) { step(); acc -= tickMs; }
      }
      render();
    });

    return {
      unmount() {
        stop();
        window.removeEventListener('keydown', onKeyDown);
      }
    };
  }
});