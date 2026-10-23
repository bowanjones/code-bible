// notes.js
// Shared verse-selection + note-taking UI. Tap a verse to select it (tap more
// to extend the selection), a small "+" bar appears, tap it to type a note.
// Used by both the ordinary Bible-tab Scripture/Notes panels and the Story
// reading screen, so notes taken in either place show up in the same list.

const VerseNotes = {
  selection: new Set(),
  currentBook: null,
  currentChapter: null,
  sortMode: 'verse', // 'verse' | 'newest' — used by renderPanel

  reset(book, chapter) {
    this.selection = new Set();
    this.currentBook = book;
    this.currentChapter = chapter;
  },

  // ---------- Scripture panel: clickable verses + note composer ----------
  // verseRange (optional): [start, end] — when given, only that slice of the
  // chapter is shown (used by Story beats that split a chapter into a few
  // reading stops). Selecting/noting verses still works normally; notes are
  // still stored against the real verse numbers, chapter-wide.
  renderScripture(container, book, chapter, verseRange) {
    this.reset(book, chapter);
    container.innerHTML = `<div class="bible-load-state">Loading ${book} ${chapter}&hellip;</div>`;
    Bible.fetchChapter(book, chapter)
      .then(data => {
        const notedVerses = new Set();
        Storage.getVerseNotes(book, chapter).forEach(n => n.verses.forEach(v => notedVerses.add(v)));
        const versesToShow = verseRange
          ? data.verses.filter(v => v.verse >= verseRange[0] && v.verse <= verseRange[1])
          : data.verses;
        const versesHtml = versesToShow.map(v => {
          const safe = Bible.escapeHtml(v.text.trim());
          const noted = notedVerses.has(v.verse) ? ' has-note' : '';
          const icon = notedVerses.has(v.verse)
            ? `<button type="button" class="verse-note-icon" data-verse="${v.verse}" title="View note">&#9998;</button>`
            : '';
          return `<span class="verse${noted}" data-verse="${v.verse}">${icon}<span class="verse-number">${v.verse}</span>${safe} </span>`;
        }).join('');
        container.innerHTML = `
          <div class="bible-text" id="bibleTextVerses">${versesHtml}</div>
          <p class="hint" id="bibleSourceHint">Source: ${data.copyright}. Tap a verse to select it — tap more to extend the selection — then tap the + to add a note.</p>
          <div class="note-fab-bar" id="noteFabBar" style="display:none;">
            <span class="note-fab-label" id="noteFabLabel"></span>
            <button class="note-fab" id="noteFabBtn" type="button" title="Add note">+</button>
          </div>
          <div class="note-composer" id="noteComposer" style="display:none;">
            <label class="field-label">New note</label>
            <textarea id="noteComposerText" placeholder="What do you want to remember about this?"></textarea>
            <div class="note-composer-actions">
              <button class="secondary-btn" id="noteComposerCancel" type="button">Cancel</button>
              <button class="primary-btn" id="noteComposerSave" type="button">Save note</button>
            </div>
          </div>`;
        this.bindVerses(container);
      })
      .catch(() => {
        const query = encodeURIComponent(`${book} ${chapter}`);
        container.innerHTML = `
          <div class="bible-error">Bible text could not be loaded directly. Use the links below if needed.</div>
          <a class="link-card" href="https://www.biblegateway.com/passage/?search=${query}&version=KJV" target="_blank" rel="noopener">
            <div class="lc-title">Read ${book} ${chapter} on Bible Gateway</div>
            <div class="lc-sub">Opens the full chapter text (KJV) in your browser</div>
          </a>`;
      });
  },

  bindVerses(container) {
    container.querySelectorAll('.verse').forEach(el => {
      el.onclick = () => {
        const v = parseInt(el.dataset.verse, 10);
        if (this.selection.has(v)) { this.selection.delete(v); el.classList.remove('selected'); }
        else { this.selection.add(v); el.classList.add('selected'); }
        this.updateFab(container);
      };
    });
    container.querySelectorAll('.verse-note-icon').forEach(icon => {
      icon.onclick = (e) => {
        e.stopPropagation();
        this.toggleNotePopover(container, icon, this.currentBook, this.currentChapter, parseInt(icon.dataset.verse, 10));
      };
    });
    this.updateFab(container);
    const fabBtn = container.querySelector('#noteFabBtn');
    if (fabBtn) fabBtn.onclick = () => this.openComposer(container);
    const cancelBtn = container.querySelector('#noteComposerCancel');
    if (cancelBtn) cancelBtn.onclick = () => { this.closeComposer(container); this.updateFab(container); };
    const saveBtn = container.querySelector('#noteComposerSave');
    if (saveBtn) saveBtn.onclick = () => this.saveComposer(container);
  },

  // ---------- Pencil icon on already-noted verses: quick-view popover ----------
  toggleNotePopover(container, icon, book, chapter, verseNum) {
    const already = this._popover && this._popover.dataset.verse === String(verseNum);
    this.closeNotePopover();
    if (already) return; // clicking the same pencil again just closes it
    const notes = Storage.getVerseNotes(book, chapter).filter(n => n.verses.includes(verseNum));
    if (!notes.length) return;

    const verseEl = container.querySelector(`.verse[data-verse="${verseNum}"]`);
    if (verseEl) verseEl.classList.add('popover-active');

    const pop = document.createElement('div');
    pop.className = 'note-popover';
    pop.dataset.verse = verseNum;
    pop.innerHTML = notes.map(n => `<p class="note-popover-text">${Bible.escapeHtml(n.text)}</p>`).join('<hr class="note-popover-divider">');
    document.body.appendChild(pop);
    const rect = icon.getBoundingClientRect();
    const top = rect.bottom + window.scrollY + 6;
    const left = Math.max(12, Math.min(rect.left + window.scrollX, window.innerWidth - 272));
    pop.style.top = `${top}px`;
    pop.style.left = `${left}px`;
    this._popover = pop;
    this._popoverVerseEl = verseEl;

    // Any click outside the popover (or its pencil) closes it and returns to normal editing.
    setTimeout(() => {
      document.addEventListener('click', this._popoverOutsideHandler = (ev) => {
        if (pop.contains(ev.target) || ev.target === icon) return;
        this.closeNotePopover();
      });
    }, 0);
  },

  closeNotePopover() {
    if (this._popover) { this._popover.remove(); this._popover = null; }
    if (this._popoverVerseEl) { this._popoverVerseEl.classList.remove('popover-active'); this._popoverVerseEl = null; }
    if (this._popoverOutsideHandler) { document.removeEventListener('click', this._popoverOutsideHandler); this._popoverOutsideHandler = null; }
  },

  updateFab(container) {
    const bar = container.querySelector('#noteFabBar');
    const label = container.querySelector('#noteFabLabel');
    if (!bar) return;
    const n = this.selection.size;
    if (n === 0) { bar.style.display = 'none'; this.closeComposer(container); return; }
    bar.style.display = 'flex';
    const list = Array.from(this.selection).sort((a, b) => a - b);
    label.textContent = n === 1 ? `Verse ${list[0]} selected` : `Verses ${list.join(', ')} selected`;
  },

  openComposer(container) {
    const bar = container.querySelector('#noteFabBar');
    if (bar) bar.style.display = 'none';
    const composer = container.querySelector('#noteComposer');
    composer.style.display = 'block';
    const ta = container.querySelector('#noteComposerText');
    ta.value = '';
    ta.focus();
  },

  closeComposer(container) {
    const composer = container.querySelector('#noteComposer');
    if (composer) composer.style.display = 'none';
  },

  saveComposer(container) {
    const ta = container.querySelector('#noteComposerText');
    const text = ta.value.trim();
    if (!text) return;
    const verses = Array.from(this.selection).sort((a, b) => a - b);
    Storage.addVerseNote(this.currentBook, this.currentChapter, verses, text);
    verses.forEach(v => {
      const el = container.querySelector(`.verse[data-verse="${v}"]`);
      if (el && !el.classList.contains('has-note')) {
        el.classList.add('has-note');
        const icon = document.createElement('button');
        icon.type = 'button';
        icon.className = 'verse-note-icon';
        icon.dataset.verse = v;
        icon.title = 'View note';
        icon.innerHTML = '&#9998;';
        icon.onclick = (e) => {
          e.stopPropagation();
          this.toggleNotePopover(container, icon, this.currentBook, this.currentChapter, v);
        };
        el.insertBefore(icon, el.firstChild);
      }
      if (el) el.classList.remove('selected');
    });
    this.selection.clear();
    this.closeComposer(container);
    this.updateFab(container);
  },

  // ---------- Notes panel: list of verse notes for this chapter + general notes ----------
  renderPanel(container, book, chapter) {
    const k = Storage.key(book, chapter);
    const notes = Storage.getVerseNotes(book, chapter);
    const sorted = notes.slice().sort((a, b) => {
      if (this.sortMode === 'newest') return b.createdAt - a.createdAt;
      return a.verses[0] - b.verses[0];
    });
    container.innerHTML = `
      <div class="note-sort-row">
        <span class="hint" style="margin:0;">${notes.length} verse note${notes.length === 1 ? '' : 's'}</span>
        <div class="segmented note-sort-seg">
          <button class="seg-btn${this.sortMode === 'verse' ? ' active' : ''}" data-sort="verse">By verse</button>
          <button class="seg-btn${this.sortMode === 'newest' ? ' active' : ''}" data-sort="newest">Newest</button>
        </div>
      </div>
      <div id="verseNotesList">${sorted.length ? '' : '<p class="hint">No verse notes yet. Head to Scripture, tap a verse, then the +.</p>'}</div>
      <label class="field-label" style="margin-top:22px;">General notes</label>
      <textarea id="notesArea" placeholder="Paste in what we discussed for this chapter, or jot your own notes here.">${Storage.state.notes[k] || ''}</textarea>
      <p class="hint">Notes save automatically on this device, and sync to your account when you are signed in.</p>`;

    const list = container.querySelector('#verseNotesList');
    sorted.forEach(n => {
      const card = document.createElement('div');
      card.className = 'note-card note-card-link';
      const vLabel = n.verses.length === 1 ? `${n.verses[0]}` : `${n.verses[0]}-${n.verses[n.verses.length - 1]}`;
      card.innerHTML = `
        <div class="note-card-top">
          <span class="note-card-ref">${book} ${chapter}:${vLabel}</span>
          <button class="note-card-del" type="button" title="Delete">&times;</button>
        </div>
        <p class="note-card-text">${Bible.escapeHtml(n.text)}</p>`;
      card.onclick = () => goToChapterTab(book, chapter, 'scripture');
      card.querySelector('.note-card-del').onclick = (e) => {
        e.stopPropagation();
        Storage.deleteVerseNote(book, chapter, n.id);
        this.renderPanel(container, book, chapter);
      };
      list.appendChild(card);
    });

    container.querySelectorAll('.note-sort-seg .seg-btn').forEach(b => {
      b.onclick = () => { this.sortMode = b.dataset.sort; this.renderPanel(container, book, chapter); };
    });
    container.querySelector('#notesArea').oninput = e => Storage.setNotes(book, chapter, e.target.value);
  }
};