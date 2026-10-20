// connectdots.js
// Connect the Dots — tap the numbered dots in order to reveal the picture.
// A calm, no-time-pressure puzzle in the same family as the word games.
// Shapes are generated with simple geometry (star, rainbow, sun) rather than
// hand-traced art, so they're guaranteed to come out looking right.

function cdStarPoints(cx, cy, outerR, innerR, spikes) {
  const pts = [];
  for (let i = 0; i < spikes * 2; i++) {
    const angle = -90 + i * (360 / (spikes * 2));
    const r = i % 2 === 0 ? outerR : innerR;
    pts.push({ x: cx + r * Math.cos(angle * Math.PI / 180), y: cy + r * Math.sin(angle * Math.PI / 180) });
  }
  return pts;
}
function cdRainbowPoints() {
  const pts = [];
  const cx = 50, cy = 80, R = 42;
  for (let i = 0; i <= 8; i++) {
    const angle = 180 - i * (180 / 8);
    pts.push({ x: cx + R * Math.cos(angle * Math.PI / 180), y: cy - R * Math.sin(angle * Math.PI / 180) });
  }
  return pts;
}
function cdCirclePoints(cx, cy, r, n) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const angle = -90 + i * (360 / n);
    pts.push({ x: cx + r * Math.cos(angle * Math.PI / 180), y: cy + r * Math.sin(angle * Math.PI / 180) });
  }
  return pts;
}

// Every shape's `points` array is already in the correct tap order (1, 2, 3...
// as generated). `closed: true` draws a final line back to point 1 once the
// last dot is connected, to close the outline (a star or a sun should close;
// a rainbow arc should not).
const CONNECT_DOTS_SHAPES = [
  { name: 'The Stars', caption: '\u201cHe made the stars also.\u201d \u2014 Genesis 1:16', points: cdStarPoints(50, 46, 40, 16, 5), closed: true },
  { name: 'The Rainbow', caption: '\u201cI do set my bow in the cloud.\u201d \u2014 Genesis 9:13', points: cdRainbowPoints(), closed: false },
  { name: 'The Sun', caption: '\u201cThe greater light to rule the day.\u201d \u2014 Genesis 1:16', points: cdCirclePoints(50, 50, 38, 12), closed: true }
];

GameRegistry.register({
  id: 'connectdots',
  title: 'Connect the Dots',
  sub: 'Tap the dots in order, 1 to the end, to reveal the picture',
  mount(container) {
    const SIZE = 320;
    let shapeIndex = Math.floor(Math.random() * CONNECT_DOTS_SHAPES.length);
    let next = 1;
    let nextBtn = null;

    const wrap = document.createElement('div');
    const msgEl = document.createElement('p');
    msgEl.className = 'hint';
    msgEl.style.textAlign = 'center';
    container.appendChild(wrap);
    container.appendChild(msgEl);

    function toPx(p) { return { x: p.x / 100 * SIZE, y: p.y / 100 * SIZE }; }

    function showNextButton() {
      if (nextBtn) return;
      nextBtn = ArcadeUtil.makeOverlayButton('Next picture', () => {
        shapeIndex = (shapeIndex + 1) % CONNECT_DOTS_SHAPES.length;
        next = 1;
        render();
      });
      container.appendChild(nextBtn);
    }
    function removeNextButton() {
      if (nextBtn) { nextBtn.remove(); nextBtn = null; }
    }

    function handleTap(num) {
      if (num === next) {
        next++;
        render();
      } else if (num > next) {
        msgEl.textContent = `Not yet \u2014 find dot ${next} first.`;
        msgEl.style.color = 'var(--bad)';
        setTimeout(() => { msgEl.style.color = ''; render(); }, 700);
      }
    }

    function render() {
      const shape = CONNECT_DOTS_SHAPES[shapeIndex];
      const pts = shape.points;
      const inkFaint = ArcadeUtil.css('--ink-faint', '#93a2ae');
      const brass = ArcadeUtil.css('--brass', '#a9793f');
      const good = ArcadeUtil.css('--good', '#4c7a4c');
      const line = ArcadeUtil.css('--line-strong', 'rgba(0,0,0,.2)');
      const inputBg = ArcadeUtil.css('--input-bg', '#fff');

      let linesSvg = '';
      // Only draw a segment once BOTH its endpoints have actually been
      // tapped. i goes up to next-2 (not next-1) so the very last confirmed
      // segment ends at dot (next-1) — the last dot actually tapped so far
      // — never at dot `next` itself, which is still waiting to be tapped.
      for (let i = 1; i < next - 1; i++) {
        const a = toPx(pts[i - 1]), b = toPx(pts[i]);
        linesSvg += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${good}" stroke-width="2.5" stroke-linecap="round" />`;
      }
      if (next > pts.length && shape.closed) {
        const a = toPx(pts[pts.length - 1]), b = toPx(pts[0]);
        linesSvg += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${good}" stroke-width="2.5" stroke-linecap="round" />`;
      }

      let dotsSvg = '';
      pts.forEach((p, i) => {
        const num = i + 1;
        const done = num < next;
        const px = toPx(p);
        const fill = done ? good : inputBg;
        const stroke = done ? good : (num === next ? brass : line);
        dotsSvg += `<g class="cd-dot" data-num="${num}" style="cursor:${done ? 'default' : 'pointer'};">
          <circle cx="${px.x}" cy="${px.y}" r="10" fill="${fill}" stroke="${stroke}" stroke-width="2" />
          ${done ? '' : `<text x="${px.x}" y="${px.y + 4}" text-anchor="middle" font-size="10" font-weight="700" fill="${num === next ? brass : inkFaint}">${num}</text>`}
        </g>`;
      });

      wrap.innerHTML = `<svg viewBox="0 0 ${SIZE} ${SIZE}" width="100%" style="max-width:340px; display:block; margin:0 auto;">
        ${linesSvg}
        ${dotsSvg}
      </svg>`;

      wrap.querySelectorAll('.cd-dot').forEach(g => {
        const num = parseInt(g.dataset.num, 10);
        g.onclick = () => handleTap(num);
      });

      if (next > pts.length) {
        msgEl.innerHTML = `<strong style="color:var(--good);">${shape.name}!</strong><br>${shape.caption}`;
        showNextButton();
      } else {
        msgEl.textContent = `Find dot ${next} of ${pts.length}.`;
        removeNextButton();
      }
    }

    render();
    return { unmount() {} };
  }
});