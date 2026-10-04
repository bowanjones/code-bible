// farmplot.js
// "Tend the Ground" — the arcade finale for Cain, Abel & the Line of Adam.
// An overhead (bird's-eye) farm: walk in any direction around a blank
// field, plow, plant, water, and harvest a handful of fenced plots, then
// head up to the store — a real panel with several options at once (sell,
// buy seed, expand the field) rather than one button that just changes
// label.
//
// No time limit. Progress is level-based instead: each level has a coin
// target; reach it and you get a short scripture tied to what unlocked it,
// then either roll straight into the next level (if you've read that far
// in the Story already) or get pointed back to Story to read on and unlock
// it. Coins, seeds, crops, and unlocked plots all carry over between
// levels within a session — nothing resets, the farm just keeps growing.
// "And Cain was a tiller of the ground." (Genesis 4:2)

// Level targets and the Story beat (if any) that must be read before that
// level is reachable. Level 1 has no gate — always playable. Add more
// entries here as later arcs get built, so the game keeps growing with the
// story instead of capping out.
const FARM_LEVELS = [
  { target: 10, gateBeatId: null, ref: 'Genesis 4:2', verse: 'And Cain was a tiller of the ground.' },
  { target: 25, gateBeatId: 'gen6a-read', ref: 'Genesis 6:8', verse: 'But Noah found grace in the eyes of the LORD.' },
  { target: 45, gateBeatId: 'gen6b-read', ref: 'Genesis 6:14', verse: 'Make thee an ark of gopher wood.' },
  { target: 70, gateBeatId: 'gen7-read', ref: 'Genesis 7:16', verse: 'And the LORD shut him in.' },
  { target: 100, gateBeatId: 'gen8-read', ref: 'Genesis 8:11', verse: 'In her mouth was an olive leaf pluckt off: so Noah knew that the waters were abated from off the earth.' },
  { target: 140, gateBeatId: 'gen9-read', ref: 'Genesis 9:13', verse: 'I do set my bow in the cloud, and it shall be for a token of a covenant between me and the earth.' }
];

