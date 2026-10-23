// storage.js
// Everything that touches persistence lives here. Today that's localStorage.
// Swapping to a backend (Supabase, Firebase, your own API) later should mean
// changing this file only — the rest of the app just calls Storage.get/set.

const STORE_KEY = 'bible-companion-v1';

const Storage = {
  state: {
    progress: {}, notes: {}, verseNotes: {}, devotionals: {}, gameData: {}, highScores: {}, friends: [], lastReadDate: null, streak: 0,
    theme: 'light', textSize: 'medium', bibleVersion: 'KJV', versionChosen: false,
    storyProgress: { completedBeats: {} }
  },

  load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) this.state = Object.assign(this.state, JSON.parse(raw));
    } catch (e) { /* ignore corrupt storage */ }

    if (Object.keys(this.state.gameData).length === 0) {
      this.state.gameData = JSON.parse(JSON.stringify(SEED_GAME));
    }
    if (!this.state.notes["Genesis-1"]) {
      this.state.notes["Genesis-1"] =
        "Genesis 1 is the account of the seven days of creation. God speaks the ordered " +
        "universe into being, culminating in humanity, made in his image and likeness " +
        "(v.26-27), and declares it all \"very good.\"";
    }
    return this.state;
  },

  save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(this.state)); }
    catch (e) { /* storage full or unavailable */ }
  },

  key(book, chapter) {
    return `${book}-${chapter}`;
  },

  markRead(book, chapter) {
    const k = this.key(book, chapter);
    const wasDone = !!this.state.progress[k];
    if (wasDone) {
      delete this.state.progress[k];
    } else {
      this.state.progress[k] = true;
      const today = new Date().toDateString();
      if (this.state.lastReadDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        this.state.streak = (this.state.lastReadDate === yesterday.toDateString())
          ? this.state.streak + 1
          : 1;
        this.state.lastReadDate = today;
      }
      // Note: this intentionally does NOT auto-complete any Story beat.
      // Story mode tracks its own progress strictly through its own
      // sequence (Storage.completeBeat, called from the Story flow itself)
      // so a chapter marked read here can't instantly complete every
      // reading stop for that chapter out of order.
    }
    this.save();
    return !wasDone;
  },

  isBeatComplete(beatId) {
    return !!this.state.storyProgress.completedBeats[beatId];
  },

  completeBeat(beatId, opts) {
    this.state.storyProgress.completedBeats[beatId] = true;
    if (!(opts && opts.silent)) this.save();
  },

  setNotes(book, chapter, text) {
    this.state.notes[this.key(book, chapter)] = text;
    this.save();
  },

  // ---------- Verse-anchored notes ----------
  // Each entry: { id, verses: [1,2,...], text, createdAt, updatedAt? }
  addVerseNote(book, chapter, verses, text) {
    const k = this.key(book, chapter);
    if (!this.state.verseNotes[k]) this.state.verseNotes[k] = [];
    const note = {
      id: 'n' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36),
      verses: verses.slice().sort((a, b) => a - b),
      text,
      createdAt: Date.now()
    };
    this.state.verseNotes[k].push(note);
    this.save();
    return note;
  },

  updateVerseNote(book, chapter, id, text) {
    const arr = this.state.verseNotes[this.key(book, chapter)] || [];
    const note = arr.find(n => n.id === id);
    if (note) { note.text = text; note.updatedAt = Date.now(); this.save(); }
    return note;
  },

  deleteVerseNote(book, chapter, id) {
    const k = this.key(book, chapter);
    this.state.verseNotes[k] = (this.state.verseNotes[k] || []).filter(n => n.id !== id);
    this.save();
  },

  getVerseNotes(book, chapter) {
    return (this.state.verseNotes[this.key(book, chapter)] || []).slice();
  },

  // Flat list of every verse note across every chapter, each tagged with its
  // chapterKey ("Book-Chapter") so the Library's Notes tab can group/sort them.
  allVerseNotes() {
    const out = [];
    Object.keys(this.state.verseNotes || {}).forEach(k => {
      (this.state.verseNotes[k] || []).forEach(n => out.push(Object.assign({ chapterKey: k }, n)));
    });
    return out;
  },

  // ---------- Devotional entries ----------
  // Each Story reading beat can carry a short devotional (reflection + a
  // guided question, authored in story-data.js). We only persist what the
  // reader writes back, keyed by that beat's id — one entry per beat, so
  // revisiting a beat's Devotional tab edits the same entry instead of
  // piling up duplicates. Saving an empty response deletes the entry.
  saveDevotional(beatId, meta, text) {
    const trimmed = (text || '').trim();
    if (!trimmed) { this.deleteDevotional(beatId); return null; }
    const existing = this.state.devotionals[beatId];
    const entry = {
      id: beatId,
      book: meta.book,
      chapter: meta.chapter,
      verses: meta.verses || null,
      label: meta.label || '',
      question: meta.question || '',
      text: trimmed,
      createdAt: existing ? existing.createdAt : Date.now(),
      updatedAt: Date.now()
    };
    this.state.devotionals[beatId] = entry;
    this.save();
    return entry;
  },

  getDevotional(beatId) {
    return this.state.devotionals[beatId] || null;
  },

  deleteDevotional(beatId) {
    if (!this.state.devotionals[beatId]) return;
    delete this.state.devotionals[beatId];
    this.save();
  },

  // Every saved devotional entry, newest first — the Library's Notes tab
  // shows these alongside verse notes so people can look back over what
  // they wrote as they read.
  allDevotionals() {
    return Object.values(this.state.devotionals || {}).sort((a, b) => b.updatedAt - a.updatedAt);
  },

  // ---------- Game high scores ----------
  // One best score per game id (higher is always better — that's true for
  // every arcade game currently using this). Returns true when this call
  // actually set a new record, so a game can show "New high score!".
  saveHighScore(gameId, score) {
    const current = this.state.highScores[gameId] || 0;
    if (score > current) {
      this.state.highScores[gameId] = score;
      this.save();
      return true;
    }
    return false;
  },

  getHighScore(gameId) {
    return this.state.highScores[gameId] || 0;
  },

  // ---------- Friends (local list, no account sync yet) ----------
  // This is a personal list of who you're reading with — there's no
  // backend yet, so it doesn't sync between devices or notify anyone. It's
  // a place to keep track of people while sharing (invites, verses) uses
  // the device's native share sheet.
  addFriend(name, note) {
    const trimmed = (name || '').trim();
    if (!trimmed) return null;
    const entry = { id: 'f' + Date.now() + Math.random().toString(36).slice(2, 7), name: trimmed, note: (note || '').trim(), addedAt: Date.now() };
    this.state.friends.push(entry);
    this.save();
    return entry;
  },

  removeFriend(id) {
    const before = this.state.friends.length;
    this.state.friends = this.state.friends.filter(f => f.id !== id);
    if (this.state.friends.length !== before) this.save();
  },

  allFriends() {
    return (this.state.friends || []).slice().sort((a, b) => a.name.localeCompare(b.name));
  },

  // Game packs: the ones that ship with the app (BUILTIN_PACKS) plus any the
  // reader imported. An imported pack for a chapter replaces the built-in one.
  getPack(key) {
    const own = this.state.gameData[key];
    if (own) return own;
    return (typeof BUILTIN_PACKS !== 'undefined' && BUILTIN_PACKS[key]) || null;
  },

  allPacks() {
    return Object.assign({}, typeof BUILTIN_PACKS !== 'undefined' ? BUILTIN_PACKS : {}, this.state.gameData);
  },

  importGamePack(book, chapter, jsonText) {
    const parsed = JSON.parse(jsonText); // throws on invalid JSON — caller should catch
    this.state.gameData[this.key(book, chapter)] = parsed;
    this.save();
    return parsed;
  }
};