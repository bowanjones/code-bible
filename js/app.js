// app.js
// Navigation + view rendering. Depends on data.js, storage.js, games.js (loaded before this).

const nav = { book: null, chapter: null };
const modeDescriptions = {
  game: 'Game mode: play matching sets and quizzes.',
  read: 'Read mode: notes and chapter review.',
  bible: 'Bible mode: read scripture directly in the app.'
};

function init() {
  Storage.load();
  document.querySelectorAll('.icon-btn[data-mode]').forEach(b => {
    b.onclick = () => setMode(b.dataset.mode);
  });
  document.getElementById('themeToggle').onclick = toggleTheme;
  document.getElementById('backToLibrary').onclick = () => {
    showView('view-library');
    renderLibrary(document.getElementById('bookSearch').value);
  };

// wire up game card clicks after DOM is ready
function wireGameCards() {
  document.querySelectorAll('.game-card').forEach(btn => {
    btn.onclick = () => {
      const g = btn.dataset.game;
      alert('Starting ' + g + ' — placeholder');
      setMode('game');
    };
  });
}
  document.getElementById('backToChapters').onclick = () => {
    const count = BOOKS.find(b => b[0] === nav.book)[1];
    openBook(nav.book, count);
  };
  document.getElementById('bookSearch').oninput = e => renderLibrary(e.target.value);

  document.getElementById('settingsBtn').onclick = () => renderSettings();
  document.getElementById('backFromNotes').onclick = () => { showView('view-library'); renderLibrary(document.getElementById('bookSearch').value); };
  document.getElementById('backFromFriends').onclick = () => { showView('view-library'); renderLibrary(document.getElementById('bookSearch').value); };
  document.getElementById('backFromSettings').onclick = () => {
    showView('view-library');
    renderLibrary(document.getElementById('bookSearch').value);
  };

  applyTheme(Storage.state.theme || 'light');
  setMode(Storage.state.mode || 'game');
  renderLibrary('');
}

function renderSettings() {
  showView('view-settings');
  const grid = document.getElementById('versionGrid');
  grid.innerHTML = '';
  const versions = ['KJV', 'NIV', 'CSB', 'NLT', 'ESV'];
  versions.forEach(version => {
    const btn = document.createElement('button');
    btn.className = `version-btn ${Storage.state.bibleVersion === version ? 'active' : ''}`;
    btn.textContent = version;
    btn.onclick = () => {
      Storage.state.bibleVersion = version;
      Storage.save();
      Bible.cache = {};
      grid.querySelectorAll('.version-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (nav.chapter && Storage.state.mode === 'bible') {
        renderDetail();
      }
    };
    grid.appendChild(btn);
  });
  // mark settings button active
  document.querySelectorAll('.bottom-nav .icon-btn').forEach(b => b.classList.remove('active'));
  const sbtn = document.querySelector('.settings-btn');
  if (sbtn) sbtn.classList.add('active');
}

function setMode(m) {
  Storage.state.mode = m;
  Storage.save();
  // toggle active state for all mode icon buttons
  document.querySelectorAll('.icon-btn[data-mode]').forEach(b => b.classList.toggle('active', b.dataset.mode === m));
  // clear settings active state
  const sbtn = document.querySelector('.settings-btn');
  if (sbtn) sbtn.classList.remove('active');
  document.getElementById('modeHeader').textContent = modeDescriptions[m] || '';
  renderLibrary(document.getElementById('bookSearch').value);
  // show the appropriate view immediately
  if (m === 'game') {
    showView('view-games');
  } else if (m === 'read') {
    showView('view-library');
  } else if (m === 'bible') {
    showView('view-library');
  }
  if (nav.chapter) renderDetail();
}

function renderNotes() {
  showView('view-notes');
  const list = document.getElementById('notesList');
  list.innerHTML = '';
  const keys = Object.keys(Storage.state.notes || {});
  if (keys.length === 0) {
    list.innerHTML = '<p class="hint">No notes yet. Open a chapter in Read mode and add notes.</p>';
    return;
  }
  keys.forEach(k => {
    const div = document.createElement('div');
    div.className = 'link-card';
    div.innerHTML = `<div class="lc-title">${k.replace('-', ' ')}</div><div class="lc-sub">${(Storage.state.notes[k]||'').slice(0,120)}</div>`;
    list.appendChild(div);
  });
}

function renderFriends() {
  showView('view-friends');
}

function applyTheme(theme) {
  document.body.classList.toggle('theme-dark', theme === 'dark');
  Storage.state.theme = theme;
  Storage.save();
  const toggle = document.getElementById('themeToggle');
  if (toggle) toggle.textContent = theme === 'dark' ? 'Light mode' : 'Dark mode';
}

