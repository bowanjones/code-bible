// app.js
// Top-level navigation and view rendering. Loaded last, after every other script.
//
// Responsibilities (see README "Project structure"):
//   - bottom-nav tab switching (Bible, Library, Story, Friends, Settings)
//   - the Bible tab: book list -> chapter list -> chapter detail (Notes / Scripture / Game)
//   - the Library tab: games grid, devotionals, saved notes
//   - the Story reading screen, and the bridge that lets a Story beat open a
//     chapter or a game and mark itself complete when you're done
//   - Settings (version, theme, text size, export/import/reset) and Friends
//
// Globals other files expect from this one:
//   showView, showTab, goToChapterTab, openStoryRead, openArcadeGame,
//   splitChapterKey, and `activeStoryBeat` (read by wordgames.js / crossword.js).

const BIBLE_VERSIONS = ['KJV', 'NIV', 'CSB', 'NLT', 'ESV'];

// The beat the player launched the current game from, or null for free play.
// Games check `typeof activeStoryBeat` so this MUST stay a top-level binding.
let activeStoryBeat = null;

const nav = {
  tab: 'story',        // which bottom-nav tab is highlighted
  prevTab: 'story',    // where Settings' back button returns to
  hubTab: 'games',
  book: null,
  chapter: null,
  detailTab: 'scripture',
  detailBeat: null,    // chapter-game beat (matching/quiz) that opened the detail view
  detailBack: null     // optional override for the detail view's back button
};

let lastStoryListView = 'view-story';   // 'view-story' | 'view-arc' — where Story back buttons return
let storyReadBeat = null;
let storyReadWasComplete = false;
let storyReadTab = 'scripture';
let currentGame = null;                 // { instance } while a game is mounted
let arcadeReturn = { tab: 'hub', beat: null };
let hubSort = 'newest';

// ---------- small helpers ----------

function $(id) { return document.getElementById(id); }

// "1 Samuel-10" -> ["1 Samuel", 10]. Split on the LAST dash so book names
// with digits/spaces survive.
function splitChapterKey(key) {
  const i = key.lastIndexOf('-');
  return [key.slice(0, i), parseInt(key.slice(i + 1), 10)];
}

function bookIndex(book) {
  return BOOKS.findIndex(b => b[0] === book);
}

function chapterCount(book) {
  const b = BOOKS.find(x => x[0] === book);
  return b ? b[1] : 0;
}

function escapeText(s) {
  return Bible.escapeHtml(String(s == null ? '' : s));
}

// [1,2,3,5] -> "1-3, 5"
function formatVerseList(nums) {
  const sorted = Array.from(new Set(nums)).sort((a, b) => a - b);
  const parts = [];
  let start = null, prev = null;
  sorted.forEach(n => {
    if (start === null) { start = prev = n; return; }
    if (n === prev + 1) { prev = n; return; }
    parts.push(start === prev ? `${start}` : `${start}-${prev}`);
    start = prev = n;
  });
  if (start !== null) parts.push(start === prev ? `${start}` : `${start}-${prev}`);
  return parts.join(', ');
}

let toastTimer = null;
function toast(message) {
  let el = $('appToast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'appToast';
    el.style.cssText = 'position:fixed; left:50%; bottom:110px; transform:translateX(-50%); max-width:86%; ' +
      'background:var(--ink); color:var(--parchment); padding:10px 16px; border-radius:10px; font-size:13px; ' +
      'z-index:40000; box-shadow:0 8px 24px rgba(0,0,0,.25); text-align:center; display:none;';
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.style.display = 'block';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.style.display = 'none'; }, 2600);
}

// Native share sheet when available, clipboard otherwise. Resolves to a short
// description of what happened so callers can tell the user.
async function shareOrCopy(payload) {
  if (navigator.share) {
    try {
      await navigator.share(payload);
      return 'shared';
    } catch (e) {
      if (e && e.name === 'AbortError') return 'cancelled';
      /* fall through to clipboard */
    }
  }
  const text = [payload.text, payload.url].filter(Boolean).join('\n');
  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch (e) {
    window.prompt('Copy this to share:', text);
    return 'prompted';
  }
}

// ---------- view / tab switching ----------

function showView(id) {
  // Leaving the arcade view always tears down the running game.
  if (id !== 'view-arcade') unmountCurrentGame();
  if (typeof VerseNotes !== 'undefined') VerseNotes.closeNotePopover();

  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  $(id).classList.add('active');
  $('storyReadNextBar').style.display = id === 'view-story-read' ? 'flex' : 'none';
  if (id === 'view-story' || id === 'view-arc') lastStoryListView = id;
  window.scrollTo(0, 0);
}

function setActiveNav(tab) {
  nav.tab = tab;
  document.querySelectorAll('.bottom-nav .icon-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tab);
  });
}

function showTab(tab) {
  if (tab === 'settings' && nav.tab !== 'settings') nav.prevTab = nav.tab;
  activeStoryBeat = null;
  setActiveNav(tab);
  switch (tab) {
    case 'bible':
      renderLibrary($('bookSearch').value);
      showView('view-library');
      break;
    case 'hub':
      renderHub();
      showView('view-hub');
      break;
    case 'friends':
      renderFriends();
      showView('view-friends');
      break;
    case 'settings':
      renderSettings();
      showView('view-settings');
      break;
    case 'story':
    default:
      setActiveNav('story');
      renderStoryHome();
      showView('view-story');
      maybeAskForVersion();
      break;
  }
}

