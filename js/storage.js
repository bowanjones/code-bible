// storage.js
// Everything that touches persistence lives here. Today that's localStorage.
// Swapping to a backend (Supabase, Firebase, your own API) later should mean
// changing this file only — the rest of the app just calls Storage.get/set.

const STORE_KEY = 'bible-companion-v1';

const Storage = {
  state: { progress: {}, notes: {}, gameData: {}, lastReadDate: null, streak: 0, mode: 'read', theme: 'light', bibleVersion: 'KJV' },

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
    }
    this.save();
    return !wasDone;
  },

  setNotes(book, chapter, text) {
    this.state.notes[this.key(book, chapter)] = text;
    this.save();
  },

  importGamePack(book, chapter, jsonText) {
    const parsed = JSON.parse(jsonText); // throws on invalid JSON — caller should catch
    this.state.gameData[this.key(book, chapter)] = parsed;
    this.save();
    return parsed;
  }
};
