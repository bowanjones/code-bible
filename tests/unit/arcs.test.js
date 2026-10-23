// Story arcs: the guided path through the Bible. These checks keep every arc
// well-formed so a typo in a new arc fails here instead of breaking someone’s
// reading plan. They run over ALL arcs (story-data.js plus js/arcs/*.js).
//
// To add an arc: copy the shape of js/arcs/genesis-10-50.js, load the file in
// index.html and sw.js right after the other arc files, and list it in
// tests/unit/helpers/load.js. Everything below then covers it automatically.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadCore, ROOT } = require('./helpers/load');

const { STORY_ARCS } = loadCore();
const reads = STORY_ARCS.flatMap(a => a.beats.filter(b => b.type === 'read').map(b => ({ arc: a, beat: b })));

// Verse counts come from the KJV text that ships with the app.
function kjvVerseCount(chapter) {
  const dir = fs.readdirSync(path.join(ROOT, 'versions', 'KJV')).find(d => d.endsWith('-Genesis'));
  const file = path.join(ROOT, 'versions', 'KJV', dir, 'Chapters', `Genesis-${chapter}.json`);
  return JSON.parse(fs.readFileSync(file, 'utf8')).verses.length;
}

test('the Story reaches every chapter of Genesis, 1 through 50', () => {
  const covered = new Set(reads.map(r => r.beat.chapters[0][1]));
  const missing = [];
  for (let c = 1; c <= 50; c++) if (!covered.has(c)) missing.push(c);
  assert.deepEqual(missing, [], `Genesis chapters with no reading stop: ${missing.join(', ')}`);
});

test('arcs run in reading order, never going back or skipping a chapter', () => {
  let last = 0;
  for (const { arc, beat } of reads) {
    const c = beat.chapters[0][1];
    assert.ok(c === last || c === last + 1, `${arc.id} / ${beat.id}: jumps from Genesis ${last} to Genesis ${c}`);
    last = c;
  }
});

test('split chapters cover every verse exactly once, with no gaps or overlaps', () => {
  const byChapter = {};
  reads.forEach(r => (byChapter[r.beat.chapters[0][1]] = byChapter[r.beat.chapters[0][1]] || []).push(r.beat));
  for (const [chapter, stops] of Object.entries(byChapter)) {
    if (stops.length === 1 && !stops[0].verses) continue;                       // a whole chapter in one stop
    let expectedStart = 1;
    stops.forEach(s => {
      assert.ok(s.verses, `Genesis ${chapter}: ${s.id} mixes a whole-chapter stop with split stops`);
      assert.equal(s.verses[0], expectedStart, `Genesis ${chapter}: ${s.id} should start at verse ${expectedStart}`);
      assert.ok(s.verses[1] >= s.verses[0], `${s.id}: end verse before start verse`);
      expectedStart = s.verses[1] + 1;
    });
    assert.equal(expectedStart - 1, kjvVerseCount(chapter), `Genesis ${chapter}: stops end at verse ${expectedStart - 1} but the chapter has ${kjvVerseCount(chapter)}`);
  }
});

test('only the last stop of a split chapter is flagged lastSegment', () => {
  for (const { beat } of reads) {
    if (!beat.verses) { assert.ok(!beat.lastSegment, `${beat.id}: whole-chapter stops must not set lastSegment`); continue; }
    const total = kjvVerseCount(beat.chapters[0][1]);
    assert.equal(!!beat.lastSegment, beat.verses[1] === total, `${beat.id}: lastSegment should be ${beat.verses[1] === total} (verses ${beat.verses[0]}-${beat.verses[1]} of ${total})`);
  }
});

test('each reading label names the chapter and verses it opens', () => {
  for (const { beat } of reads) {
    const c = beat.chapters[0][1];
    const want = beat.verses ? `Genesis ${c}:${beat.verses[0]}-${beat.verses[1]}` : `Genesis ${c}`;
    assert.ok(beat.label.startsWith(`Read ${want} `), `${beat.id}: label should start "Read ${want} …" but is "${beat.label}"`);
  }
});

test('each arc’s range text matches the chapters it reads', () => {
  for (const arc of STORY_ARCS) {
    const cs = arc.beats.filter(b => b.type === 'read').map(b => b.chapters[0][1]);
    const lo = Math.min(...cs), hi = Math.max(...cs);
    assert.equal(arc.range, lo === hi ? `Genesis ${lo}` : `Genesis ${lo}–${hi}`, `${arc.id}: range`);
  }
});

test('each arc ends with one recap followed by a finale game', () => {
  for (const arc of STORY_ARCS) {
    const types = arc.beats.map(b => b.type);
    assert.equal(types.filter(t => t === 'summary').length, 1, `${arc.id}: exactly one recap`);
    assert.equal(types[types.length - 2], 'summary', `${arc.id}: the recap comes second to last`);
    assert.equal(types[types.length - 1], 'game', `${arc.id}: the last stop is a finale game`);
  }
});