// ---------- theme & text size ----------

function applyTheme(theme) {
  document.body.classList.toggle('theme-dark', theme === 'dark');
  Storage.state.theme = theme;
  Storage.save();
  const label = theme === 'dark' ? 'Light mode' : 'Dark mode';
  ['themeToggle', 'themeToggleSettings'].forEach(id => { if ($(id)) $(id).textContent = label; });
}

function toggleTheme() {
  applyTheme(Storage.state.theme === 'dark' ? 'light' : 'dark');
}

function applyTextSize(size) {
  document.body.classList.remove('text-small', 'text-large');
  if (size === 'small') document.body.classList.add('text-small');
  if (size === 'large') document.body.classList.add('text-large');
  Storage.state.textSize = size;
  Storage.save();
  document.querySelectorAll('#textSizeTabs .seg-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.size === size);
  });
}

// ---------- Bible version ----------

function fillVersionGrid(grid, onPick) {
  grid.innerHTML = '';
  Bible.versionChoices(BIBLE_VERSIONS).forEach(version => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'version-btn' + (Bible.activeVersion() === version ? ' active' : '');
    btn.textContent = version;
    btn.onclick = () => onPick(version, grid);
    grid.appendChild(btn);
  });
}

function setBibleVersion(version) {
  Storage.state.bibleVersion = version;
  Storage.state.versionChosen = true;
  Storage.save();
  Bible.cache = {};
}

// Asked once, the first time Story mode is opened.
function maybeAskForVersion() {
  if (Storage.state.versionChosen) return;
  const modal = $('versionModal');
  fillVersionGrid($('versionModalGrid'), (version) => {
    setBibleVersion(version);
    modal.style.display = 'none';
  });
  modal.style.display = 'flex';
}

// =====================================================================
// STORY
// =====================================================================

// Bridge used by story.js: open the Story reading screen for a read/summary beat.
function openStoryRead(book, chapter, beat) {
  storyReadBeat = beat;
  storyReadWasComplete = StoryEngine.isBeatComplete(beat);
  storyReadTab = 'scripture';
  activeStoryBeat = null;

  const isSummary = beat.type === 'summary';
  $('storyReadTitle').textContent = isSummary ? beat.label : `${book} ${chapter}`;
  $('storyReadLabel').textContent = isSummary ? 'Chapter recap' : beat.label;

  const tabs = $('storyReadTabs');
  const btnScripture = tabs.querySelector('[data-tab="scripture"]');
  const btnDevotional = tabs.querySelector('[data-tab="devotional"]');
  const btnNotes = tabs.querySelector('[data-tab="notes"]');
  btnScripture.textContent = isSummary ? 'Recap' : 'Scripture';
  btnDevotional.style.display = beat.devotional ? '' : 'none';
  btnNotes.style.display = isSummary ? 'none' : '';

  // "Catch up" only appears when revisiting an already-completed stop —
  // and not when this stop IS where the reader left off.
  const nextUp = StoryEngine.nextUp();
  const isLeftOffSpot = nextUp && nextUp.beat.id === beat.id;
  $('storyReadCatchUpBtn').style.display = (storyReadWasComplete && !isLeftOffSpot) ? 'block' : 'none';

  renderStoryReadTab();
  showView('view-story-read');
}

function renderStoryReadTab() {
  const beat = storyReadBeat;
  const body = $('storyReadBody');
  document.querySelectorAll('#storyReadTabs .seg-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === storyReadTab);
  });

  if (storyReadTab === 'devotional') {
    renderDevotionalEditor(body, beat);
    return;
  }

  if (beat.type === 'summary') {
    body.innerHTML = `<div class="devotional-reflection">${escapeText(beat.recap || '')}</div>`;
    return;
  }

  const [book, chapter] = beat.chapters[0];
  if (storyReadTab === 'notes') {
    VerseNotes.renderPanel(body, book, chapter);
  } else {
    VerseNotes.renderScripture(body, book, chapter, beat.verses || null);
  }
}

function devotionalMeta(beat) {
  const first = beat.chapters && beat.chapters[0];
  return {
    book: first ? first[0] : null,
    chapter: first ? first[1] : null,
    verses: beat.verses || null,
    label: beat.label,
    question: beat.devotional ? beat.devotional.question : ''
  };
}

// Reflection + guided question + a textarea whose contents are saved per-beat.
function renderDevotionalEditor(container, beat, onSaved) {
  const dev = beat.devotional;
  if (!dev) { container.innerHTML = '<p class="hint">No devotional for this stop.</p>'; return; }
  const saved = Storage.getDevotional(beat.id);
  container.innerHTML = `
    <div class="devotional-reflection">${escapeText(dev.reflection)}</div>
    <label class="field-label" style="margin-top:18px;">Reflect</label>
    <p style="font-size:14px; line-height:1.5; margin:0 0 10px;">${escapeText(dev.question)}</p>
    <textarea id="devotionalText" placeholder="Write your response here&hellip;">${escapeText(saved ? saved.text : '')}</textarea>
    <button class="primary-btn" id="devotionalSaveBtn" type="button">Save response</button>
    <p class="hint" id="devotionalStatus"></p>`;
  $('devotionalSaveBtn').onclick = () => {
    const text = $('devotionalText').value;
    const entry = Storage.saveDevotional(beat.id, devotionalMeta(beat), text);
    $('devotionalStatus').textContent = entry ? 'Saved. You can find it in Library \u203A Notes.' : 'Cleared.';
    if (onSaved) onSaved(entry);
  };
}

