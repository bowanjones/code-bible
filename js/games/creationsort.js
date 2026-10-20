// creationsort.js
// "Sort of Creation" — the Story game for the end of Genesis 1.
// Phase 1: read a short "God said..." quote and name which day it belongs to.
// Phase 2: sort every created thing (light, darkness, sky, land, plants, sun,
// moon, stars, creatures, humans...) into its day, tap-to-select then
// tap-a-bucket, same interaction pattern as the matching game.

const CREATION_SORT_QUOTES = [
  { day: 1, quizLabel: 'Day 1 — Light & Darkness', bucketLabel: 'Day 1', quote: '"And God said, Let there be light: and there was light."' },
  { day: 2, quizLabel: 'Day 2 — Sky & Waters', bucketLabel: 'Day 2', quote: '"And God said, Let there be a firmament in the midst of the waters... and God called the firmament Heaven."' },
  { day: 3, quizLabel: 'Day 3 — Land, Seas & Plants', bucketLabel: 'Day 3', quote: '"And God said, Let the dry land appear... Let the earth bring forth grass, the herb yielding seed, and the fruit tree."' },
  { day: 4, quizLabel: 'Day 4 — Sun, Moon & Stars', bucketLabel: 'Day 4', quote: '"And God said, Let there be lights in the firmament of the heaven... to rule the day, and... the night: he made the stars also."' },
  { day: 5, quizLabel: 'Day 5 — Sea Creatures & Birds', bucketLabel: 'Day 5', quote: '"And God said, Let the waters bring forth abundantly the moving creature that hath life, and fowl that may fly above the earth."' },
  { day: 6, quizLabel: 'Day 6 — Land Animals & People', bucketLabel: 'Day 6', quote: '"And God said, Let us make man in our image, after our likeness... Let the earth bring forth the living creature after his kind."' }
];

const CREATION_SORT_ITEMS = [
  { name: 'Light', day: 1 }, { name: 'Darkness', day: 1 },
  { name: 'Sky (the firmament)', day: 2 }, { name: 'Waters above the sky', day: 2 },
  { name: 'Dry land', day: 3 }, { name: 'Seas', day: 3 }, { name: 'Plants & trees', day: 3 },
  { name: 'Sun', day: 4 }, { name: 'Moon', day: 4 }, { name: 'Stars', day: 4 },
  { name: 'Sea creatures', day: 5 }, { name: 'Birds', day: 5 },
  { name: 'Land animals', day: 6 }, { name: 'Humans', day: 6 }
];

function csShuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

GameRegistry.register({
  id: 'creationsort',
  title: 'Sort of Creation',
  sub: 'Name the day, then sort everything into its place',
  mount(container) {
    let qi = 0, qScore = 0;
    const quizOrder = csShuffle(CREATION_SORT_QUOTES);
    let selectedChip = null;
    let placedCount = 0;
    const bank = csShuffle(CREATION_SORT_ITEMS.map(i => Object.assign({}, i)));
    // Buckets stay in day order (1-6) so sorting isn't also a memory puzzle
    // for where each day landed — only the items to sort are shuffled.
    const bucketOrder = CREATION_SORT_QUOTES;

    function renderQuiz() {
      if (qi >= quizOrder.length) { renderSort(); return; }
      const q = quizOrder[qi];
      // Options always shown in day order (1..6) — only the question order is randomized.
      const options = CREATION_SORT_QUOTES.map(c => c.quizLabel);
      container.innerHTML = `
        <div class="quiz-box">
          <div class="quiz-progress">God said&hellip; &middot; ${qi + 1} of ${quizOrder.length}</div>
          <p class="quiz-q">${q.quote}</p>
          ${options.map(opt => `<button class="quiz-opt" data-opt="${escapeAttr(opt)}">${opt}</button>`).join('')}
        </div>`;
      container.querySelectorAll('.quiz-opt').forEach(btn => {
        btn.onclick = () => {
          const correct = btn.dataset.opt === q.quizLabel;
          container.querySelectorAll('.quiz-opt').forEach(b => {
            b.disabled = true;
            if (b.dataset.opt === q.quizLabel) b.classList.add('correct');
            else if (b === btn) b.classList.add('incorrect');
          });
          if (correct) qScore++;
          setTimeout(() => { qi++; renderQuiz(); }, 800);
        };
      });
    }

    function renderSort() {
      selectedChip = null;
      container.innerHTML = `
        <p class="section-heading" style="margin-top:0;">Now put everything in its place</p>
        <p class="hint" style="margin-top:-4px;">Tap a card below, then tap the day it belongs to.</p>
        <div class="cs-bank" id="csBank"></div>
        <div class="cs-buckets" id="csBuckets"></div>`;
      const bankEl = container.querySelector('#csBank');
      const bucketsEl = container.querySelector('#csBuckets');
      let anyLeft = false;
      bank.forEach(item => {
        if (item.placed) return;
        anyLeft = true;
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'word-chip cs-chip';
        chip.textContent = item.name;
        chip.onclick = () => {
          bankEl.querySelectorAll('.cs-chip').forEach(c => c.classList.remove('selected'));
          chip.classList.add('selected');
          selectedChip = item;
        };
        bankEl.appendChild(chip);
      });
      if (!anyLeft) bankEl.innerHTML = '<p class="hint" style="margin:0;">All sorted!</p>';
      bucketOrder.forEach(d => {
        const bucket = document.createElement('div');
        bucket.className = 'cs-bucket';
        const placedHere = bank.filter(i => i.placed && i.day === d.day).map(i => i.name);
        bucket.innerHTML = `<div class="cs-bucket-label">${d.bucketLabel}</div>
          <div class="cs-bucket-items">${placedHere.map(n => `<span class="cs-placed">&#10003; ${n}</span>`).join('')}</div>`;
        bucket.onclick = () => {
          if (!selectedChip) return;
          if (selectedChip.day === d.day) {
            selectedChip.placed = true;
            placedCount++;
            selectedChip = null;
            renderSort();
            if (placedCount === bank.length) setTimeout(renderDone, 250);
          } else {
            bucket.classList.add('cs-wrong');
            setTimeout(() => bucket.classList.remove('cs-wrong'), 400);
          }
        };
        bucketsEl.appendChild(bucket);
      });
    }

    function renderDone() {
      container.innerHTML = `
        <div class="quiz-result">
          <div style="font-size:12px;color:var(--ink-soft);text-transform:uppercase;letter-spacing:.05em;">Quote round</div>
          <div class="score">${qScore} / ${quizOrder.length}</div>
          <p class="hint">Every part of creation, sorted. &ldquo;And God saw every thing that he had made, and, behold, it was very good.&rdquo;</p>
        </div>`;
      container.appendChild(ArcadeUtil.makeOverlayButton('Play again', () => {
        qi = 0; qScore = 0; placedCount = 0;
        bank.forEach(i => { delete i.placed; });
        renderQuiz();
      }));
    }

    renderQuiz();
    return { unmount() {} };
  }
});