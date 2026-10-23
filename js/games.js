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

// ---------- Library-wide Matching & Quiz ----------
// Chapter game packs (imported via a chapter's Game tab — see app.js
// renderDetail) each hold a few matching sections and a quiz. Rather than
// requiring a bespoke pack for every single chapter (impractical — there
// are thousands of chapters), these two pull together whatever packs
// actually exist into one shared pool, with a toggle for "only chapters
// I've read" vs "everything imported so far."
function gameDataChapterKeys(scope) {
  return Object.keys(Storage.allPacks()).filter(k => scope === 'all' || Storage.state.progress[k]);
}

function emptyPoolMessage(scope, kind) {
  const scopeNote = scope === 'read' ? " from chapters you've read" : '';
  return `<p class="hint">No ${kind} available yet${scopeNote}. Switch to "All chapters," or import a game pack from a chapter's Game tab in the Bible tab."</p>`;
}

GameRegistry.register({
  id: 'matching',
  title: 'Matching',
  sub: 'Match pairs pulled from the chapter game packs',
  mount(container) {
    let scope = 'read';
    const wrap = document.createElement('div');
    container.appendChild(wrap);

    function pool() {
      const pairs = [];
      const packs = Storage.allPacks();
      gameDataChapterKeys(scope).forEach(k => {
        (packs[k].sections || []).forEach(sec => {
          (sec.matching.pairs || []).forEach(p => pairs.push(p));
        });
      });
      return pairs;
    }

    function render() {
      const pairs = pool();
      wrap.innerHTML = `<div class="segmented" id="matchScopeTabs" style="margin-bottom:14px;">
        <button class="seg-btn${scope === 'read' ? ' active' : ''}" data-scope="read">Read chapters</button>
        <button class="seg-btn${scope === 'all' ? ' active' : ''}" data-scope="all">All chapters</button>
      </div>`;
      if (pairs.length < 2) {
        wrap.innerHTML += emptyPoolMessage(scope, 'matching pairs');
      } else {
        const chosen = shuffle(pairs).slice(0, Math.min(8, pairs.length));
        const matching = { prompt: 'Tap a left item, then its match on the right.', pairs: chosen };
        wrap.innerHTML += renderMatchingHTML(matching, 'libMatchGrid') +
          '<button class="secondary-btn" id="matchReshuffle" style="margin-top:14px;">New set</button>';
        bindMatching('libMatchGrid', matching);
        document.getElementById('matchReshuffle').onclick = render;
      }
      wrap.querySelectorAll('#matchScopeTabs .seg-btn').forEach(b => {
        b.onclick = () => { scope = b.dataset.scope; render(); };
      });
    }
    render();
    return { unmount() {} };
  }
});

GameRegistry.register({
  id: 'quiz',
  title: 'Quick Quiz',
  sub: "A mix of questions auto-built from everything you've read",
  mount(container) {
    const wrap = document.createElement('div');
    container.appendChild(wrap);

    function load() {
      wrap.innerHTML = '<p class="hint">Building your quiz&hellip;</p>';
      ChapterQuiz.generateAcrossRead(2, 6).then(qs => {
        if (!qs.length) {
          wrap.innerHTML = '<p class="hint">Read a chapter or two first \u2014 this quiz pulls its questions from what you\u2019ve actually read.</p>';
          return;
        }
        wrap.innerHTML = '';
        const mountEl = document.createElement('div');
        wrap.appendChild(mountEl);
        const retryBtn = document.createElement('button');
        retryBtn.type = 'button';
        retryBtn.className = 'secondary-btn';
        retryBtn.style.marginTop = '14px';
        retryBtn.textContent = 'New set';
        retryBtn.onclick = load;
        runQuiz(mountEl, qs.slice(0, Math.min(8, qs.length)));
        wrap.appendChild(retryBtn);
      }).catch(() => {
        wrap.innerHTML = '<p class="hint">Couldn\u2019t build a quiz right now \u2014 check your connection and try again.</p>';
      });
    }
    load();
    return { unmount() {} };
  }
});