function completeReadBeat(beat) {
  if (beat.type === 'read' && beat.chapters) {
    // Only a whole-chapter beat or the last segment of a split chapter flips
    // the chapter's real read-progress.
    if (!beat.verses || beat.lastSegment) {
      const [book, chapter] = beat.chapters[0];
      if (!Storage.state.progress[Storage.key(book, chapter)]) Storage.markRead(book, chapter);
    }
  }
  Storage.completeBeat(beat.id);
}

function storyReadNext() {
  const beat = storyReadBeat;
  if (!beat) { showTab('story'); return; }
  if (!storyReadWasComplete) completeReadBeat(beat);
  // Walk forward from THIS stop (not to wherever the reader actually left
  // off — that's what "Catch up" is for). For a first-time read these are
  // the same place.
  const after = beatImmediatelyAfter(beat.id);
  if (after) runBeatAction(after.beat);
  else showTab('story');
}

function storyReadCatchUp() {
  const next = StoryEngine.nextUp();
  if (next) runBeatAction(next.beat);
  else showTab('story');
}

// Returns to whichever Story list the reader came from (home or an arc's
// beat list). If a beat is given and we're returning to an arc list, make
// sure it's THAT beat's arc (a "Next" chain can cross into the following arc).
function goBackToStoryList(beat) {
  activeStoryBeat = null;
  if (beat && lastStoryListView === 'view-arc') {
    const loc = findBeatLocation(beat.id);
    if (loc) currentArcIndex = loc.arcIndex;
  }
  if (lastStoryListView === 'view-arc' && currentArcIndex !== null) {
    renderArcBeats();
    setActiveNav('story');
    showView('view-arc');
  } else {
    showTab('story');
  }
}

// =====================================================================
// BIBLE TAB: books -> chapters -> chapter detail
// =====================================================================

function renderLibrary(filter) {
  const doneKeys = Object.keys(Storage.state.progress).filter(k => Storage.state.progress[k]);
  const list = $('bookList');
  const q = (filter || '').trim().toLowerCase();
  list.innerHTML = '';

  const header = document.createElement('div');
  header.innerHTML = `
    <div class="progress-track"><div class="progress-fill" style="width:${(doneKeys.length / TOTAL_CHAPTERS * 100).toFixed(1)}%"></div></div>
    <p class="hint" style="margin-top:0;">${doneKeys.length} of ${TOTAL_CHAPTERS} chapters read</p>`;
  list.appendChild(header);

  const readByBook = {};
  doneKeys.forEach(k => {
    const [book] = splitChapterKey(k);
    readByBook[book] = (readByBook[book] || 0) + 1;
  });

  let shown = 0;
  BOOKS.forEach(([book, count]) => {
    if (q && !book.toLowerCase().includes(q)) return;
    shown++;
    const read = readByBook[book] || 0;
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = `
      <div class="chk${read === count ? ' done' : ''}">${read === count ? '&#10003;' : ''}</div>
      <div style="flex:1;">
        <div class="row-title">${escapeText(book)}</div>
        <div class="row-sub">${count} chapter${count === 1 ? '' : 's'} &middot; ${read} read</div>
      </div>
      <div class="row-arrow">&rsaquo;</div>`;
    row.onclick = () => openBook(book);
    list.appendChild(row);
  });
  if (!shown) {
    const p = document.createElement('p');
    p.className = 'hint';
    p.textContent = 'No books match that search.';
    list.appendChild(p);
  }
}

function openBook(book) {
  nav.book = book;
  setActiveNav('bible');
  $('chaptersBookTitle').textContent = book;
  renderChapterList();
  showView('view-chapters');
}

function renderChapterList() {
  const book = nav.book;
  const count = chapterCount(book);
  const list = $('chapterList');
  list.innerHTML = '';
  for (let c = 1; c <= count; c++) {
    const key = Storage.key(book, c);
    const done = !!Storage.state.progress[key];
    const hasPack = !!Storage.getPack(key);
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = `
      <div class="chk${done ? ' done' : ''}">${done ? '&#10003;' : ''}</div>
      <div style="flex:1;">
        <div class="row-title">${escapeText(book)} ${c}</div>
        <div class="row-sub">${done ? 'Read' : 'Not read yet'}</div>
      </div>
      ${hasPack ? '<span class="badge">Game</span>' : ''}
      <div class="row-arrow">&rsaquo;</div>`;
    row.onclick = () => goToChapterTab(book, c, 'scripture');
    list.appendChild(row);
  }
}