GameRegistry.register({
  id: 'farmplot',
  title: 'Tend the Ground',
  sub: 'Plow, plant, water, and harvest — level up by reading further in the story',
  mount(container) {
    const VIEW_W = 320, VIEW_H = 320;
    const WORLD_W = 520, WORLD_H = 660;
    const STORE_ZONE_Y = 150;         // store occupies y: 0..STORE_ZONE_Y
    const PLOT_COLS = 4, PLOT_ROWS = 4;
    const PLOT_SPACING_X = 110, PLOT_SPACING_Y = 110;
    const PLOT_ORIGIN_X = 90, PLOT_ORIGIN_Y = 230;
    const PLOT_SIZE = 70;
    const INTERACT_RANGE = 60;
    const SPEED = 150;
    const GROW_MS = 3500;
    const START_SEEDS = 3;
    const SEED_COST = 2;
    const CROP_PRICE = 3;
    const START_UNLOCKED = 2;
    const EXPAND_BASE_COST = 10;
    const EXPAND_COST_STEP = 6;

    const PLOTS = [];
    for (let r = 0; r < PLOT_ROWS; r++) {
      for (let c = 0; c < PLOT_COLS; c++) {
        PLOTS.push({ x: PLOT_ORIGIN_X + c * PLOT_SPACING_X, y: PLOT_ORIGIN_Y + r * PLOT_SPACING_Y });
      }
    }
    const STORE_POS = { x: WORLD_W / 2, y: 70 };

    const hint = document.createElement('p');
    hint.className = 'hint';
    hint.style.margin = '0 0 8px';
    hint.textContent = 'Move with the arrows, or drag on the field. Plow a plot, plant a seed, water it, then come back to harvest. Head up to the store to sell your crops and expand — reach each level\u2019s coin target to level up.';

    const hud = ArcadeUtil.makeHud();
    const canvas = ArcadeUtil.makeCanvas(VIEW_W, VIEW_H);
    const ctx = canvas.getContext('2d');
    const actionBtn = document.createElement('button');
    actionBtn.type = 'button';
    actionBtn.className = 'primary-btn';
    actionBtn.style.marginTop = '10px';
    actionBtn.disabled = true;
    const storePanel = document.createElement('div');
    storePanel.className = 'farm-store-panel';
    storePanel.style.display = 'none';
    const padWrap = document.createElement('div');
    padWrap.className = 'farm-pad';

    container.appendChild(hint);
    container.appendChild(hud.el);
    container.appendChild(canvas);
    container.appendChild(actionBtn);
    container.appendChild(storePanel);
    container.appendChild(padWrap);

    // ---------- 4-direction hold pad (up/down/left/right) ----------
    function makeHoldButton(label, cls) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'dpad-btn ' + cls;
      btn.textContent = label;
      return btn;
    }
    const upBtn = makeHoldButton('\u2191', 'farm-pad-up');
    const leftBtn = makeHoldButton('\u2190', 'farm-pad-left');
    const rightBtn = makeHoldButton('\u2192', 'farm-pad-right');
    const downBtn = makeHoldButton('\u2193', 'farm-pad-down');
    padWrap.appendChild(upBtn);
    padWrap.appendChild(leftBtn);
    padWrap.appendChild(rightBtn);
    padWrap.appendChild(downBtn);

    let moveUp = false, moveDown = false, moveLeft = false, moveRight = false;
    function bindHold(btn, setFlag) {
      const start = e => { e.preventDefault(); setFlag(true); };
      const end = e => { e.preventDefault(); setFlag(false); };
      btn.addEventListener('pointerdown', start);
      btn.addEventListener('pointerup', end);
      btn.addEventListener('pointercancel', end);
      btn.addEventListener('pointerleave', end);
      btn.addEventListener('contextmenu', e => e.preventDefault());
    }
    bindHold(upBtn, v => { moveUp = v; });
    bindHold(downBtn, v => { moveDown = v; });
    bindHold(leftBtn, v => { moveLeft = v; });
    bindHold(rightBtn, v => { moveRight = v; });

    // ---------- swipe/drag-to-move on the canvas itself ----------
    let dragVec = null; // {x, y} normalized, while a touch/drag is active
    let dragAnchor = null;
    function dragStart(x, y) { dragAnchor = { x, y }; dragVec = { x: 0, y: 0 }; }
    function dragMove(x, y) {
      if (!dragAnchor) return;
      const dx = x - dragAnchor.x, dy = y - dragAnchor.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 8) { dragVec = { x: 0, y: 0 }; return; }
      dragVec = { x: dx / dist, y: dy / dist };
    }
    function dragEnd() { dragAnchor = null; dragVec = null; }
    canvas.addEventListener('pointerdown', e => {
      const r = canvas.getBoundingClientRect();
      dragStart(e.clientX - r.left, e.clientY - r.top);
    });
    canvas.addEventListener('pointermove', e => {
      if (!dragAnchor) return;
      const r = canvas.getBoundingClientRect();
      dragMove(e.clientX - r.left, e.clientY - r.top);
    });
    canvas.addEventListener('pointerup', dragEnd);
    canvas.addEventListener('pointercancel', dragEnd);
    canvas.addEventListener('pointerleave', dragEnd);
    canvas.addEventListener('contextmenu', e => e.preventDefault());

    let player, plots, coins, crops, seeds, unlockedCount, level, levelAnnounced, over, growCheckInterval, overlay;
    let best = typeof Storage !== 'undefined' ? Storage.getHighScore('farmplot') : 0;

    function initState() {
      player = { x: PLOT_ORIGIN_X, y: PLOT_ORIGIN_Y + 20 };
      plots = PLOTS.map(() => ({ state: 'empty', readyAt: 0 }));
      coins = 0;
      crops = 0;
      seeds = START_SEEDS;
      unlockedCount = START_UNLOCKED;
      level = 1;
      levelAnnounced = false;
      over = false;
      if (overlay) { overlay.remove(); overlay = null; }
      storePanel.style.display = 'none';
    }

    function gateSatisfied(levelIdx) {
      const gate = FARM_LEVELS[levelIdx].gateBeatId;
      if (!gate) return true;
      return typeof Storage !== 'undefined' && Storage.isBeatComplete(gate);
    }

    function cameraPos() {
      return {
        x: Math.max(0, Math.min(WORLD_W - VIEW_W, player.x - VIEW_W / 2)),
        y: Math.max(0, Math.min(WORLD_H - VIEW_H, player.y - VIEW_H / 2))
      };
    }

    function inStore() {
      return player.y < STORE_ZONE_Y + 30 && Math.hypot(player.x - STORE_POS.x, player.y - STORE_POS.y) < INTERACT_RANGE + 40;
    }

    function nearestPlot() {
      let bestI = null, bestDist = INTERACT_RANGE;
      PLOTS.forEach((pos, i) => {
        if (i >= unlockedCount) return;
        const d = Math.hypot(player.x - pos.x, player.y - pos.y);
        if (d < bestDist) { bestDist = d; bestI = i; }
      });
      return bestI;
    }

    function expandCost() { return EXPAND_BASE_COST + (unlockedCount - START_UNLOCKED) * EXPAND_COST_STEP; }

    function updateHud() {
      hud.setScore('Coins: ' + coins + '   \u2b50 Best: ' + Math.max(best, coins));
      const idx = Math.min(level - 1, FARM_LEVELS.length - 1);
      const target = FARM_LEVELS[idx].target;
      const levelLabel = level > FARM_LEVELS.length ? `Level ${FARM_LEVELS.length} (max so far)` : `Level ${level} \u00b7 ${Math.min(coins, target)}/${target}`;
      hud.setStatus(`${levelLabel} \u00b7 Seeds: ${seeds} \u00b7 Crops: ${crops}`);
    }

    function checkLevelComplete() {
      const idx = level - 1;
      if (idx >= FARM_LEVELS.length || levelAnnounced) return;
      if (coins < FARM_LEVELS[idx].target) return;
      levelAnnounced = true;
      showLevelComplete(idx);
    }

    function showLevelComplete(idx) {
      over = true;
      const isNewBest = typeof Storage !== 'undefined' ? Storage.saveHighScore('farmplot', coins) : false;
      if (isNewBest) best = coins;
      updateHud();
      const nextIdx = idx + 1;
      const hasNextLevel = nextIdx < FARM_LEVELS.length;
      const nextUnlocked = hasNextLevel && gateSatisfied(nextIdx);

      overlay = document.createElement('div');
      overlay.className = 'quiz-result';
      let bodyHtml = `
        <div style="font-size:12px;color:var(--ink-soft);text-transform:uppercase;letter-spacing:.05em;">Level ${level} complete!</div>
        <div class="score">${coins} coins</div>
        ${isNewBest ? '<p style="color:var(--good);font-weight:700;margin:6px 0;">\u2b50 New high score!</p>' : ''}
        <p class="devotional-reflection" style="margin:10px 0;">\u201c${FARM_LEVELS[idx].verse}\u201d \u2014 ${FARM_LEVELS[idx].ref}</p>`;
      if (!hasNextLevel) {
        bodyHtml += '<p class="hint">You\u2019ve reached the highest level built so far \u2014 more will come as the story continues. Keep farming in the meantime!</p>';
      } else if (nextUnlocked) {
        bodyHtml += `<p class="hint">Level ${level + 1} is ready \u2014 keep going!</p>`;
      } else {
        bodyHtml += `<p class="hint">Continue reading in the Story to unlock Level ${level + 1}.</p>`;
      }
      overlay.innerHTML = bodyHtml;

      function resume() {
        overlay.remove();
        overlay = null;
        over = false;
        updateHud();
        updateAction();
      }

      if (hasNextLevel && nextUnlocked) {
        overlay.appendChild(ArcadeUtil.makeOverlayButton(`Continue to Level ${level + 1}`, () => {
          level++;
          levelAnnounced = false;
          resume();
        }));
      } else {
        overlay.appendChild(ArcadeUtil.makeOverlayButton('Keep farming', resume));
        if (hasNextLevel && !nextUnlocked) {
          const storyBtn = document.createElement('button');
          storyBtn.type = 'button';
          storyBtn.className = 'secondary-btn';
          storyBtn.style.marginTop = '8px';
          storyBtn.textContent = 'Go to Story';
          storyBtn.onclick = () => { overlay.remove(); overlay = null; if (typeof showTab === 'function') showTab('story'); };
          overlay.appendChild(storyBtn);
        }
      }
      container.appendChild(overlay);
    }

    function renderStorePanel() {
      storePanel.innerHTML = '';
      const rows = [
        { label: crops > 0 ? `Sell ${crops} crop${crops === 1 ? '' : 's'} (+${crops * CROP_PRICE} coins)` : 'No crops to sell yet',
          disabled: crops === 0,
          onClick: () => { coins += crops * CROP_PRICE; crops = 0; updateHud(); checkLevelComplete(); if (!over) renderStorePanel(); } },
        { label: `Buy 1 seed (\u2212${SEED_COST} coins)`,
          disabled: coins < SEED_COST,
          onClick: () => { coins -= SEED_COST; seeds++; updateHud(); renderStorePanel(); } },
        { label: unlockedCount >= PLOTS.length ? 'Field fully expanded' : `Expand field (\u2212${expandCost()} coins)`,
          disabled: unlockedCount >= PLOTS.length || coins < expandCost(),
          onClick: () => { coins -= expandCost(); unlockedCount++; updateHud(); renderStorePanel(); } }
      ];
      rows.forEach(r => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'secondary-btn farm-store-btn';
        btn.disabled = r.disabled;
        btn.textContent = r.label;
        if (!r.disabled) btn.onclick = r.onClick;
        storePanel.appendChild(btn);
      });
    }

    function updateAction() {
      const atStore = inStore();
      storePanel.style.display = (atStore && !over) ? '' : 'none';
      if (over) { actionBtn.disabled = true; actionBtn.textContent = 'Viewing level results\u2026'; return; }
      if (atStore) { renderStorePanel(); actionBtn.disabled = true; actionBtn.textContent = 'At the store'; return; }
      const pi = nearestPlot();
      if (pi === null) { actionBtn.disabled = true; actionBtn.textContent = 'Walk to a plot or the store'; return; }
      const p = plots[pi];
      if (p.state === 'empty') { actionBtn.disabled = false; actionBtn.textContent = 'Plow'; }
      else if (p.state === 'plowed') { actionBtn.disabled = seeds === 0; actionBtn.textContent = seeds === 0 ? 'Need seeds \u2014 visit the store' : 'Plant seed'; }
      else if (p.state === 'planted') { actionBtn.disabled = false; actionBtn.textContent = 'Water'; }
      else if (p.state === 'growing') { actionBtn.disabled = true; actionBtn.textContent = 'Growing\u2026'; }
      else if (p.state === 'ready') { actionBtn.disabled = false; actionBtn.textContent = 'Harvest'; }
    }

    function doAction() {
      if (over || inStore()) return;
      const pi = nearestPlot();
      if (pi === null) return;
      const p = plots[pi];
      if (p.state === 'empty') p.state = 'plowed';
      else if (p.state === 'plowed' && seeds > 0) { p.state = 'planted'; seeds--; }
      else if (p.state === 'planted') { p.state = 'growing'; p.readyAt = Date.now() + GROW_MS; }
      else if (p.state === 'ready') { p.state = 'empty'; crops++; }
      updateHud();
      updateAction();
    }
    actionBtn.onclick = doAction;

    function tick() {
      const now = Date.now();
      plots.forEach(p => { if (p.state === 'growing' && now >= p.readyAt) p.state = 'ready'; });
    }

    function plotIcon(p) {
      if (p.state === 'plowed') return '\u3030\uFE0F';
      if (p.state === 'planted') return '\u{1FAB1}';
      if (p.state === 'growing') return '\u{1F331}';
      if (p.state === 'ready') return '\u{1F33E}';
      return '';
    }

    function render() {
      const cam = cameraPos();
      const skyStore = ArcadeUtil.css('--brass-tint', '#f1e6d2');
      const skyField = ArcadeUtil.css('--good-tint', '#e3ecdf');
      const ink = ArcadeUtil.css('--ink', '#22303f');
      const brass = ArcadeUtil.css('--brass', '#a9793f');
      const good = ArcadeUtil.css('--good', '#4c7a4c');
      const lineStrong = ArcadeUtil.css('--line-strong', 'rgba(0,0,0,.2)');

      // ground: store strip at top, field below
      const storeScreenBottom = STORE_ZONE_Y - cam.y;
      ctx.fillStyle = skyStore;
      ctx.fillRect(0, 0, VIEW_W, Math.max(0, Math.min(VIEW_H, storeScreenBottom)));
      ctx.fillStyle = skyField;
      ctx.fillRect(0, Math.max(0, Math.min(VIEW_H, storeScreenBottom)), VIEW_W, VIEW_H);

      // store building
      const storeSx = STORE_POS.x - cam.x, storeSy = STORE_POS.y - cam.y;
      if (storeSx > -60 && storeSx < VIEW_W + 60 && storeSy > -60 && storeSy < VIEW_H + 60) {
        ctx.fillStyle = '#8a6b42';
        ctx.fillRect(storeSx - 34, storeSy - 22, 68, 40);
        ctx.fillStyle = '#6b4423';
        ctx.beginPath();
        ctx.moveTo(storeSx - 40, storeSy - 22);
        ctx.lineTo(storeSx, storeSy - 46);
        ctx.lineTo(storeSx + 40, storeSy - 22);
        ctx.closePath();
        ctx.fill();
        ctx.font = '22px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('\u{1F3EA}', storeSx, storeSy + 10);
      }

      // fenced plots
      PLOTS.forEach((pos, i) => {
        const sx = pos.x - cam.x, sy = pos.y - cam.y;
        if (sx < -PLOT_SIZE || sx > VIEW_W + PLOT_SIZE || sy < -PLOT_SIZE || sy > VIEW_H + PLOT_SIZE) return;
        const half = PLOT_SIZE / 2;
        if (i >= unlockedCount) {
          ctx.strokeStyle = lineStrong;
          ctx.setLineDash([4, 4]);
          ctx.lineWidth = 2;
          ctx.strokeRect(sx - half, sy - half, PLOT_SIZE, PLOT_SIZE);
          ctx.setLineDash([]);
          ctx.font = '18px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillStyle = ArcadeUtil.css('--ink-faint', '#93a2ae');
          ctx.fillText('\u{1F512}', sx, sy + 6);
          return;
        }
        const p = plots[i];
        ctx.strokeStyle = '#6b4423';
        ctx.lineWidth = 3;
        ctx.strokeRect(sx - half, sy - half, PLOT_SIZE, PLOT_SIZE);
        ctx.fillStyle = p.state === 'empty' ? '#c9a36a' : '#8a6b42';
        ctx.fillRect(sx - half + 3, sy - half + 3, PLOT_SIZE - 6, PLOT_SIZE - 6);
        const icon = plotIcon(p);
        if (icon) {
          ctx.font = '26px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(icon, sx, sy + 9);
        }
      });

      // player
      const psx = player.x - cam.x, psy = player.y - cam.y;
      ctx.fillStyle = brass;
      ctx.beginPath(); ctx.arc(psx, psy - 10, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(psx - 7, psy - 2, 14, 16);
      ctx.fillStyle = ink;
      ctx.beginPath(); ctx.arc(psx, psy - 11, 1.6, 0, Math.PI * 2); ctx.fill();

      if (!over && (inStore() || nearestPlot() !== null)) {
        ctx.strokeStyle = good;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(psx, psy + 16, 14, 5, 0, 0, Math.PI * 2); ctx.stroke();
      }
    }

    function reset() {
      initState();
      updateHud();
      updateAction();
    }

    function onKeyDown(e) {
      const navKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Spacebar'];
      if (navKeys.includes(e.key)) e.preventDefault();
      if (e.key === 'ArrowUp') moveUp = true;
      else if (e.key === 'ArrowDown') moveDown = true;
      else if (e.key === 'ArrowLeft') moveLeft = true;
      else if (e.key === 'ArrowRight') moveRight = true;
      else if (e.key === ' ' || e.key === 'Spacebar') doAction();
    }
    function onKeyUp(e) {
      if (e.key === 'ArrowUp') moveUp = false;
      else if (e.key === 'ArrowDown') moveDown = false;
      else if (e.key === 'ArrowLeft') moveLeft = false;
      else if (e.key === 'ArrowRight') moveRight = false;
    }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    reset();
    growCheckInterval = setInterval(tick, 250);

    const stop = ArcadeUtil.loop(dt => {
      if (!over) {
        let vx = 0, vy = 0;
        if (dragVec) { vx += dragVec.x; vy += dragVec.y; }
        if (moveLeft) vx -= 1;
        if (moveRight) vx += 1;
        if (moveUp) vy -= 1;
        if (moveDown) vy += 1;
        const mag = Math.hypot(vx, vy);
        if (mag > 0) {
          player.x += (vx / mag) * SPEED * dt;
          player.y += (vy / mag) * SPEED * dt;
          player.x = Math.max(10, Math.min(WORLD_W - 10, player.x));
          player.y = Math.max(10, Math.min(WORLD_H - 10, player.y));
        }
        updateAction();
      }
      render();
    });

    return {
      unmount() {
        stop();
        clearInterval(growCheckInterval);
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
      }
    };
  }
});