function toggleTheme() {
  applyTheme(Storage.state.theme === 'dark' ? 'light' : 'dark');
}

function showView(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
}

function renderLibrary(filter) {
  const doneCount = Object.keys(Storage.state.progress).filter(k => Storage.state.progress[k]).length;
  document.getElementById('statDone').textContent = `${doneCount} / ${TOTAL_CHAPTERS}`;
  document.getElementById('statStreak').textContent = Storage.state.streak;
  document.getElementById('progressFill').style.width = `${(doneCount / TOTAL_CHAPTERS) * 100}%`;
  const placeholder = Storage.state.mode === 'game'
    ? 'Search for a book to play...'
    : Storage.state.mode === 'read'
      ? 'Search for a book to read and take notes...'
      : 'Search for a book to read scripture...';
  document.getElementById('bookSearch').placeholder = placeholder;

  const list = document.getElementById('bookList');
  list.innerHTML = '';
  BOOKS.forEach(([name, count]) => {
    if (filter && name.toLowerCase().indexOf(filter.toLowerCase()) === -1) return;
    let readInBook = 0;
    for (let c = 1; c <= count; c++) if (Storage.state.progress[Storage.key(name, c)]) readInBook++;
    const row = document.createElement('div');
    row.className = 'row';
    row.onclick = () => openBook(name, count);
    row.innerHTML = `<div class="row-title">${name}</div><div class="row-sub">${readInBook} / ${count}</div><div class="row-arrow">&rsaquo;</div>`;
    list.appendChild(row);
  });
}

function openBook(name, count) {
  nav.book = name;
  document.getElementById('chaptersBookTitle').textContent = name;
  const list = document.getElementById('chapterList');
  list.innerHTML = '';
  for (let c = 1; c <= count; c++) {
    const k = Storage.key(name, c);
    const done = !!Storage.state.progress[k];
    const hasGame = !!Storage.state.gameData[k];
    const row = document.createElement('div');
    row.className = 'row';
    row.onclick = () => openChapter(c);
    row.innerHTML = `
      <div class="chk${done ? ' done' : ''}">${done ? '&#10003;' : ''}</div>
      <div class="row-title">${name} ${c}</div>
      ${hasGame ? '<div class="badge">Game ready</div>' : ''}
      <div class="row-actions" style="display:none;">
        <button class="secondary-btn play-btn">Play</button>
      </div>`;
    list.appendChild(row);
  }
  showView('view-chapters');
  setupChapterObservers();
}

function setupChapterObservers() {
  const list = document.getElementById('chapterList');
  if (!list) return;
  // disconnect previous observer if any
  if (window.__chapterObserver) {
    window.__chapterObserver.disconnect();
  }
  const options = { root: null, rootMargin: '0px', threshold: [0.5] };
  window.__chapterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const el = entry.target;
      const actions = el.querySelector('.row-actions');
      if (entry.intersectionRatio >= 0.5) {
        el.classList.add('expanded');
        if (actions) actions.style.display = 'flex';
      } else {
        el.classList.remove('expanded');
        if (actions) actions.style.display = 'none';
      }
    });
  }, options);
  Array.from(list.children).forEach(child => window.__chapterObserver.observe(child));
  // attach click handlers for play buttons
  list.querySelectorAll('.play-btn').forEach((btn, idx) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const chapter = idx + 1; // assumes rows are in order
      setMode('game');
      openChapter(chapter);
    };
  });
}

function openChapter(c) {
  nav.chapter = c;
  document.getElementById('backLabel').textContent = nav.book;
  document.getElementById('detailTitle').textContent = `${nav.book} ${c}`;
  const k = Storage.key(nav.book, c);
  document.getElementById('detailMeta').textContent = Storage.state.progress[k] ? 'Read' : 'Not read yet';
  renderDetail();
  showView('view-detail');
}