// Bridge used by story.js and notes.js: open a chapter's detail view on a
// given tab ('notes' | 'scripture' | 'game'). `beat` is set when a Story
// matching/quiz beat launched this, so a "Mark complete" bar can show.
function goToChapterTab(book, chapter, tab, beat) {
  nav.book = book;
  nav.chapter = chapter;
  nav.detailTab = tab || 'scripture';
  nav.detailBeat = beat || null;
  nav.detailBack = beat ? () => goBackToStoryList(beat) : null;
  activeStoryBeat = beat || null;
  setActiveNav(beat ? 'story' : 'bible');

  $('detailTitle').textContent = `${book} ${chapter}`;
  $('backLabel').textContent = beat ? 'Story' : book;
  renderDetail();
  showView('view-detail');
}

function renderDetail() {
  const { book, chapter } = nav;
  const key = Storage.key(book, chapter);
  $('detailMeta').textContent = `Chapter ${chapter} of ${chapterCount(book)} \u00B7 ${Bible.activeVersion()}`;

  document.querySelectorAll('#detailTabs .seg-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === nav.detailTab);
  });

  const body = $('detailBody');
  body.innerHTML = '';

  // Story beat bar (matching / quiz beats)
  if (nav.detailBeat && nav.detailTab === 'game') {
    const beat = nav.detailBeat;
    const done = StoryEngine.isBeatComplete(beat);
    const bar = document.createElement('div');
    bar.className = 'beat-bar';
    bar.innerHTML = done
      ? `<p style="margin:0 0 10px; font-size:14px;"><strong>Story activity</strong> &mdash; already completed.</p>
         <button class="secondary-btn" id="beatBarBtn" type="button" style="margin:0;">Back to Story</button>`
      : `<p style="margin:0 0 10px; font-size:14px;"><strong>Story activity</strong> &mdash; play as long as you like, then continue.</p>
         <button class="primary-btn" id="beatBarBtn" type="button" style="margin:0;">Mark complete &amp; return to Story</button>`;
    body.appendChild(bar);
    bar.querySelector('#beatBarBtn').onclick = () => {
      if (!done) Storage.completeBeat(beat.id);
      goBackToStoryList(beat);
    };
  }

  // Mark-as-read row (hidden while playing a Story beat, which tracks its own progress)
  if (!nav.detailBeat) {
    const isRead = !!Storage.state.progress[key];
    const row = document.createElement('div');
    row.className = 'mark-row';
    row.innerHTML = `<span>Mark as read</span><button class="toggle${isRead ? ' on' : ''}" type="button" aria-label="Mark as read"></button>`;
    row.querySelector('.toggle').onclick = (e) => {
      const nowRead = Storage.markRead(book, chapter);
      e.currentTarget.classList.toggle('on', nowRead);
    };
    body.appendChild(row);
  }

  const panel = document.createElement('div');
  body.appendChild(panel);
  if (nav.detailTab === 'notes') VerseNotes.renderPanel(panel, book, chapter);
  else if (nav.detailTab === 'game') renderChapterGame(panel, book, chapter);
  else VerseNotes.renderScripture(panel, book, chapter);
}

// The chapter's Game tab: its game pack (matching sections + quiz) if one
// exists, an auto-generated quiz from the chapter text, and the import box.
function renderChapterGame(container, book, chapter) {
  const key = Storage.key(book, chapter);
  const pack = Storage.getPack(key);
  container.innerHTML = '';

  if (pack) {
    (pack.sections || []).forEach((sec, i) => {
      const block = document.createElement('div');
      block.className = 'section-block';
      block.innerHTML = `<p class="section-heading">${escapeText(sec.heading || 'Matching')}</p>` +
        renderMatchingHTML(sec.matching, `chMatch${i}`);
      container.appendChild(block);
      bindMatching(`chMatch${i}`, sec.matching);
    });
    if (pack.quiz && pack.quiz.length) {
      const head = document.createElement('p');
      head.className = 'section-heading';
      head.textContent = 'Quiz';
      container.appendChild(head);
      const quizMount = document.createElement('div');
      container.appendChild(quizMount);
      runQuiz(quizMount, pack.quiz);
    }
  } else {
    const p = document.createElement('p');
    p.className = 'hint';
    p.textContent = "There's no hand-built game pack for this chapter yet. You can still take a quick quiz built from the chapter's text, or import a pack below.";
    container.appendChild(p);
  }

  // Auto-generated quiz from the chapter text
  const quickWrap = document.createElement('div');
  quickWrap.style.marginTop = '14px';
  const quickBtn = document.createElement('button');
  quickBtn.type = 'button';
  quickBtn.className = 'secondary-btn';
  quickBtn.textContent = 'Quick quiz from this chapter';
  const quickMount = document.createElement('div');
  quickBtn.onclick = () => {
    quickMount.innerHTML = '<p class="hint">Building your quiz&hellip;</p>';
    ChapterQuiz.generate(book, chapter, 5).then(qs => {
      if (!qs.length) { quickMount.innerHTML = '<p class="hint">Couldn\u2019t build questions from this chapter.</p>'; return; }
      quickMount.innerHTML = '';
      runQuiz(quickMount, qs);
    }).catch(() => {
      quickMount.innerHTML = '<p class="hint">Couldn\u2019t load the chapter text for a quiz right now.</p>';
    });
  };
  quickWrap.appendChild(quickBtn);
  quickWrap.appendChild(quickMount);
  container.appendChild(quickWrap);

  // Import box
  const box = document.createElement('div');
  box.className = 'import-box';
  box.innerHTML = `
    <label class="field-label">Import a game pack</label>
    <p class="hint" style="margin-top:0;">Paste the JSON for this chapter (format in <code>docs/GAME_PACK_FORMAT.md</code>).</p>
    <textarea id="importPackText" placeholder='{"sections":[...],"quiz":[...]}'></textarea>
    <button class="secondary-btn" id="importPackBtn" type="button">Import</button>
    <p class="hint" id="importPackStatus"></p>`;
  container.appendChild(box);
  box.querySelector('#importPackBtn').onclick = () => {
    const status = box.querySelector('#importPackStatus');
    const text = box.querySelector('#importPackText').value.trim();
    if (!text) { status.textContent = 'Paste some JSON first.'; return; }
    try {
      Storage.importGamePack(book, chapter, text);
      renderDetail();
    } catch (e) {
      status.textContent = 'That JSON couldn\u2019t be read: ' + e.message;
    }
  };
}

