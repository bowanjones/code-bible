// games.js
// Rendering + interaction logic for the two game types: matching pairs and quizzes.
// These are pure-ish UI functions — they take data in, return/mutate DOM, and report
// results back via callbacks rather than reaching into app state directly.

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function escapeAttr(s) {
  return String(s).replace(/"/g, '&quot;');
}

function renderMatchingHTML(matching, domId) {
  const left = matching.pairs.map(p => p[0]);
  const right = shuffle(matching.pairs.map(p => p[1]));
  return `
    <p style="font-size:13px; color:var(--ink-soft); margin:0 0 10px;">${matching.prompt}</p>
    <div class="match-grid" id="${domId}">
      <div class="match-col">${left.map(t => `<div class="match-item" data-side="left" data-val="${escapeAttr(t)}">${t}</div>`).join('')}</div>
      <div class="match-col">${right.map(t => `<div class="match-item" data-side="right" data-val="${escapeAttr(t)}">${t}</div>`).join('')}</div>
    </div>`;
}

function bindMatching(domId, matching) {
  const grid = document.getElementById(domId);
  let selectedLeft = null;
  grid.querySelectorAll('.match-item').forEach(item => {
    item.onclick = () => {
      if (item.classList.contains('matched')) return;
      if (item.dataset.side === 'left') {
        grid.querySelectorAll('[data-side="left"]').forEach(el => el.classList.remove('selected'));
        item.classList.add('selected');
        selectedLeft = item;
      } else if (selectedLeft) {
        const leftVal = selectedLeft.dataset.val;
        const correctPair = matching.pairs.find(p => p[0] === leftVal);
        if (correctPair && correctPair[1] === item.dataset.val) {
          selectedLeft.classList.remove('selected');
          selectedLeft.classList.add('matched');
          item.classList.add('matched');
          selectedLeft = null;
        } else {
          item.classList.add('wrong');
          const stuckLeft = selectedLeft;
          setTimeout(() => {
            item.classList.remove('wrong');
            stuckLeft.classList.remove('selected');
            if (selectedLeft === stuckLeft) selectedLeft = null;
          }, 500);
        }
      }
    };
  });
}

// Quiz: renders one question at a time into `mountEl`, tracks score, calls onDone(score) at the end.
function runQuiz(mountEl, quiz, onDone) {
  let i = 0;
  let score = 0;

  function renderQ() {
    if (i >= quiz.length) {
      mountEl.innerHTML = `
        <div class="quiz-box quiz-result">
          <div style="font-size:12px; color:var(--ink-soft); text-transform:uppercase; letter-spacing:0.05em;">Your score</div>
          <div class="score">${score} / ${quiz.length}</div>
        </div>`;
      if (onDone) onDone(score);
      return;
    }
    const q = quiz[i];
    mountEl.innerHTML = `
      <div class="quiz-box">
        <div class="quiz-progress">Question ${i + 1} of ${quiz.length}</div>
        <p class="quiz-q">${q.q}</p>
        ${q.options.map((opt, oi) => `<button class="quiz-opt" data-i="${oi}">${opt}</button>`).join('')}
      </div>`;
    mountEl.querySelectorAll('.quiz-opt').forEach(btn => {
      btn.onclick = () => {
        const oi = parseInt(btn.dataset.i, 10);
        mountEl.querySelectorAll('.quiz-opt').forEach((b, idx) => {
          b.disabled = true;
          if (idx === q.answer) b.classList.add('correct');
          else if (idx === oi) b.classList.add('incorrect');
        });
        if (oi === q.answer) score++;
        setTimeout(() => { i++; renderQ(); }, 900);
      };
    });
  }
  renderQ();
}
