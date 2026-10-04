// wordgames.js
// Three data-driven word/puzzle games (fill-in-the-blank, word search, unscramble)
// plus a bonus memory-match game, all sharing small starter data pools below.
// Add more entries to WORD_GAME_VERSES / WORD_SEARCH_SETS any time — nothing else
// needs to change, each game just draws from the pool.

// KJV text is public domain, safe to ship verbatim.
// `book`/`chapter`/`verse` must match the exact names/numbers used in BOOKS
// (js/data.js) and in Story beats, since fillblank and unscramble both use
// StoryEngine.isVerseRead(book, chapter, verse) to only draw on verses the
// reader has actually reached — no spoiling what's still ahead.
const WORD_GAME_VERSES = [
  { ref: "John 3:16", book: "John", chapter: 3, verse: 16, text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting ___.", answer: "life", options: ["life", "peace", "hope", "grace"] },
  { ref: "Genesis 1:1", book: "Genesis", chapter: 1, verse: 1, text: "In the beginning God created the ___ and the earth.", answer: "heaven", options: ["heaven", "waters", "light", "garden"] },
  { ref: "Genesis 1:27", book: "Genesis", chapter: 1, verse: 27, text: "So God created man in his own image, in the image of God created he him; male and ___ created he them.", answer: "female", options: ["female", "spirit", "flesh", "likeness"] },
  { ref: "Genesis 2:24", book: "Genesis", chapter: 2, verse: 24, text: "Therefore shall a man leave his father and his mother, and shall cleave unto his wife: and they shall be one ___.", answer: "flesh", options: ["flesh", "spirit", "body", "house"] },
  { ref: "Genesis 3:15", book: "Genesis", chapter: 3, verse: 15, text: "And I will put enmity between thee and the woman, and between thy seed and her seed; it shall bruise thy head, and thou shalt bruise his ___.", answer: "heel", options: ["heel", "hand", "foot", "heart"] },
  { ref: "Genesis 4:7", book: "Genesis", chapter: 4, verse: 7, text: "If thou doest well, shalt thou not be accepted? and if thou doest not well, sin lieth at the ___.", answer: "door", options: ["door", "gate", "table", "window"] },
  { ref: "Genesis 4:9", book: "Genesis", chapter: 4, verse: 9, text: "And the LORD said unto Cain, Where is Abel thy brother? And he said, I know not: Am I my brother's ___?", answer: "keeper", options: ["keeper", "servant", "friend", "helper"] },
  { ref: "Genesis 5:24", book: "Genesis", chapter: 5, verse: 24, text: "And Enoch ___ with God: and he was not; for God took him.", answer: "walked", options: ["walked", "lived", "dwelt", "stayed"] },
  { ref: "Psalm 23:1", book: "Psalms", chapter: 23, verse: 1, text: "The LORD is my shepherd; I shall not ___.", answer: "want", options: ["want", "fear", "fall", "fail"] },
  { ref: "Joshua 1:9", book: "Joshua", chapter: 1, verse: 9, text: "Be strong and of a good courage; be not afraid, neither be thou ___.", answer: "dismayed", options: ["dismayed", "silent", "weary", "hidden"] },
  { ref: "Philippians 4:13", book: "Philippians", chapter: 4, verse: 13, text: "I can do all things through ___ which strengtheneth me.", answer: "Christ", options: ["Christ", "prayer", "faith", "grace"] },
  { ref: "Proverbs 3:5", book: "Proverbs", chapter: 3, verse: 5, text: "Trust in the LORD with all thine ___; and lean not unto thine own understanding.", answer: "heart", options: ["heart", "soul", "mind", "strength"] },
  { ref: "Romans 8:28", book: "Romans", chapter: 8, verse: 28, text: "And we know that all things work together for ___ to them that love God.", answer: "good", options: ["good", "grace", "peace", "gain"] },
  { ref: "Jeremiah 29:11", book: "Jeremiah", chapter: 29, verse: 11, text: "For I know the thoughts that I think toward you, thoughts of ___, and not of evil.", answer: "peace", options: ["peace", "power", "joy", "hope"] },
  { ref: "Matthew 6:33", book: "Matthew", chapter: 6, verse: 33, text: "But seek ye first the kingdom of God, and his ___; and all these things shall be added unto you.", answer: "righteousness", options: ["righteousness", "glory", "mercy", "wisdom"] },
  { ref: "Psalm 119:105", book: "Psalms", chapter: 119, verse: 105, text: "Thy word is a lamp unto my feet, and a light unto my ___.", answer: "path", options: ["path", "eyes", "soul", "way"] },
  { ref: "Isaiah 41:10", book: "Isaiah", chapter: 41, verse: 10, text: "Fear thou not; for I am with thee: be not dismayed; for I am thy ___.", answer: "God", options: ["God", "shield", "rock", "king"] },
  { ref: "1 Corinthians 13:4", book: "1 Corinthians", chapter: 13, verse: 4, text: "Charity suffereth long, and is kind; charity envieth not; charity vaunteth not itself, is not puffed ___.", answer: "up", options: ["up", "out", "away", "down"] }
];

// Whether a verse is fair game right now. When launched from a specific
// Story beat (activeStoryBeat set — see app.js), this is anchored to THAT
// beat's own position in the campaign, so replaying an earlier game always
// shows only what had been read by that point, no matter how much has been
// read since. Outside Story mode (free play from the Library) there's no
// specific spot to anchor to, so it falls back to "read at all, anywhere."
function isVersePlayable(v) {
  if (typeof StoryEngine === 'undefined') return true;
  if (typeof activeStoryBeat !== 'undefined' && activeStoryBeat) {
    return StoryEngine.isVerseAvailableForBeat(v.book, v.chapter, v.verse, activeStoryBeat.id);
  }
  return StoryEngine.isVerseRead(v.book, v.chapter, v.verse);
}

const WORD_SEARCH_SETS = [
  { name: "Fruit of the Spirit", words: ["LOVE", "JOY", "PEACE", "PATIENCE", "KINDNESS", "GOODNESS", "FAITH", "GENTLENESS"] },
  { name: "Creation Week", words: ["LIGHT", "SKY", "LAND", "SEAS", "SUN", "MOON", "STARS", "ADAM", "EVE"] },
  { name: "Names for Jesus", words: ["SAVIOR", "SHEPHERD", "LAMB", "MESSIAH", "REDEEMER", "LION", "VINE", "LIGHT"] }
];

const MEMORY_MATCH_ICONS = ["\u2721", "\u{1F54A}", "\u2693", "\u{1F41F}", "\u{1F3FA}", "\u{1F31F}", "\u{1F41A}", "\u{1F338}"];

function wgShuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------- Fill in the blank ----------
GameRegistry.register({
  id: 'fillblank',
  title: 'Fill in the Blank',
  sub: 'Complete the verse — tap the missing word',
  mount(container) {
    // Only draw from verses that are fair game right now — anchored to this
    // beat's own position in the story if launched from one, so replaying
    // an earlier stop never leaks in verses read since. Same rule as
    // Scripture Unscramble.
    const readPool = WORD_GAME_VERSES.filter(isVersePlayable);
    const order = wgShuffle(readPool);
    let i = 0, score = 0;
    const box = document.createElement('div');
    box.className = 'quiz-box';
    container.appendChild(box);

    function render() {
      if (order.length === 0) {
        box.innerHTML = `<div class="quiz-result">
          <div style="font-size:12px;color:var(--ink-soft);text-transform:uppercase;letter-spacing:.05em;">Nothing to fill in yet</div>
          <p class="hint">Read a bit more first — this game only pulls verses from what you've already read.</p>
        </div>`;
        return;
      }
      if (i >= order.length) {
        box.innerHTML = `<div class="quiz-result"><div style="font-size:12px;color:var(--ink-soft);text-transform:uppercase;letter-spacing:.05em;">Your score</div><div class="score">${score} / ${order.length}</div></div>`;
        box.appendChild(ArcadeUtil.makeOverlayButton('Play again', () => { i = 0; score = 0; render(); }));
        return;
      }
      const v = order[i];
      box.innerHTML = `
        <div class="quiz-progress">Verse ${i + 1} of ${order.length} &middot; ${v.ref}</div>
        <p class="quiz-q">${v.text}</p>
        ${wgShuffle(v.options).map(opt => `<button class="quiz-opt" data-opt="${opt}">${opt}</button>`).join('')}`;
      box.querySelectorAll('.quiz-opt').forEach(btn => {
        btn.onclick = () => {
          const correct = btn.dataset.opt === v.answer;
          box.querySelectorAll('.quiz-opt').forEach(b => {
            b.disabled = true;
            if (b.dataset.opt === v.answer) b.classList.add('correct');
            else if (b === btn) b.classList.add('incorrect');
          });
          if (correct) score++;
          setTimeout(() => { i++; render(); }, 900);
        };
      });
    }
    render();
    return { unmount() {} };
  }
});

// ---------- Word search ----------
function buildWordSearchGrid(words, size) {
  const grid = Array.from({ length: size }, () => Array(size).fill(null));
  const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
  const placed = [];
  words.forEach(word => {
    // Every word gets its own untouched cells — no crossing through another
    // word's letters, even where they'd happen to coincide. That keeps each
    // word's path unambiguous instead of accidentally tracing through a
    // different word placed nearby.
    for (let attempt = 0; attempt < 200; attempt++) {
      const [dx, dy] = dirs[Math.floor(Math.random() * dirs.length)];
      const x0 = dx === 1 ? Math.floor(Math.random() * (size - word.length + 1))
        : dx === -1 ? Math.floor(Math.random() * (size - word.length + 1)) + word.length - 1
        : Math.floor(Math.random() * size);
      const y0 = dy === 1 ? Math.floor(Math.random() * (size - word.length + 1)) : Math.floor(Math.random() * size);
      let ok = true;
      const cells = [];
      for (let k = 0; k < word.length; k++) {
        const x = x0 + dx * k, y = y0 + dy * k;
        if (x < 0 || x >= size || y < 0 || y >= size) { ok = false; break; }
        if (grid[y][x]) { ok = false; break; } // any occupied cell disqualifies this placement
        cells.push({ x, y });
      }
      if (ok) {
        cells.forEach((c, k) => { grid[c.y][c.x] = word[k]; });
        placed.push({ word, cells });
        break;
      }
    }
  });
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    if (!grid[y][x]) grid[y][x] = letters[Math.floor(Math.random() * letters.length)];
  }
  return { grid, placed };
}