// =====================================================================
// LIBRARY TAB: games / devotionals / notes
// =====================================================================

function renderHub() {
  const which = nav.hubTab || 'games';
  document.querySelectorAll('#hubTabs .seg-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.hubtab === which);
  });
  $('hubGames').style.display = which === 'games' ? '' : 'none';
  $('hubDevotionals').style.display = which === 'devotionals' ? '' : 'none';
  $('hubNotes').style.display = which === 'notes' ? '' : 'none';
  if (which === 'games') renderGameCards();
  if (which === 'devotionals') renderDevotionalsList();
  if (which === 'notes') renderHubNotes();
}

function renderGameCards() {
  document.querySelectorAll('.game-card[data-game]').forEach(card => {
    const id = card.dataset.game;
    const game = GameRegistry.get(id);
    const sub = card.querySelector('.gc-sub');
    if (!card.dataset.origSub) card.dataset.origSub = sub.textContent;

    const locked = !StoryEngine.isGameUnlocked(id);
    const stub = !!(game && game.stub);
    card.classList.toggle('locked', locked);
    card.classList.toggle('stub-game', !locked && stub);
    if (locked) sub.textContent = 'Continue reading to unlock';
    else if (stub) sub.textContent = 'In the works';
    else sub.textContent = card.dataset.origSub;

    const old = card.querySelector('.gc-best');
    if (old) old.remove();
    const best = Storage.getHighScore(id);
    if (best > 0 && !locked) {
      const b = document.createElement('div');
      b.className = 'gc-best';
      b.textContent = `Best: ${best}`;
      card.appendChild(b);
    }

    card.onclick = () => {
      if (!StoryEngine.isGameUnlocked(id)) {
        toast('Keep going in Story mode to unlock this game.');
        return;
      }
      openArcadeGame(id, { returnTab: 'hub' });
    };
  });
}

function renderDevotionalsList() {
  const list = $('devotionalsList');
  list.innerHTML = '';
  let count = 0;
  STORY_ARCS.forEach(arc => {
    arc.beats.forEach(beat => {
      if (!beat.devotional) return;
      count++;
      const saved = Storage.getDevotional(beat.id);
      const row = document.createElement('div');
      row.className = 'row devotional-list-row';
      row.innerHTML = `
        <div style="flex:1;">
          <div class="row-title">${escapeText(beat.label)}</div>
          <div class="row-sub">${escapeText(arc.title)}</div>
        </div>
        ${saved ? '<span class="devotional-badge">Written</span>' : ''}
        <div class="row-arrow">&rsaquo;</div>`;
      row.onclick = () => openDevotionalModal(beat);
      list.appendChild(row);
    });
  });
  if (!count) list.innerHTML = '<p class="hint">No devotionals yet.</p>';
}

function openDevotionalModal(beat) {
  const body = $('devotionalModalBody');
  body.innerHTML = `
    <p class="eyebrow" style="margin:0 0 4px;">Devotional</p>
    <h2 class="serif" style="margin:0 0 12px; font-size:18px;">${escapeText(beat.label)}</h2>
    <div id="devotionalModalEditor"></div>`;
  renderDevotionalEditor($('devotionalModalEditor'), beat, () => renderDevotionalsList());
  $('devotionalModal').style.display = 'flex';
}

function closeDevotionalModal() {
  $('devotionalModal').style.display = 'none';
}

// All notes in one list: verse notes, devotional responses, and general chapter notes.
function collectAllNotes() {
  const items = [];
  Storage.allVerseNotes().forEach(n => {
    const [book, chapter] = splitChapterKey(n.chapterKey);
    items.push({
      kind: 'verse', book, chapter, verses: n.verses, text: n.text,
      time: n.updatedAt || n.createdAt || 0, id: n.id,
      ref: `${book} ${chapter}:${formatVerseList(n.verses)}`
    });
  });
  Storage.allDevotionals().forEach(d => {
    const hasRef = d.book && d.chapter;
    items.push({
      kind: 'devotional', book: d.book, chapter: d.chapter, verses: d.verses || [],
      text: d.text, time: d.updatedAt || d.createdAt || 0, id: d.id,
      ref: hasRef ? `Devotional \u00B7 ${d.book} ${d.chapter}` : `Devotional \u00B7 ${d.label || 'Recap'}`
    });
  });
  Object.keys(Storage.state.notes || {}).forEach(k => {
    const text = (Storage.state.notes[k] || '').trim();
    if (!text) return;
    const [book, chapter] = splitChapterKey(k);
    items.push({ kind: 'general', book, chapter, verses: [], text, time: 0, id: k, ref: `${book} ${chapter} \u00B7 notes` });
  });
  return items;
}