function renderDetail() {
  const k = Storage.key(nav.book, nav.chapter);
  const body = document.getElementById('detailBody');
  const markRow = `<div class="mark-row"><span>Mark as read</span><button class="toggle${Storage.state.progress[k] ? ' on' : ''}" id="markToggle"></button></div>`;

  if (Storage.state.mode === 'read') {
    body.innerHTML = `
      ${markRow}
      <label class="field-label">Notes &amp; explanation</label>
      <textarea id="notesArea" placeholder="Paste in what we discussed for this chapter, or jot your own notes here.">${Storage.state.notes[k] || ''}</textarea>
      <p class="hint">Notes save automatically on this device.</p>
      <button class="primary-btn" id="askBtn">Ask Claude to explain this chapter &rarr;</button>`;
    bindMarkToggle(k);
    document.getElementById('notesArea').oninput = e => Storage.setNotes(nav.book, nav.chapter, e.target.value);
    document.getElementById('askBtn').onclick = () =>
      askClaude(`Please walk me through ${nav.book} ${nav.chapter} verse by verse, the same way you did Genesis 1.`);

  } else if (Storage.state.mode === 'bible') {
    const query = encodeURIComponent(`${nav.book} ${nav.chapter}`);
    body.innerHTML = `
      ${markRow}
      <div class="bible-load-state">Loading ${nav.book} ${nav.chapter}…</div>
      <div class="bible-text" id="bibleText" style="display:none;"></div>
      <p class="hint" id="bibleSourceHint">The text loads inside the app from a public scripture API.</p>`;
    bindMarkToggle(k);
    Bible.fetchChapter(nav.book, nav.chapter)
      .then(data => {
        const mount = document.getElementById('bibleText');
        mount.innerHTML = data.text;
        mount.style.display = 'block';
        document.querySelector('.bible-load-state').style.display = 'none';
        document.getElementById('bibleSourceHint').textContent = `Source: ${data.copyright}`;
      })
      .catch(() => {
        const mount = document.getElementById('bibleText');
        mount.innerHTML = `
          <div class="bible-error">Bible text could not be loaded directly. Use the links below if needed.</div>
          <a class="link-card" href="https://www.biblegateway.com/passage/?search=${query}&version=KJV" target="_blank" rel="noopener">
            <div class="lc-title">Read ${nav.book} ${nav.chapter} on Bible Gateway</div>
            <div class="lc-sub">Opens the full chapter text (KJV) in your browser</div>
          </a>
          <a class="link-card" href="https://www.biblegateway.com/passage/?search=${query}&version=NIV" target="_blank" rel="noopener">
            <div class="lc-title">Read in NIV instead</div>
            <div class="lc-sub">A more modern-English translation</div>
          </a>`;
        mount.style.display = 'block';
        document.querySelector('.bible-load-state').style.display = 'none';
        document.getElementById('bibleSourceHint').textContent = 'Unable to load the scripture text directly right now. Secondary links are provided below.';
      });

  } else {
    // game mode
    const data = Storage.state.gameData[k];
    let html = markRow;
    if (!data) {
      html += `<div class="game-empty">No game built for this chapter yet.<br>Once you and Claude finish discussing it, ask for a game pack and paste it below.</div>`;
    } else {
      data.sections.forEach((sec, si) => {
        html += `<div class="section-block"><p class="section-heading">${sec.heading}</p>${renderMatchingHTML(sec.matching, `match-${si}`)}</div>`;
      });
      html += `<div class="section-block"><p class="section-heading">Quick quiz</p><div id="quizMount"></div></div>`;
    }
    html += `
      <div class="import-box">
        <label class="field-label">Import game pack</label>
        <textarea id="importArea" placeholder="Paste the game data Claude gives you for this chapter here." style="min-height:100px;"></textarea>
        <button class="secondary-btn" id="importBtn">Import</button>
        <button class="primary-btn" id="requestGameBtn">Ask Claude to build a game for this chapter &rarr;</button>
      </div>`;
    body.innerHTML = html;
    bindMarkToggle(k);
    if (data) {
      data.sections.forEach((sec, si) => bindMatching(`match-${si}`, sec.matching));
      runQuiz(document.getElementById('quizMount'), data.quiz);
    }
    document.getElementById('importBtn').onclick = () => {
      const raw = document.getElementById('importArea').value.trim();
      if (!raw) return;
      try {
        Storage.importGamePack(nav.book, nav.chapter, raw);
        renderDetail();
      } catch (e) {
        alert("That didn't look like valid game data. Ask Claude to resend it as JSON.");
      }
    };
    document.getElementById('requestGameBtn').onclick = () =>
      askClaude(`Please build a game pack for ${nav.book} ${nav.chapter}: a couple of short matching games covering the chapter's content, plus a 5 question multiple choice quiz. Give it to me as the JSON format my Bible app uses.`);
  }
}

function bindMarkToggle(k) {
  document.getElementById('markToggle').onclick = function () {
    const nowDone = Storage.markRead(nav.book, nav.chapter);
    document.getElementById('detailMeta').textContent = nowDone ? 'Read' : 'Not read yet';
    this.className = 'toggle' + (nowDone ? ' on' : '');
  };
}

function askClaude(text) {
  window.location.href = 'https://claude.ai/new?q=' + encodeURIComponent(text);
}

document.addEventListener('DOMContentLoaded', init);
document.addEventListener('DOMContentLoaded', () => {
  wireGameCards();
});
