// The game packs that ship with the app (Genesis 1-50 today; add Exodus, Matthew,
// ... the same way). These checks keep every pack well-formed and fair, so a typo
// in a new pack fails here instead of showing up as a broken Game tab.
//
// To add a book: create js/packs/<book>.js (copy the shape of genesis.js), load it in
// index.html and sw.js right after js/packs/genesis.js, and list it in
// tests/unit/helpers/load.js. Everything below then covers it automatically.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadCore } = require('./helpers/load');

const { BOOKS, BUILTIN_PACKS } = loadCore();
const entries = Object.entries(BUILTIN_PACKS);
const split = key => { const i = key.lastIndexOf('-'); return [key.slice(0, i), parseInt(key.slice(i + 1), 10)]; };
const lower = s => s.trim().toLowerCase();

test('Genesis: every chapter from 1 to 50 has a built-in game pack', () => {
  const missing = [];
  for (let c = 1; c <= 50; c++) if (!BUILTIN_PACKS['Genesis-' + c]) missing.push(c);
  assert.deepEqual(missing, [], `Genesis chapters without a pack: ${missing.join(', ')}`);
});

test('every built-in pack belongs to a real chapter of a real book', () => {
  for (const [key] of entries) {
    const [book, chapter] = split(key);
    const row = BOOKS.find(b => b[0] === book);
    assert.ok(row, `${key}: "${book}" is not a book in data.js`);
    assert.ok(Number.isInteger(chapter) && chapter >= 1 && chapter <= row[1], `${key}: ${book} has ${row[1]} chapters`);
  }
});

test('every pack has the shape the Game tab expects', () => {
  for (const [key, pack] of entries) {
    assert.ok(Array.isArray(pack.sections) && pack.sections.length >= 1 && pack.sections.length <= 3, `${key}: 1-3 matching sections`);
    pack.sections.forEach((sec, si) => {
      const where = `${key} section ${si + 1}`;
      assert.ok(sec.heading && sec.heading.length <= 40, `${where}: needs a heading of 40 characters or fewer`);
      assert.ok(sec.matching && sec.matching.prompt, `${where}: needs matching.prompt`);
      const pairs = sec.matching.pairs;
      assert.ok(Array.isArray(pairs) && pairs.length >= 2 && pairs.length <= 6, `${where}: 2-6 pairs (the tap layout is small)`);
      pairs.forEach((pr, pi) => {
        assert.ok(Array.isArray(pr) && pr.length === 2, `${where} pair ${pi + 1}: must be [left, right]`);
        assert.ok(typeof pr[0] === 'string' && pr[0].trim() && pr[0].length <= 40, `${where} pair ${pi + 1}: left text 1-40 characters`);
        assert.ok(typeof pr[1] === 'string' && pr[1].trim() && pr[1].length <= 55, `${where} pair ${pi + 1}: right text 1-55 characters`);
      });
      assert.equal(new Set(pairs.map(p => lower(p[0]))).size, pairs.length, `${where}: two pairs share the same left text`);
      assert.equal(new Set(pairs.map(p => lower(p[1]))).size, pairs.length, `${where}: two pairs share the same right text`);
    });

    assert.equal(pack.quiz.length, 5, `${key}: the quick quiz is 5 questions`);
    pack.quiz.forEach((qu, qi) => {
      const where = `${key} question ${qi + 1}`;
      assert.ok(qu.q && qu.q.trim().endsWith('?') && qu.q.length <= 130, `${where}: a question ending in "?" of at most 130 characters`);
      assert.equal(qu.options.length, 4, `${where}: needs 4 options`);
      assert.equal(new Set(qu.options.map(lower)).size, 4, `${where}: two options are the same`);
      qu.options.forEach(o => assert.ok(typeof o === 'string' && o.trim() && o.length <= 70, `${where}: each option is 1-70 characters`));
      assert.ok(Number.isInteger(qu.answer) && qu.answer >= 0 && qu.answer < 4, `${where}: answer must be 0-3`);
    });
  }
});

test('pack text is clean: no stray spaces, markup, or placeholders', () => {
  const strings = [];
  for (const [key, pack] of entries) {
    pack.sections.forEach(s => { strings.push([key, s.heading], [key, s.matching.prompt]); s.matching.pairs.forEach(p => strings.push([key, p[0]], [key, p[1]])); });
    pack.quiz.forEach(qu => { strings.push([key, qu.q]); qu.options.forEach(o => strings.push([key, o])); });
  }
  for (const [key, t] of strings) {
    assert.equal(t, t.trim(), `${key}: leading/trailing space in "${t}"`);
    assert.ok(!/\s{2,}/.test(t), `${key}: double space in "${t}"`);
    assert.ok(!/[<>]/.test(t), `${key}: markup characters in "${t}"`);
    assert.ok(!/undefined|\[object|TODO|XXX/i.test(t), `${key}: placeholder text in "${t}"`);
  }
});

test('correct answers are spread across A, B, C and D', () => {
  const counts = [0, 0, 0, 0];
  entries.forEach(([, p]) => p.quiz.forEach(qu => counts[qu.answer]++));
  const total = counts.reduce((a, b) => a + b, 0);
  counts.forEach((c, i) => {
    const share = c / total;
    assert.ok(share >= 0.15 && share <= 0.35, `option ${'ABCD'[i]} is the answer ${(share * 100).toFixed(0)}% of the time (${counts})`);
  });
});

test('the correct answer is not given away by being the longest option', () => {
  let longest = 0, lopsided = [];
  let total = 0;
  for (const [key, p] of entries) p.quiz.forEach((qu, i) => {
    total++;
    const right = qu.options[qu.answer].length;
    const others = Math.max(...qu.options.filter((_, j) => j !== qu.answer).map(o => o.length));
    if (right > others) longest++;
    if (right >= others + 8 && right / others >= 1.3) lopsided.push(`${key} q${i + 1}`);
  });
  assert.ok(longest / total <= 0.4, `the right answer is the longest option in ${(longest / total * 100).toFixed(0)}% of questions (chance is about 25%)`);
  assert.ok(lopsided.length <= 3, `right answer is far longer than the others in: ${lopsided.join(', ')}. Make the wrong options as specific as the right one.`);
});

test('built-in packs are looked up, not copied into the reader’s saved data', () => {
  const { Storage, BUILTIN_PACKS: packs } = loadCore();
  Storage.load();
  assert.deepEqual(Object.keys(Storage.state.gameData), ['Genesis-1'], 'only the Genesis 1 starter pack is seeded into saved data');
  assert.equal(Storage.getPack('Genesis-30'), packs['Genesis-30']);
  assert.equal(Storage.getPack('Exodus-1'), null);
  assert.ok(Object.keys(Storage.allPacks()).length >= 50);
});

test('a pack the reader imports replaces the built-in one for that chapter only', () => {
  const { Storage, BUILTIN_PACKS: packs } = loadCore();
  Storage.load();
  const mine = { sections: [{ heading: 'Mine', matching: { prompt: 'p', pairs: [['a', 'b'], ['c', 'd']] } }], quiz: [] };
  Storage.importGamePack('Genesis', 30, JSON.stringify(mine));
  assert.equal(Storage.getPack('Genesis-30').sections[0].heading, 'Mine');
  assert.equal(Storage.allPacks()['Genesis-30'].sections[0].heading, 'Mine');
  assert.equal(Storage.getPack('Genesis-29'), packs['Genesis-29'], 'other chapters still use the built-in pack');
});