GameRegistry.register({
  id: 'wordsearch',
  title: 'Word Search',
  sub: 'Tap the first and last letter of each hidden word',
  mount(container) {
    const size = 13;
    // If this was launched from a Story beat that specifies its own word
    // set (words drawn only from the passage just read), use that instead
    // of a random general-purpose set — keeps the puzzle tied to what's
    // actually been read so far, same principle as Fill in the Blank and
    // Scripture Unscramble.
    const fromBeat = (typeof activeStoryBeat !== 'undefined' && activeStoryBeat && activeStoryBeat.wordSet)
      ? activeStoryBeat.wordSet
      : null;
    const set = fromBeat || WORD_SEARCH_SETS[Math.floor(Math.random() * WORD_SEARCH_SETS.length)];
    const { grid, placed } = buildWordSearchGrid(set.words, size);
    // Only words that actually made it onto the grid count — with fully
    // disjoint placement a very long word could in rare cases fail to find
    // room; falling back to `set.words` here would list something with no
    // way to ever find it.
    const wordList = placed.map(p => p.word);
    const found = new Set();
    let firstPick = null;

    const wrap = document.createElement('div');
    wrap.innerHTML = `<p class="quiz-progress">${set.name}</p>`;
    const list = document.createElement('p');
    list.className = 'hint';
    const table = document.createElement('div');
    table.className = 'wordsearch-grid';
    table.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    container.appendChild(wrap);
    wrap.appendChild(list);
    wrap.appendChild(table);

    function key(x, y) { return x + ',' + y; }

    function cellsBetween(a, b) {
      const dx = Math.sign(b.x - a.x), dy = Math.sign(b.y - a.y);
      const len = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y)) + 1;
      // must be a straight line (horizontal/vertical/diagonal)
      if (a.x !== b.x && a.y !== b.y && Math.abs(b.x - a.x) !== Math.abs(b.y - a.y)) return null;
      const cells = [];
      for (let k = 0; k < len; k++) cells.push({ x: a.x + dx * k, y: a.y + dy * k });
      return cells;
    }

    function updateWordList() {
      list.textContent = wordList.map(w => found.has(w) ? `\u2713 ${w}` : w).join('   ');
    }

    function renderGrid() {
      table.innerHTML = '';
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
        const btn = document.createElement('button');
        btn.className = 'ws-cell';
        btn.textContent = grid[y][x];
        btn.dataset.x = x; btn.dataset.y = y;
        btn.onclick = () => handlePick(x, y, btn);
        table.appendChild(btn);
      }
    }

    function handlePick(x, y, el) {
      if (!firstPick) {
        firstPick = { x, y, el };
        el.classList.add('selected');
        return;
      }
      const cells = cellsBetween(firstPick, { x, y });
      const revCells = cells ? cells.slice().reverse() : null;
      let match = null;
      if (cells) {
        const word1 = cells.map(c => grid[c.y][c.x]).join('');
        const word2 = revCells.map(c => grid[c.y][c.x]).join('');
        match = placed.find(p => !found.has(p.word) && (p.word === word1 || p.word === word2));
      }
      if (match) {
        found.add(match.word);
        match.cells.forEach(c => {
          const cellEl = table.children[c.y * size + c.x];
          cellEl.classList.remove('selected');
          cellEl.classList.add('found');
        });
        updateWordList();
        if (found.size === wordList.length) {
          setTimeout(() => {
            wrap.appendChild(ArcadeUtil.makeOverlayButton('Nice! Play again', () => { container.innerHTML = ''; container.appendChild(mount2()); }));
          }, 200);
        }
      } else {
        firstPick.el.classList.remove('selected');
      }
      firstPick = null;
    }

    function mount2() {
      const d = document.createElement('div');
      const inst = GameRegistry.get('wordsearch').mount(d);
      return d;
    }

    updateWordList();
    renderGrid();
    return { unmount() {} };
  }
});

