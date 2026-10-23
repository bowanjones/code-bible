const Bible = {
  cache: {},

  // Which Bible versions this copy of the site actually ships. null means
  // "assume all of them" (local development). The deployed site lists what it
  // contains in versions/available.json, because only public-domain text
  // (KJV) is published; copyrighted translations stay on your own machine.
  availableVersions: null,

  loadAvailableVersions() {
    return fetch('versions/available.json')
      .then(r => (r.ok ? r.json() : null))
      .then(list => {
        if (Array.isArray(list) && list.length) { this.availableVersions = list; this.cache = {}; }
      })
      .catch(() => { /* no list present: keep assuming everything is available */ });
  },

  // The version whose text will really load. If the saved choice isn't shipped
  // here (e.g. synced from a dev machine that has ESV), fall back gracefully.
  activeVersion() {
    const saved = (Storage.state && Storage.state.bibleVersion) || 'KJV';
    if (this.availableVersions && !this.availableVersions.includes(saved)) return this.availableVersions[0];
    return saved;
  },

  versionChoices(all) {
    return this.availableVersions ? all.filter(v => this.availableVersions.includes(v)) : all.slice();
  },

  async fetchChapter(book, chapter) {
    const version = this.activeVersion();
    const key = `${book}-${chapter}-${version}`;
    if (this.cache[key]) return this.cache[key];

    const filename = `${book}-${chapter}.json`;
    // Chapters live at versions/{VERSION}/{Book}/Chapters/{Book}-{Chapter}.json
    // (one subfolder per book, chapters nested underneath). Some versions
    // (e.g. KJV) instead number their book folders, e.g. "01-Genesis",
    // "06-Joshua", using the book's 1-based position in the 66-book canon.
    // Older layouts are still checked as a fallback so nothing breaks.
    const bookIndex = BOOKS.findIndex(b => b[0] === book);
    const numberedBook = bookIndex >= 0
      ? `${String(bookIndex + 1).padStart(2, '0')}-${book}`
      : null;

    const chaptersUrl = `versions/${version}/${book}/Chapters/${filename}`;
    const numberedChaptersUrl = numberedBook
      ? `versions/${version}/${numberedBook}/Chapters/${filename}`
      : null;
    const subfolderUrl = `versions/${version}/${book}/${filename}`;
    const numberedSubfolderUrl = numberedBook
      ? `versions/${version}/${numberedBook}/${filename}`
      : null;
    const flatUrl = `versions/${version}/${filename}`;

    const candidates = [chaptersUrl, numberedChaptersUrl, subfolderUrl, numberedSubfolderUrl, flatUrl]
      .filter(Boolean);

    let data = null;
    for (const url of candidates) {
      try {
        const response = await fetch(url);
        if (response.ok) { data = await response.json(); break; }
      } catch (e) { /* try next path */ }
    }
    if (!data) throw new Error(`Unable to load ${book} ${chapter} in ${version}`);

    const text = data.verses.map(v => {
      const safeText = Bible.escapeHtml(v.text.trim());
      return `<p><span class="verse-number">${v.verse}</span>${safeText}</p>`;
    }).join('');

    const result = {
      reference: data.reference,
      verses: data.verses,
      text,
      copyright: data.copyright || 'Public domain'
    };
    this.cache[key] = result;
    return result;
  },

  escapeHtml(str) {
    return str.replace(/[&<>"']/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[tag]));
  }
};
