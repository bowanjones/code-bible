// chapterquiz.js
// Auto-generates simple fill-in-the-blank quiz questions from any chapter's
// actual text — no manual authoring needed, so every chapter can have a
// quick quiz, not just the handful with a hand-built game pack. Blanks one
// meaningful word per verse (skipping short/common KJV words) and builds
// multiple choice options from other vocabulary in the same chapter.

const KJV_STOPWORDS = new Set([
  'the', 'and', 'of', 'unto', 'that', 'shall', 'thou', 'thy', 'his', 'her', 'for', 'with',
  'from', 'but', 'not', 'all', 'was', 'were', 'is', 'are', 'it', 'in', 'on', 'to', 'a',
  'he', 'she', 'they', 'them', 'their', 'this', 'these', 'those', 'which', 'who', 'whom',
  'whose', 'what', 'when', 'where', 'why', 'how', 'if', 'then', 'than', 'so', 'as', 'at',
  'by', 'an', 'be', 'been', 'being', 'had', 'have', 'has', 'do', 'does', 'did', 'will',
  'would', 'could', 'should', 'may', 'might', 'must', 'shalt', 'o', 'ye', 'thee', 'thine',
  'upon', 'into', 'over', 'under', 'between', 'among', 'because', 'therefore', 'thus',
  'also', 'even', 'yet', 'still', 'again', 'my', 'me', 'i', 'we', 'us', 'our', 'your',
  'you', 'him', 'one', 'two', 'three', 'said', 'say', 'saith', 'came', 'come', 'went',
  'there', 'out', 'up', 'down', 'after', 'before', 'both', 'every', 'each', 'no', 'nor',
  'yea', 'behold', 'now', 'more', 'man', 'men', 'son', 'sons', 'unto', 'own'
]);

const ChapterQuiz = {
  // Resolves to an array of { q, options, answer, ref } questions — the
  // same shape runQuiz() already expects — built from `count` verses picked
  // out of the given chapter.
  generate(book, chapter, count) {
    return Bible.fetchChapter(book, chapter).then(data => {
      const verses = data.verses || [];
      const decentLength = verses.filter(v => (v.text || '').trim().split(/\s+/).length >= 6);
      const pool = decentLength.length ? decentLength : verses;
      const chosen = shuffle(pool.slice()).slice(0, Math.min(count, pool.length));
      const vocabulary = this._vocabulary(verses);
      return chosen
        .map(v => this._buildQuestion(v, book, chapter, vocabulary))
        .filter(Boolean);
    });
  },

  // Draws a handful of questions from several already-read chapters at
  // once, for a "quiz on everything you've read" mode. Resolves to [] if
  // nothing's been read yet.
  generateAcrossRead(perChapter, maxChapters) {
    const keys = Object.keys(Storage.state.progress).filter(k => Storage.state.progress[k]);
    if (!keys.length) return Promise.resolve([]);
    const picked = shuffle(keys.slice()).slice(0, maxChapters);
    const fetches = picked.map(k => {
      const [book, chapter] = splitChapterKey(k);
      return this.generate(book, chapter, perChapter).catch(() => []);
    });
    return Promise.all(fetches).then(lists => shuffle([].concat(...lists)));
  },

  _vocabulary(verses) {
    const words = [];
    verses.forEach(v => {
      (v.text || '').split(/\s+/).forEach(w => {
        const clean = w.replace(/[^a-zA-Z']/g, '');
        if (clean.length >= 4 && !KJV_STOPWORDS.has(clean.toLowerCase())) words.push(clean);
      });
    });
    return words;
  },

  _buildQuestion(verse, book, chapter, vocabulary) {
    const words = (verse.text || '').trim().split(/\s+/);
    const candidates = words
      .map((w, i) => ({ i, clean: w.replace(/[^a-zA-Z']/g, '') }))
      .filter(c => c.clean.length >= 4 && !KJV_STOPWORDS.has(c.clean.toLowerCase()));
    if (!candidates.length) return null;

    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    const answer = pick.clean;
    const blanked = words.slice();
    blanked[pick.i] = blanked[pick.i].replace(pick.clean, '___');

    const usedLower = new Set([answer.toLowerCase()]);
    const distractors = [];
    const shuffledVocab = shuffle(vocabulary.slice());
    for (let i = 0; i < shuffledVocab.length && distractors.length < 3; i++) {
      const w = shuffledVocab[i];
      if (!usedLower.has(w.toLowerCase())) { distractors.push(w); usedLower.add(w.toLowerCase()); }
    }
    const fallback = ['grace', 'glory', 'peace', 'mercy', 'truth', 'faith'];
    let fi = 0;
    while (distractors.length < 3) {
      const w = fallback[fi++ % fallback.length];
      if (!usedLower.has(w.toLowerCase())) { distractors.push(w); usedLower.add(w.toLowerCase()); }
    }

    const options = shuffle([answer].concat(distractors));
    return {
      q: `${book} ${chapter}:${verse.verse} \u2014 ${blanked.join(' ')}`,
      options,
      answer: options.indexOf(answer),
      ref: `${book} ${chapter}:${verse.verse}`
    };
  }
};