// ---------- Rebuild the Verse (word order) ----------
GameRegistry.register({
  id: 'versebuilder',
  title: 'Rebuild the Verse',
  sub: 'Tap the words in the right order to rebuild the verse',
  mount(container) {
    // Only draw from verses that are fair game right now — anchored to this
    // beat's own position in the story if launched from one, so replaying
    // an earlier stop never leaks in verses read since. Same rule as
    // Fill in the Blank.
    const readPool = WORD_GAME_VERSES.filter(isVersePlayable);
    const order = wgShuffle(readPool.map(v => ({ ref: v.ref, text: v.text.replace('___', v.answer) })));
    let vi = 0, score = 0;
    const box = document.createElement('div');
    box.className = 'quiz-box';
    container.appendChild(box);

    function render() {
      if (order.length === 0) {
        box.innerHTML = `<div class="quiz-result">
          <div style="font-size:12px;color:var(--ink-soft);text-transform:uppercase;letter-spacing:.05em;">Nothing to unscramble yet</div>
          <p class="hint">Read a chapter or two in the Bible tab first — this game only pulls verses from chapters you've already marked read.</p>
        </div>`;
        return;
      }
      if (vi >= order.length) {
        box.innerHTML = `<div class="quiz-result"><div style="font-size:12px;color:var(--ink-soft);text-transform:uppercase;letter-spacing:.05em;">Verses rebuilt</div><div class="score">${score} / ${order.length}</div></div>`;
        box.appendChild(ArcadeUtil.makeOverlayButton('Play again', () => { vi = 0; score = 0; render(); }));
        return;
      }
      const v = order[vi];
      const words = v.text.replace(/\./g, '').split(' ');
      const bank = wgShuffle(words);
      let hintsUsed = 0;
      box.innerHTML = `<div class="quiz-progress">${v.ref}</div>
        <div class="unscramble-answer" id="uAnswer"></div>
        <div class="unscramble-bank" id="uBank"></div>
        <p class="unscramble-hintcount" id="uHintCount"></p>
        <div class="unscramble-actions">
          <button class="secondary-btn" id="uReset" type="button">Clear</button>
          <button class="secondary-btn" id="uHint" type="button">Hint</button>
          <button class="primary-btn" id="uCheck" type="button">Check</button>
        </div>
        <p class="hint" id="uMsg"></p>`;
      const answerEl = box.querySelector('#uAnswer');
      const bankEl = box.querySelector('#uBank');
      const msgEl = box.querySelector('#uMsg');
      const hintCountEl = box.querySelector('#uHintCount');

      // Reads the answer directly off the DOM (rather than a parallel array)
      // so it can never drift out of sync with what's actually on screen,
      // even when a verse repeats the same word more than once.
      function currentAnswer() {
        return Array.from(answerEl.children).map(el => el.textContent);
      }

      // Colors each placed word green if it's in the right spot, red if not —
      // so you can see what's correct so far as you build the verse.
      function refreshFeedback() {
        const current = currentAnswer();
        Array.from(answerEl.children).forEach((el, idx) => {
          el.classList.remove('correct-pos', 'wrong-pos');
          el.classList.add(current[idx] === words[idx] ? 'correct-pos' : 'wrong-pos');
        });
      }

      function chip(word, fromBank) {
        const c = document.createElement('button');
        c.type = 'button';
        c.className = 'word-chip';
        c.textContent = word;
        c.onclick = () => {
          c.remove();
          if (fromBank) answerEl.appendChild(chip(word, false));
          else bankEl.appendChild(chip(word, true));
          msgEl.textContent = '';
          refreshFeedback();
        };
        return c;
      }
      bank.forEach(w => bankEl.appendChild(chip(w, true)));

      function finishIfComplete(viaHint) {
        const current = currentAnswer();
        const solved = current.length === words.length && current.every((w, idx) => w === words[idx]);
        if (!solved) return false;
        msgEl.textContent = viaHint ? 'All filled in — nice work piecing it together!' : 'Correct!';
        msgEl.style.color = 'var(--good)';
        score++;
        setTimeout(() => { vi++; render(); }, viaHint ? 1200 : 900);
        return true;
      }

      box.querySelector('#uReset').onclick = () => { render(); };

      // Hint: checks what's correct so far, left to right. If the next slot
      // is empty or holds the wrong word, it (and anything after it) goes
      // back to the bank, then the correct word for that slot is placed.
      // Tapping Hint repeatedly walks the whole verse into place one word
      // at a time.
      box.querySelector('#uHint').onclick = () => {
        const current = currentAnswer();
        let idx = 0;
        while (idx < current.length && current[idx] === words[idx]) idx++;
        if (idx >= words.length) {
          msgEl.textContent = "You've already got it all!";
          msgEl.style.color = 'var(--good)';
          return;
        }
        const answerChildren = Array.from(answerEl.children);
        for (let k = answerChildren.length - 1; k >= idx; k--) {
          const el = answerChildren[k];
          el.remove();
          bankEl.appendChild(chip(el.textContent, true));
        }
        const correctWord = words[idx];
        const bankChip = Array.from(bankEl.children).find(el => el.textContent === correctWord);
        if (bankChip) bankChip.remove();
        const placed = chip(correctWord, false);
        placed.classList.add('hinted');
        answerEl.appendChild(placed);

        hintsUsed++;
        hintCountEl.textContent = `Hints used: ${hintsUsed}`;
        refreshFeedback();

        if (!finishIfComplete(true)) {
          msgEl.textContent = `Hint: word ${idx + 1} is "${correctWord}".`;
          msgEl.style.color = 'var(--brass-deep)';
        }
      };

      box.querySelector('#uCheck').onclick = () => {
        if (finishIfComplete(false)) return;
        msgEl.textContent = 'Not quite — try again, or tap Hint or Clear.';
        msgEl.style.color = 'var(--bad)';
      };
    }
    render();
    return { unmount() {} };
  }
});

