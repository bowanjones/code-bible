// crossword.js
// A small, hand-authored crossword: a few intersecting words with clues,
// typed directly into the grid boxes (not built from a word bank below).
// Pulls its word list from the current Story beat's own `crossword` field
// when launched from one (word/clue/row/col/dir per entry, row+col measured
// from wherever, direction 'across' or 'down') — so each crossword tests
// only the passage just read. Falls back to a small built-in default for
// free play from the Library.

const DEFAULT_CROSSWORD = [
  { word: 'FRUIT', clue: 'What Eve took from the tree and ate (Genesis 3:6)', row: 0, col: 0, dir: 'across' },
  { word: 'TREE', clue: 'Where the forbidden fruit grew', row: 0, col: 4, dir: 'down' },
  { word: 'EAT', clue: 'What the serpent tempted Eve to do with the fruit', row: 2, col: 4, dir: 'across' }
];

GameRegistry.register({
  id: 'crossword',
  title: 'Crossword',
  sub: 'Type each answer straight into the grid',
  mount(container) {
    const words = (typeof activeStoryBeat !== 'undefined' && activeStoryBeat && activeStoryBeat.crossword && activeStoryBeat.crossword.length)
      ? activeStoryBeat.crossword
      : DEFAULT_CROSSWORD;

    // Normalize to a 0-based bounding box and build a cell map: key "r,c" ->
    // { owners: [wordIndex, ...] }. Intersecting words share a cell (and so
    // share the same <input> element once rendered).
    let minR = 0, maxR = 0, minC = 0, maxC = 0;
    words.forEach(w => {
      const endR = w.dir === 'down' ? w.row + w.word.length - 1 : w.row;
      const endC = w.dir === 'across' ? w.col + w.word.length - 1 : w.col;
      minR = Math.min(minR, w.row); maxR = Math.max(maxR, endR);
      minC = Math.min(minC, w.col); maxC = Math.max(maxC, endC);
    });
    const rows = maxR - minR + 1, cols = maxC - minC + 1;
    const cellKey = (r, c) => r + ',' + c;
    const cells = {};
    words.forEach((w, wi) => {
      for (let i = 0; i < w.word.length; i++) {
        const r = (w.row - minR) + (w.dir === 'down' ? i : 0);
        const c = (w.col - minC) + (w.dir === 'across' ? i : 0);
        const key = cellKey(r, c);
        if (!cells[key]) cells[key] = { owners: [] };
        cells[key].owners.push(wi);
      }
    });
    const wordCells = words.map((w, wi) => {
      const list = [];
      for (let i = 0; i < w.word.length; i++) {
        const r = (w.row - minR) + (w.dir === 'down' ? i : 0);
        const c = (w.col - minC) + (w.dir === 'across' ? i : 0);
        list.push(cellKey(r, c));
      }
      return list;
    });

    const solved = words.map(() => false);
    const cellValues = {}; // key -> single uppercase letter typed so far (or '')
    let cellInputs = {};   // key -> current <input> element (rebuilt each render)
    let selected = words.length ? 0 : -1;
    let score = 0;

    const wrap = document.createElement('div');
    const gridEl = document.createElement('div');
    gridEl.className = 'cw-grid';
    gridEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    const clueListEl = document.createElement('div');
    clueListEl.className = 'cw-clues';
    const actionsEl = document.createElement('div');
    actionsEl.className = 'unscramble-actions';
    const hintBtn = document.createElement('button');
    hintBtn.type = 'button'; hintBtn.className = 'secondary-btn'; hintBtn.textContent = 'Hint';
    actionsEl.appendChild(hintBtn);
    const msgEl = document.createElement('p');
    msgEl.className = 'hint';

    wrap.appendChild(gridEl);
    wrap.appendChild(clueListEl);
    wrap.appendChild(actionsEl);
    wrap.appendChild(msgEl);
    container.appendChild(wrap);

    function nextCellInWord(wi, key) {
      const idx = wordCells[wi].indexOf(key);
      if (idx === -1 || idx + 1 >= wordCells[wi].length) return null;
      return wordCells[wi][idx + 1];
    }
    function prevCellInWord(wi, key) {
      const idx = wordCells[wi].indexOf(key);
      if (idx <= 0) return null;
      return wordCells[wi][idx - 1];
    }
    // Which word "owns" typing in this cell right now: the selected word if
    // it's one of this cell's owners, otherwise its first (unsolved) owner.
    function activeWordFor(key) {
      const owners = cells[key].owners;
      if (selected !== -1 && owners.includes(selected)) return selected;
      const unsolvedOwner = owners.find(wi => !solved[wi]);
      return unsolvedOwner !== undefined ? unsolvedOwner : owners[0];
    }

    function renderClues() {
      clueListEl.innerHTML = '';
      words.forEach((w, wi) => {
        const row = document.createElement('button');
        row.type = 'button';
        row.className = 'cw-clue' + (solved[wi] ? ' cw-clue-solved' : '') + (selected === wi ? ' cw-clue-active' : '');
        row.innerHTML = `<span class="cw-clue-num">${wi + 1}${w.dir === 'across' ? '\u2192' : '\u2193'}</span> ${w.clue}`;
        row.onclick = () => {
          if (solved[wi]) return;
          selected = wi;
          renderClues();
          renderGrid();
          const key = wordCells[wi].find(k => !cellValues[k]) || wordCells[wi][0];
          if (cellInputs[key]) cellInputs[key].focus();
        };
        clueListEl.appendChild(row);
      });
    }

    function renderGrid() {
      gridEl.innerHTML = '';
      cellInputs = {};
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const key = cellKey(r, c);
          const cellDiv = document.createElement('div');
          if (!cells[key]) {
            cellDiv.className = 'cw-cell cw-cell-blank';
            gridEl.appendChild(cellDiv);
            continue;
          }
          const owners = cells[key].owners;
          const isActive = selected !== -1 && owners.includes(selected);
          const isSolved = owners.some(wi => solved[wi]);
          cellDiv.className = 'cw-cell' + (isActive ? ' cw-cell-active' : '') + (isSolved ? ' cw-cell-filled' : '');
          const input = document.createElement('input');
          input.type = 'text';
          input.maxLength = 1;
          input.className = 'cw-input';
          input.autocomplete = 'off';
          input.autocapitalize = 'characters';
          input.inputMode = 'text';
          input.value = cellValues[key] || '';
          input.readOnly = isSolved;
          input.oninput = () => handleInput(key, input);
          input.onkeydown = e => handleKeydown(key, e);
          input.onfocus = () => handleFocus(key);
          cellDiv.appendChild(input);
          gridEl.appendChild(cellDiv);
          cellInputs[key] = input;
        }
      }
    }

    function handleFocus(key) {
      const owners = cells[key].owners;
      if (selected === -1 || !owners.includes(selected) || solved[selected]) {
        const unsolvedOwner = owners.find(wi => !solved[wi]);
        if (unsolvedOwner !== undefined && unsolvedOwner !== selected) {
          selected = unsolvedOwner;
          renderClues();
          renderGrid();
          if (cellInputs[key]) cellInputs[key].focus();
        }
      }
    }

    function handleInput(key, input) {
      const val = (input.value || '').toUpperCase().replace(/[^A-Z]/g, '').slice(-1);
      input.value = val;
      cellValues[key] = val;
      const wi = activeWordFor(key);
      const goNext = val ? nextCellInWord(wi, key) : null;
      checkWord(wi);
      renderGrid();
      if (!solved[wi] && goNext && cellInputs[goNext]) {
        cellInputs[goNext].focus();
      } else if (cellInputs[key] && !solved[wi]) {
        cellInputs[key].focus();
      }
    }

    function handleKeydown(key, e) {
      if (e.key === 'Backspace' && !cellValues[key]) {
        const wi = activeWordFor(key);
        const prev = prevCellInWord(wi, key);
        if (prev) {
          cellValues[prev] = '';
          renderGrid();
          if (cellInputs[prev]) cellInputs[prev].focus();
          e.preventDefault();
        }
      }
    }

    function checkWord(wi) {
      const word = words[wi].word.toUpperCase();
      const filled = wordCells[wi].map(k => cellValues[k] || '');
      if (filled.some(ch => !ch)) return;
      if (filled.join('') === word) {
        solved[wi] = true;
        score++;
        msgEl.textContent = 'Solved!';
        msgEl.style.color = 'var(--good)';
        const nextUnsolved = words.findIndex((w, i) => !solved[i]);
        selected = nextUnsolved;
        renderClues();
        checkAllSolved();
      } else {
        msgEl.textContent = 'Not quite — keep trying.';
        msgEl.style.color = 'var(--bad)';
      }
    }

    hintBtn.onclick = () => {
      if (selected === -1 || solved[selected]) {
        msgEl.textContent = 'Tap an unsolved clue first.';
        return;
      }
      const word = words[selected].word.toUpperCase();
      const wcells = wordCells[selected];
      let idx = -1;
      for (let i = 0; i < wcells.length; i++) {
        if ((cellValues[wcells[i]] || '') !== word[i]) { idx = i; break; }
      }
      if (idx === -1) { msgEl.textContent = 'This one is already correct!'; return; }
      const key = wcells[idx];
      cellValues[key] = word[idx];
      checkWord(selected);
      renderGrid();
      if (cellInputs[key]) cellInputs[key].focus();
      if (!solved[selected]) {
        msgEl.textContent = `Hint: letter ${idx + 1} is "${word[idx]}".`;
        msgEl.style.color = 'var(--brass-deep)';
      }
    };

    function checkAllSolved() {
      if (solved.every(Boolean)) {
        setTimeout(() => {
          wrap.innerHTML = `<div class="quiz-result">
            <div style="font-size:12px;color:var(--ink-soft);text-transform:uppercase;letter-spacing:.05em;">Crossword complete</div>
            <div class="score">${score} / ${words.length}</div>
          </div>`;
          wrap.appendChild(ArcadeUtil.makeOverlayButton('Play again', () => {
            solved.forEach((_, i) => { solved[i] = false; });
            Object.keys(cellValues).forEach(k => delete cellValues[k]);
            selected = words.length ? 0 : -1;
            score = 0;
            wrap.innerHTML = '';
            wrap.appendChild(gridEl);
            wrap.appendChild(clueListEl);
            wrap.appendChild(actionsEl);
            wrap.appendChild(msgEl);
            renderGrid();
            renderClues();
          }));
        }, 400);
      }
    }

    renderGrid();
    renderClues();

    return { unmount() {} };
  }
});