function renderHubNotes() {
  const items = collectAllNotes();
  $('hubNotesSortRow').style.display = items.length ? 'flex' : 'none';
  document.querySelectorAll('[data-hubsort]').forEach(b => {
    b.classList.toggle('active', b.dataset.hubsort === hubSort);
  });

  if (hubSort === 'book') {
    items.sort((a, b) => {
      const ai = a.book ? bookIndex(a.book) : 999, bi = b.book ? bookIndex(b.book) : 999;
      return (ai - bi) || ((a.chapter || 0) - (b.chapter || 0)) || ((a.verses[0] || 0) - (b.verses[0] || 0));
    });
  } else {
    items.sort((a, b) => b.time - a.time);
  }

  const list = $('notesList');
  list.innerHTML = items.length ? '' : '<p class="hint">Nothing saved yet. Notes you take while reading will show up here.</p>';
  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'note-card' + (item.book ? ' note-card-link' : '');
    card.innerHTML = `
      <div class="note-card-top">
        <span class="note-card-ref">${escapeText(item.ref)}</span>
        <button class="note-card-del" type="button" title="Delete">&times;</button>
      </div>
      <p class="note-card-text">${escapeText(item.text)}</p>`;
    if (item.book) {
      card.onclick = () => goToChapterTab(item.book, item.chapter, item.kind === 'general' ? 'notes' : 'scripture');
    }
    card.querySelector('.note-card-del').onclick = (e) => {
      e.stopPropagation();
      if (!confirm('Delete this note?')) return;
      if (item.kind === 'verse') Storage.deleteVerseNote(item.book, item.chapter, item.id);
      else if (item.kind === 'devotional') Storage.deleteDevotional(item.id);
      else Storage.setNotes(item.book, item.chapter, '');
      renderHubNotes();
    };
    list.appendChild(card);
  });
}

// =====================================================================
// ARCADE / GAME HOST
// =====================================================================

function unmountCurrentGame() {
  if (currentGame && currentGame.instance && typeof currentGame.instance.unmount === 'function') {
    try { currentGame.instance.unmount(); } catch (e) { /* ignore a game's cleanup error */ }
  }
  currentGame = null;
}

// Bridge used by story.js and the Library: mount a registered game.
//   opts.returnTab: 'story' | 'hub' — where Back goes
//   opts.beat: the Story beat that launched it (enables "Mark complete")
function openArcadeGame(gameId, opts) {
  opts = opts || {};
  const game = GameRegistry.get(gameId);
  if (!game) { toast('That game isn\u2019t available yet.'); return; }

  unmountCurrentGame();
  activeStoryBeat = opts.beat || null;
  arcadeReturn = { tab: opts.returnTab || 'hub', beat: opts.beat || null };
  setActiveNav(arcadeReturn.tab === 'story' ? 'story' : 'hub');

  $('arcadeTitle').textContent = game.title || gameId;
  $('arcadeSub').textContent = game.sub || '';

  // Story beat bar
  let bar = $('arcadeBeatBar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'arcadeBeatBar';
    bar.className = 'beat-bar';
    $('arcadeMount').parentNode.insertBefore(bar, $('arcadeMount'));
  }
  if (opts.beat) {
    const done = StoryEngine.isBeatComplete(opts.beat);
    bar.style.display = '';
    bar.innerHTML = done
      ? `<p style="margin:0 0 10px; font-size:14px;"><strong>Story activity</strong> &mdash; already completed.</p>
         <button class="secondary-btn" id="beatBarBtn" type="button" style="margin:0;">Back to Story</button>`
      : `<p style="margin:0 0 10px; font-size:14px;"><strong>Story activity</strong> &mdash; play as long as you like, then continue.</p>
         <button class="primary-btn" id="beatBarBtn" type="button" style="margin:0;">Mark complete &amp; return to Story</button>`;
    bar.querySelector('#beatBarBtn').onclick = () => {
      if (!done) Storage.completeBeat(opts.beat.id);
      leaveArcade();
    };
  } else {
    bar.style.display = 'none';
    bar.innerHTML = '';
  }

  const mount = $('arcadeMount');
  mount.innerHTML = '';
  showView('view-arcade');
  try {
    currentGame = { instance: game.mount(mount) || {} };
  } catch (e) {
    console.error('Game failed to start:', gameId, e);
    mount.innerHTML = '<p class="hint">This game hit an error while starting. Try again, or pick another.</p>';
  }
}

function leaveArcade() {
  const { tab, beat } = arcadeReturn;
  unmountCurrentGame();
  activeStoryBeat = null;
  if (tab === 'story') {
    goBackToStoryList(beat);
  } else {
    showTab('hub');
  }
}

// =====================================================================
// SETTINGS
// =====================================================================

function renderSettings() {
  fillVersionGrid($('versionGrid'), (version, grid) => {
    setBibleVersion(version);
    grid.querySelectorAll('.version-btn').forEach(b => b.classList.toggle('active', b.textContent === version));
  });
  applyTextSize(Storage.state.textSize || 'medium');
  $('dataStatus').textContent = '';
  if (typeof Cloud !== 'undefined' && Cloud) Cloud.renderAccount();
}