// ---------- Unscramble (letters) ----------
// A classic word-scramble: the letters of one key word get shuffled, tap
// them in order to spell it correctly. Pulls from the current Story beat's
// own `scrambleWords` list when launched from one — so it only ever tests
// vocabulary from the passage just read — falling back to a small built-in
// set for free play from the Library.
const DEFAULT_SCRAMBLE_WORDS = ['CREATION', 'GARDEN', 'SERPENT', 'PROMISE', 'COVENANT'];

GameRegistry.register({
  id: 'unscramble',
  title: 'Unscramble',
  sub: 'Tap the letters in order to spell the word',
  mount(container) {
    const words = (typeof activeStoryBeat !== 'undefined' && activeStoryBeat && activeStoryBeat.scrambleWords && activeStoryBeat.scrambleWords.length)
      ? activeStoryBeat.scrambleWords
      : DEFAULT_SCRAMBLE_WORDS;
    const order = wgShuffle(words.slice());
    let wi = 0, score = 0;
    const box = document.createElement('div');
    box.className = 'quiz-box';
    container.appendChild(box);

    function scrambledLetters(word) {
      let letters, tries = 0;
      do {
        letters = wgShuffle(word.split(''));
        tries++;
      } while (letters.join('') === word && word.length > 1 && tries < 20);
      return letters;
    }

    function render() {
      if (wi >= order.length) {
        box.innerHTML = `<div class="quiz-result"><div style="font-size:12px;color:var(--ink-soft);text-transform:uppercase;letter-spacing:.05em;">Words unscrambled</div><div class="score">${score} / ${order.length}</div></div>`;
        box.appendChild(ArcadeUtil.makeOverlayButton('Play again', () => { wi = 0; score = 0; render(); }));
        return;
      }
      const word = order[wi];
      const letters = scrambledLetters(word);
      let hintsUsed = 0;
      box.innerHTML = `<div class="quiz-progress">WORD ${wi + 1} OF ${order.length}</div>
        <div class="unscramble-answer" id="uAnswer"></div>
        <div class="unscramble-bank" id="uBank"></div>
        <p class="unscramble-hintcount" id="uHintCount"></p>
        <div class="unscramble-actions">
          <button class="secondary-btn" id="uReset" type="button">Clear</button>
          <button class="secondary-btn" id="uHint" type="button">Hint</button>
          <button class="primary-btn" id="uCheck" type="button">Check</button>
        </div>
        <p class="hint" id="uMsg"></p>`;
      const answerEl = box.querySelector('#uAnswer');
      const bankEl = box.querySelector('#uBank');
      const msgEl = box.querySelector('#uMsg');
      const hintCountEl = box.querySelector('#uHintCount');

      function currentAnswer() {
        return Array.from(answerEl.children).map(el => el.textContent);
      }

      function refreshFeedback() {
        const current = currentAnswer();
        Array.from(answerEl.children).forEach((el, idx) => {
          el.classList.remove('correct-pos', 'wrong-pos');
          el.classList.add(current[idx] === word[idx] ? 'correct-pos' : 'wrong-pos');
        });
      }

      function chip(letter, fromBank) {
        const c = document.createElement('button');
        c.type = 'button';
        c.className = 'word-chip';
        c.textContent = letter;
        c.onclick = () => {
          c.remove();
          if (fromBank) answerEl.appendChild(chip(letter, false));
          else bankEl.appendChild(chip(letter, true));
          msgEl.textContent = '';
          refreshFeedback();
        };
        return c;
      }
      letters.forEach(l => bankEl.appendChild(chip(l, true)));

      function finishIfComplete(viaHint) {
        const current = currentAnswer();
        const solved = current.length === word.length && current.join('') === word;
        if (!solved) return false;
        msgEl.textContent = viaHint ? 'All filled in — nice work!' : 'Correct!';
        msgEl.style.color = 'var(--good)';
        score++;
        setTimeout(() => { wi++; render(); }, viaHint ? 1200 : 900);
        return true;
      }

      box.querySelector('#uReset').onclick = () => { render(); };

      box.querySelector('#uHint').onclick = () => {
        const current = currentAnswer();
        let idx = 0;
        while (idx < current.length && current[idx] === word[idx]) idx++;
        if (idx >= word.length) {
          msgEl.textContent = "You've already got it all!";
          msgEl.style.color = 'var(--good)';
          return;
        }
        const answerChildren = Array.from(answerEl.children);
        for (let k = answerChildren.length - 1; k >= idx; k--) {
          const el = answerChildren[k];
          el.remove();
          bankEl.appendChild(chip(el.textContent, true));
        }
        const correctLetter = word[idx];
        const bankChip = Array.from(bankEl.children).find(el => el.textContent === correctLetter);
        if (bankChip) bankChip.remove();
        const placed = chip(correctLetter, false);
        placed.classList.add('hinted');
        answerEl.appendChild(placed);

        hintsUsed++;
        hintCountEl.textContent = `Hints used: ${hintsUsed}`;
        refreshFeedback();

        if (!finishIfComplete(true)) {
          msgEl.textContent = `Hint: letter ${idx + 1} is "${correctLetter}".`;
          msgEl.style.color = 'var(--brass-deep)';
        }
      };

      box.querySelector('#uCheck').onclick = () => {
        if (finishIfComplete(false)) return;
        msgEl.textContent = 'Not quite — try again, or tap Hint or Clear.';
        msgEl.style.color = 'var(--bad)';
      };
    }
    render();
    return { unmount() {} };
  }
});
GameRegistry.register({
  id: 'memorymatch',
  title: 'Memory Match',
  sub: 'Flip two cards at a time to find every pair',
  mount(container) {
    const icons = wgShuffle(MEMORY_MATCH_ICONS.concat(MEMORY_MATCH_ICONS));
    let firstIdx = null, lock = false, foundCount = 0, moves = 0;
    const hud = ArcadeUtil.makeHud();
    hud.setStatus('Moves: 0');
    container.appendChild(hud.el);
    const grid = document.createElement('div');
    grid.className = 'memory-grid';
    container.appendChild(grid);

    const cards = icons.map((icon, idx) => {
      const c = document.createElement('button');
      c.type = 'button';
      c.className = 'memory-card';
      c.textContent = '?';
      c.onclick = () => flip(idx);
      grid.appendChild(c);
      return c;
    });

    function flip(idx) {
      if (lock || cards[idx].classList.contains('flipped') || cards[idx].classList.contains('matched')) return;
      cards[idx].textContent = icons[idx];
      cards[idx].classList.add('flipped');
      if (firstIdx === null) { firstIdx = idx; return; }
      moves++;
      hud.setStatus('Moves: ' + moves);
      if (icons[firstIdx] === icons[idx] && firstIdx !== idx) {
        cards[firstIdx].classList.add('matched');
        cards[idx].classList.add('matched');
        firstIdx = null;
        foundCount++;
        if (foundCount === icons.length / 2) {
          hud.setStatus(`Solved in ${moves} moves!`);
          container.appendChild(ArcadeUtil.makeOverlayButton('Play again', () => { container.innerHTML = ''; GameRegistry.get('memorymatch').mount(container); }));
        }
      } else {
        lock = true;
        const a = firstIdx, b = idx;
        setTimeout(() => {
          cards[a].textContent = '?'; cards[a].classList.remove('flipped');
          cards[b].textContent = '?'; cards[b].classList.remove('flipped');
          firstIdx = null; lock = false;
        }, 700);
      }
    }
    return { unmount() {} };
  }
});