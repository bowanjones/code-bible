// Content integrity: the 66 books, the Story campaign, the games, and the Bible text files.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { ROOT, read, exists, loadCore, walk, warn } = require('./helpers/load');

const core = loadCore();
const { BOOKS, TOTAL_CHAPTERS, STORY_ARCS } = core;

// Game ids registered with GameRegistry (parsed from source; the template file is excluded).
function registeredGames() {
  const files = ['js/games.js', ...fs.readdirSync(path.join(ROOT, 'js/games'))
    .filter(f => f.endsWith('.js') && !f.startsWith('_')).map(f => 'js/games/' + f)];
  const ids = new Set();
  files.forEach(f => {
    for (const m of read(f).matchAll(/GameRegistry\.register\(\s*\{[^}]*?\bid:\s*['"]([\w-]+)['"]/gs)) ids.add(m[1]);
  });
  return ids;
}

function chapterFile(version, bookIdx, book, chapter) {
  const name = `${book}-${chapter}.json`;
  const numbered = `${String(bookIdx + 1).padStart(2, '0')}-${book}`;
  return [
    `versions/${version}/${numbered}/Chapters/${name}`,
    `versions/${version}/${book}/Chapters/${name}`,
    `versions/${version}/${numbered}/${name}`,
    `versions/${version}/${book}/${name}`
  ].find(exists) || null;
}

test('the Bible has 66 books and 1,189 chapters', () => {
  assert.equal(BOOKS.length, 66);
  assert.equal(TOTAL_CHAPTERS, 1189);
  assert.equal(BOOKS.reduce((n, b) => n + b[1], 0), 1189);
  assert.equal(new Set(BOOKS.map(b => b[0])).size, 66, 'book names are unique');
});

test('book order and well-known chapter counts are right', () => {
  const count = name => BOOKS.find(b => b[0] === name)[1];
  assert.equal(BOOKS[0][0], 'Genesis');
  assert.equal(BOOKS[38][0], 'Malachi', 'Old Testament ends at book 39');
  assert.equal(BOOKS[39][0], 'Matthew', 'New Testament starts at book 40');
  assert.equal(BOOKS[65][0], 'Revelation');
  assert.equal(count('Genesis'), 50);
  assert.equal(count('Psalms'), 150);
  assert.equal(count('Obadiah'), 1);
  assert.equal(count('Revelation'), 22);
});

test('Story: arcs and stops have unique ids and valid types', () => {
  assert.ok(STORY_ARCS.length > 0);
  const arcIds = new Set(), beatIds = new Set();
  STORY_ARCS.forEach(arc => {
    assert.ok(arc.id && arc.title && Array.isArray(arc.beats) && arc.beats.length > 0, `arc ${arc.id} is complete`);
    assert.ok(!arcIds.has(arc.id), `duplicate arc id ${arc.id}`); arcIds.add(arc.id);
    arc.beats.forEach(b => {
      assert.ok(b.id, 'every stop needs an id');
      assert.ok(!beatIds.has(b.id), `duplicate stop id ${b.id}`); beatIds.add(b.id);
      assert.ok(['read', 'game', 'summary'].includes(b.type), `${b.id}: unknown type "${b.type}"`);
      assert.ok(b.label && b.label.length > 0 || b.type === 'game', `${b.id}: needs a label`);
    });
  });
});

test('Story: reading stops point at real chapters and valid verse ranges', () => {
  const idx = Object.fromEntries(BOOKS.map(([n, c]) => [n, c]));
  STORY_ARCS.forEach(arc => arc.beats.filter(b => b.type === 'read').forEach(b => {
    assert.ok(Array.isArray(b.chapters) && b.chapters.length > 0, `${b.id}: read stop needs chapters`);
    b.chapters.forEach(([book, ch]) => {
      assert.ok(book in idx, `${b.id}: unknown book "${book}"`);
      assert.ok(Number.isInteger(ch) && ch >= 1 && ch <= idx[book], `${b.id}: ${book} ${ch} does not exist`);
    });
    if (b.verses) {
      assert.equal(b.verses.length, 2, `${b.id}: verses must be [start, end]`);
      assert.ok(Number.isInteger(b.verses[0]) && Number.isInteger(b.verses[1]) && b.verses[0] >= 1 && b.verses[0] <= b.verses[1], `${b.id}: bad verse range ${b.verses}`);
    }
  }));
});

test('Story: a chapter split into segments flags exactly its final segment', () => {
  const byChapter = {};
  STORY_ARCS.forEach(arc => arc.beats.filter(b => b.type === 'read' && b.verses).forEach(b => {
    const k = b.chapters[0].join(' ');
    (byChapter[k] = byChapter[k] || []).push(b);
  }));
  Object.entries(byChapter).forEach(([chapter, segs]) => {
    const flagged = segs.filter(s => s.lastSegment);
    assert.equal(flagged.length, 1, `${chapter}: exactly one segment should have lastSegment (found ${flagged.length})`);
    const lastEnd = Math.max(...segs.map(s => s.verses[1]));
    assert.equal(flagged[0].verses[1], lastEnd, `${chapter}: lastSegment must be the one that ends the chapter`);
  });
});

test('Story: devotionals have a reflection and a question; recaps have text', () => {
  STORY_ARCS.forEach(arc => arc.beats.forEach(b => {
    if (b.devotional) {
      assert.ok(typeof b.devotional.reflection === 'string' && b.devotional.reflection.trim(), `${b.id}: devotional needs a reflection`);
      assert.ok(typeof b.devotional.question === 'string' && b.devotional.question.trim(), `${b.id}: devotional needs a question`);
    }
    if (b.type === 'summary') assert.ok(b.recap && b.recap.trim(), `${b.id}: recap needs text`);
  }));
});

test('Story: game stops use a registered game (or a chapter pack) and word lists are sane', () => {
  const games = registeredGames();
  STORY_ARCS.forEach(arc => arc.beats.filter(b => b.type === 'game').forEach(b => {
    assert.ok(b.gameId, `${b.id}: game stop needs a gameId`);
    assert.ok(games.has(b.gameId), `${b.id}: game "${b.gameId}" is not registered`);
    if (['matching', 'quiz'].includes(b.gameId)) assert.ok(b.chapters && b.chapters.length, `${b.id}: chapter games need chapters`);
    if (b.wordSet) {
      assert.ok(Array.isArray(b.wordSet.words) && b.wordSet.words.length >= 3, `${b.id}: wordSet needs a few words`);
      b.wordSet.words.forEach(w => assert.match(w, /^[A-Z]+$/, `${b.id}: word "${w}" must be capital letters only`));
    }
  }));
});

test('every game card in the Library has a registered game, and vice versa', () => {
  const games = registeredGames();
  const cards = [...read('index.html').matchAll(/data-game="([\w-]+)"/g)].map(m => m[1]);
  assert.equal(new Set(cards).size, cards.length, 'no duplicate game cards');
  cards.forEach(c => assert.ok(games.has(c), `card "${c}" has no registered game`));
  games.forEach(g => assert.ok(cards.includes(g), `game "${g}" is registered but has no card in the Library`));
});

test('every Bible text file that exists is valid JSON with real verses', () => {
  let checked = 0;
  BOOKS.forEach(([book, count], i) => {
    for (let c = 1; c <= count; c++) {
      const f = chapterFile('KJV', i, book, c);
      if (!f) continue;
      const data = JSON.parse(read(f));
      assert.ok(Array.isArray(data.verses) && data.verses.length > 0, `${f}: no verses`);
      data.verses.forEach(v => assert.ok(Number.isInteger(v.verse) && typeof v.text === 'string' && v.text.trim(), `${f}: bad verse entry`));
      checked++;
    }
  });
  assert.ok(checked > 0, 'no KJV text found at all');
});

test('every chapter the Story sends readers to has KJV text (no dead ends)', () => {
  const idx = Object.fromEntries(BOOKS.map(([n], i) => [n, i]));
  STORY_ARCS.forEach(arc => arc.beats.filter(b => b.chapters).forEach(b => b.chapters.forEach(([book, ch]) => {
    assert.ok(chapterFile('KJV', idx[book], book, ch), `${b.id}: ${book} ${ch} has no KJV text file`);
  })));
});

test('KJV is complete (warns when chapters are missing; set STRICT_KJV=1 to fail)', () => {
  const missing = [];
  BOOKS.forEach(([book, count], i) => {
    for (let c = 1; c <= count; c++) if (!chapterFile('KJV', i, book, c)) missing.push(`${book} ${c}`);
  });
  if (missing.length) {
    const msg = `KJV text is missing ${missing.length} of ${TOTAL_CHAPTERS} chapters (first few: ${missing.slice(0, 6).join(', ')}). Those chapters will not load in the Bible tab.`;
    if (process.env.STRICT_KJV) assert.fail(msg);
    warn(msg);
  }
});