// Called by cloud.js after it pulled newer data from the account. Re-applies
// appearance and redraws the screen if it's a top-level one; reading and game
// screens are left alone so nothing jumps under the reader.
function refreshAfterSync() {
  applyTheme(Storage.state.theme || 'light');
  applyTextSize(Storage.state.textSize || 'medium');
  const active = document.querySelector('.view.active');
  const tabs = { 'view-story': 'story', 'view-library': 'bible', 'view-hub': 'hub', 'view-friends': 'friends', 'view-settings': 'settings' };
  if (active && tabs[active.id]) showTab(tabs[active.id]);
}

function exportData() {
  const blob = new Blob([JSON.stringify(Storage.state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `code-bible-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  $('dataStatus').textContent = 'Backup downloaded.';
}

function importDataFromFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || !parsed.progress) {
        throw new Error('this doesn\u2019t look like a Code Bible backup');
      }
      if (!confirm('Importing replaces the progress, notes and settings on this device with the backup. Continue?')) return;
      Storage.state = Object.assign({}, Storage.state, parsed);
      Storage.save();
      location.reload();
    } catch (e) {
      $('dataStatus').textContent = 'Import failed: ' + e.message + '.';
    }
  };
  reader.onerror = () => { $('dataStatus').textContent = 'Import failed: couldn\u2019t read that file.'; };
  reader.readAsText(file);
}

async function resetAllProgress() {
  const signedIn = typeof Cloud !== 'undefined' && Cloud && Cloud.isSignedIn();
  const where = signedIn ? 'on this device AND in your account' : 'on this device';
  if (!confirm(`Reset everything ${where}? This clears reading progress, notes, devotionals, high scores and friends, and can\u2019t be undone.`)) return;
  if (signedIn) {
    // Clear the cloud copy first, otherwise the next sync would just restore it.
    const cleared = await Cloud.clearCloudData();
    if (!cleared) {
      toast('Couldn\u2019t reach your account, so nothing was reset. Try again when you\u2019re online.');
      return;
    }
  }
  try { localStorage.removeItem(STORE_KEY); } catch (e) { /* ignore */ }
  if (typeof Cloud !== 'undefined' && Cloud) Cloud.forgetSyncState();
  location.reload();
}

// =====================================================================
// FRIENDS
// =====================================================================

function renderFriends() {
  // Book picker for "Share a scripture"
  const bookSel = $('shareVerseBook');
  if (bookSel.options.length <= 1) {
    BOOKS.forEach(([name]) => {
      const o = document.createElement('option');
      o.value = name;
      o.textContent = name;
      bookSel.appendChild(o);
    });
  }
  renderFriendsList();
}

function renderFriendsList() {
  const list = $('friendsList');
  const friends = Storage.allFriends();
  list.innerHTML = friends.length ? '' : '<p class="hint">No friends added yet.</p>';
  friends.forEach(f => {
    const card = document.createElement('div');
    card.className = 'friend-card';
    card.innerHTML = `
      <div>
        <div class="fc-name">${escapeText(f.name)}</div>
        ${f.note ? `<div class="fc-note">${escapeText(f.note)}</div>` : ''}
      </div>
      <button class="note-card-del" type="button" title="Remove">&times;</button>`;
    card.querySelector('button').onclick = () => {
      if (!confirm(`Remove ${f.name}?`)) return;
      Storage.removeFriend(f.id);
      renderFriendsList();
    };
    list.appendChild(card);
  });
}

function onShareChapterChosen() {
  const book = $('shareVerseBook').value;
  const chapter = parseInt($('shareVerseChapter').value, 10);
  const list = $('shareVerseList');
  $('shareVerseBtn').disabled = true;
  $('shareVerseStatus').textContent = '';
  if (!book || !chapter) { list.innerHTML = ''; return; }
  list.innerHTML = '<p class="hint">Loading&hellip;</p>';
  Bible.fetchChapter(book, chapter).then(data => {
    list.innerHTML = '';
    data.verses.forEach(v => {
      const label = document.createElement('label');
      label.className = 'share-verse-item';
      label.innerHTML = `<input type="checkbox" value="${v.verse}"><span class="sv-num">${v.verse}</span><span class="sv-text">${escapeText(v.text.trim())}</span>`;
      label.querySelector('input').onchange = () => {
        $('shareVerseBtn').disabled = !list.querySelector('input:checked');
      };
      list.appendChild(label);
    });
  }).catch(() => {
    list.innerHTML = `<p class="hint">Couldn\u2019t load ${escapeText(book)} ${chapter} in ${escapeText(Bible.activeVersion())}.</p>`;
  });
}

async function shareSelectedVerses() {
  const book = $('shareVerseBook').value;
  const chapter = parseInt($('shareVerseChapter').value, 10);
  const checked = Array.from($('shareVerseList').querySelectorAll('input:checked')).map(i => parseInt(i.value, 10));
  if (!book || !chapter || !checked.length) return;
  const data = await Bible.fetchChapter(book, chapter);
  const wanted = new Set(checked);
  const text = data.verses.filter(v => wanted.has(v.verse)).map(v => v.text.trim()).join(' ');
  const ref = `${book} ${chapter}:${formatVerseList(checked)} (${Bible.activeVersion()})`;
  const result = await shareOrCopy({ title: ref, text: `\u201C${text}\u201D \u2014 ${ref}` });
  $('shareVerseStatus').textContent =
    result === 'copied' ? 'Copied to your clipboard.' :
    result === 'shared' ? 'Shared.' : '';
}

// =====================================================================
// INIT
// =====================================================================

function init() {
  Storage.load();
  applyTheme(Storage.state.theme || 'light');
  applyTextSize(Storage.state.textSize || 'medium');

  // Optional account + cloud backup (cloud.js). Everything keeps working
  // locally if this is unavailable or nobody signs in.
  if (typeof Cloud !== 'undefined' && Cloud) {
    Cloud.onStateChanged = refreshAfterSync;
    Cloud.init();
  }

  // bottom nav
  document.querySelectorAll('.bottom-nav .icon-btn[data-tab]').forEach(b => {
    b.onclick = () => showTab(b.dataset.tab);
  });

  // theme toggles
  $('themeToggle').onclick = toggleTheme;
  $('themeToggleSettings').onclick = toggleTheme;

  // Story
  $('backFromArc').onclick = () => showTab('story');
  $('backFromStoryRead').onclick = () => goBackToStoryList(storyReadBeat);
  $('storyReadNextBtn').onclick = storyReadNext;
  $('storyReadCatchUpBtn').onclick = storyReadCatchUp;
  document.querySelectorAll('#storyReadTabs .seg-btn').forEach(b => {
    b.onclick = () => { storyReadTab = b.dataset.tab; renderStoryReadTab(); };
  });

  // Bible tab
  $('bookSearch').oninput = e => renderLibrary(e.target.value);
  $('backToLibrary').onclick = () => showTab('bible');
  $('backToChapters').onclick = () => {
    if (nav.detailBack) { nav.detailBack(); return; }
    openBook(nav.book);
  };
  $('markBookUnreadBtn').onclick = () => {
    if (!confirm(`Mark every chapter of ${nav.book} as unread?`)) return;
    for (let c = 1; c <= chapterCount(nav.book); c++) delete Storage.state.progress[Storage.key(nav.book, c)];
    Storage.save();
    renderChapterList();
  };
  document.querySelectorAll('#detailTabs .seg-btn').forEach(b => {
    b.onclick = () => { nav.detailTab = b.dataset.tab; renderDetail(); };
  });

  // Library tab
  document.querySelectorAll('#hubTabs .seg-btn').forEach(b => {
    b.onclick = () => { nav.hubTab = b.dataset.hubtab; renderHub(); };
  });
  document.querySelectorAll('[data-hubsort]').forEach(b => {
    b.onclick = () => { hubSort = b.dataset.hubsort; renderHubNotes(); };
  });
  $('closeDevotionalModal').onclick = closeDevotionalModal;
  $('devotionalModal').onclick = e => { if (e.target === $('devotionalModal')) closeDevotionalModal(); };
  $('backFromArcade').onclick = leaveArcade;

  // Settings
  $('backFromSettings').onclick = () => showTab(nav.prevTab || 'story');
  document.querySelectorAll('#textSizeTabs .seg-btn').forEach(b => {
    b.onclick = () => applyTextSize(b.dataset.size);
  });
  $('exportDataBtn').onclick = exportData;
  $('importDataBtn').onclick = () => $('importDataFile').click();
  $('importDataFile').onchange = e => {
    if (e.target.files && e.target.files[0]) importDataFromFile(e.target.files[0]);
    e.target.value = '';
  };
  $('resetProgressBtn').onclick = resetAllProgress;

  // Friends
  $('inviteFriendBtn').onclick = async () => {
    const result = await shareOrCopy({
      title: 'Code Bible',
      text: 'Read the Bible along with me in Code Bible.',
      url: location.href
    });
    if (result === 'copied') toast('Invite link copied.');
  };
  $('addFriendBtn').onclick = () => {
    const entry = Storage.addFriend($('newFriendName').value, $('newFriendNote').value);
    if (!entry) { toast('Enter a name first.'); return; }
    $('newFriendName').value = '';
    $('newFriendNote').value = '';
    renderFriendsList();
  };
  $('shareVerseBook').onchange = () => {
    const book = $('shareVerseBook').value;
    const chSel = $('shareVerseChapter');
    chSel.innerHTML = '<option value="">Chapter&hellip;</option>';
    chSel.disabled = !book;
    if (book) {
      for (let c = 1; c <= chapterCount(book); c++) {
        const o = document.createElement('option');
        o.value = c;
        o.textContent = c;
        chSel.appendChild(o);
      }
    }
    onShareChapterChosen();
  };
  $('shareVerseChapter').onchange = onShareChapterChosen;
  $('shareVerseBtn').onclick = shareSelectedVerses;

  // Learn which Bible versions this site ships before the first screen draws
  // (capped so a slow network can never block the app from starting).
  Promise.race([Bible.loadAvailableVersions(), new Promise(r => setTimeout(r, 1500))])
    .then(() => showTab('story'));
}

document.addEventListener('DOMContentLoaded', init);