test('every reading has a devotional, and devotional text is a sensible length', () => {
  for (const { beat } of reads) assert.ok(beat.devotional, `${beat.id}: missing devotional`);
  for (const arc of STORY_ARCS) for (const b of arc.beats) {
    if (!b.devotional) continue;
    const { reflection, question } = b.devotional;
    assert.ok(reflection && reflection.length >= 120 && reflection.length <= 520, `${b.id}: reflection should be 120-520 characters (is ${reflection && reflection.length})`);
    assert.ok(question && question.trim().endsWith('?') && question.length <= 230, `${b.id}: question should end with "?" and be under 230 characters`);
    if (b.type === 'summary') assert.ok(b.recap.length >= 250 && b.recap.length <= 900, `${b.id}: recap should be 250-900 characters (is ${b.recap.length})`);
    assert.ok(!/[<>]/.test(b.label + reflection + question + (b.recap || '')), `${b.id}: text is shown as HTML, so it can’t contain < or >`);
  }
});

test('the Story never sends readers to a game that is still “In the works”', () => {
  const stubs = new Set();
  const files = ['js/games.js', ...fs.readdirSync(path.join(ROOT, 'js', 'games')).map(f => 'js/games/' + f)];
  files.filter(f => f.endsWith('.js')).forEach(f => {
    fs.readFileSync(path.join(ROOT, f), 'utf8').split('GameRegistry.register(').slice(1).forEach(chunk => {
      const id = (chunk.match(/id:\s*'([^']+)'/) || [])[1];
      if (id && /stub:\s*true/.test(chunk.slice(0, chunk.indexOf('mount') > 0 ? chunk.indexOf('mount') : 400))) stubs.add(id);
    });
  });
  for (const arc of STORY_ARCS) for (const b of arc.beats) {
    if (b.type === 'game') assert.ok(!stubs.has(b.gameId), `${b.id}: "${b.gameId}" is a placeholder game, so the reader would hit a dead end`);
  }
});

test('word searches and unscrambles have usable words', () => {
  for (const arc of STORY_ARCS) for (const b of arc.beats) {
    const lists = [];
    if (b.wordSet) lists.push([`${b.id} word search`, b.wordSet.words, 6]);
    if (b.scrambleWords) lists.push([`${b.id} unscramble`, b.scrambleWords, 5]);
    for (const [name, list, min] of lists) {
      assert.ok(Array.isArray(list) && list.length >= min, `${name}: needs at least ${min} words`);
      list.forEach(w => assert.match(w, /^[A-Z]{3,13}$/, `${name}: "${w}" must be 3-13 capital letters, no spaces or punctuation`));
      assert.equal(new Set(list).size, list.length, `${name}: duplicate word`);
    }
    if (b.wordSet) assert.ok(b.wordSet.name, `${b.id}: word search needs a name`);
  }
});

test('every crossword is a valid grid: letters agree, nothing touches by accident, everything connects', () => {
  const grids = STORY_ARCS.flatMap(a => a.beats.filter(b => b.crossword).map(b => ({ id: b.id, words: b.crossword })));
  assert.ok(grids.length >= 13, `expected the 13 finale crosswords (Noah plus Babel through Egypt) but found ${grids.length}`);
  for (const { id, words } of grids) {
    assert.ok(words.length >= 3 && words.length <= 10, `${id}: 3-10 words`);
    const cells = new Map();                                                   // "r,c" -> { ch, owners }
    words.forEach((w, wi) => {
      assert.match(w.word, /^[A-Z]{3,13}$/, `${id}: "${w.word}" must be 3-13 capital letters`);
      assert.ok(w.clue && w.clue.length <= 100, `${id} ${w.word}: clue needed, 100 characters or fewer`);
      assert.ok(w.dir === 'across' || w.dir === 'down', `${id} ${w.word}: dir must be across or down`);
      assert.ok(Number.isInteger(w.row) && Number.isInteger(w.col), `${id} ${w.word}: row and col`);
      [...w.word].forEach((ch, i) => {
        const r = w.row + (w.dir === 'down' ? i : 0), c = w.col + (w.dir === 'across' ? i : 0), key = r + ',' + c;
        if (!cells.has(key)) cells.set(key, { ch, owners: [] });
        const cell = cells.get(key);
        assert.equal(cell.ch, ch, `${id}: ${w.word} clashes with another word at row ${r}, col ${c}`);
        assert.ok(!cell.owners.some(o => words[o].dir === w.dir), `${id}: ${w.word} runs along another ${w.dir} word`);
        cell.owners.push(wi);
      });
    });
    assert.equal(new Set(words.map(w => w.word)).size, words.length, `${id}: duplicate word`);
    for (const [key, cell] of cells) {                                         // touching cells must belong to one word
      const [r, c] = key.split(',').map(Number);
      for (const [dr, dc] of [[0, 1], [1, 0]]) {
        const n = cells.get((r + dr) + ',' + (c + dc));
        if (n) assert.ok(cell.owners.some(o => n.owners.includes(o)), `${id}: letters at ${key} and ${(r + dr)},${(c + dc)} touch without being one word`);
      }
    }
    const parent = words.map((_, i) => i);                                     // connectivity
    const find = i => (parent[i] === i ? i : (parent[i] = find(parent[i])));
    for (const cell of cells.values()) cell.owners.slice(1).forEach(o => (parent[find(o)] = find(cell.owners[0])));
    assert.equal(new Set(words.map((_, i) => find(i))).size, 1, `${id}: some words are not connected to the rest of the grid`);
    const rs = [...cells.keys()].map(k => +k.split(',')[0]), cs = [...cells.keys()].map(k => +k.split(',')[1]);
    assert.ok(Math.max(...rs) - Math.min(...rs) < 14 && Math.max(...cs) - Math.min(...cs) < 14, `${id}: grid is larger than 14 x 14`);
  }
});
