// StoryEngine: how the campaign unlocks and what counts as "read".
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadCore } = require('./helpers/load');

function fresh() { const app = loadCore(); app.Storage.load(); return app; }
const completeUpTo = (app, beatId) => {
  for (const b of app.StoryEngine.allBeatsFlat()) { if (b.id === beatId) break; app.Storage.completeBeat(b.id); }
};

test('only the first stop of the first arc is open at the start', () => {
  const { StoryEngine, STORY_ARCS } = fresh();
  assert.equal(StoryEngine.isArcUnlocked(0), true);
  assert.equal(StoryEngine.isBeatUnlocked(STORY_ARCS[0], 0), true);
  assert.equal(StoryEngine.isBeatUnlocked(STORY_ARCS[0], 1), false);
  if (STORY_ARCS.length > 1) assert.equal(StoryEngine.isArcUnlocked(1), false);
});

test('nextUp advances one stop at a time and ends with null', () => {
  const app = fresh();
  const flat = app.StoryEngine.allBeatsFlat();
  assert.equal(app.StoryEngine.nextUp().beat.id, flat[0].id);
  app.Storage.completeBeat(flat[0].id);
  assert.equal(app.StoryEngine.nextUp().beat.id, flat[1].id);
  flat.forEach(b => app.Storage.completeBeat(b.id));
  assert.equal(app.StoryEngine.nextUp(), null);
});

test('finishing every stop of an arc unlocks the next arc', () => {
  const app = fresh();
  if (app.STORY_ARCS.length < 2) return;
  app.STORY_ARCS[0].beats.forEach(b => app.Storage.completeBeat(b.id));
  assert.equal(app.StoryEngine.isArcUnlocked(1), true);
  assert.equal(app.StoryEngine.arcProgress(app.STORY_ARCS[0]).done, app.STORY_ARCS[0].beats.length);
});

test('a story-gated game stays locked until the reader reaches its stop', () => {
  const app = fresh();
  const gated = app.StoryEngine.allBeatsFlat().filter(b => b.type === 'game' && b.gameId)
    .find(b => app.StoryEngine.findGameBeat(b.gameId).beatIndex > 0 || app.StoryEngine.findGameBeat(b.gameId).arcIndex > 0);
  assert.ok(gated, 'expected at least one story-gated game');
  assert.equal(app.StoryEngine.isGameUnlocked(gated.gameId), false);
  completeUpTo(app, gated.id);
  assert.equal(app.StoryEngine.isGameUnlocked(gated.gameId), true);
});

test('a game that is not part of the story is always free to play', () => {
  const app = fresh();
  assert.equal(app.StoryEngine.isGameUnlocked('a-game-with-no-story-stop'), true);
});

test('verses count as read only once their own reading stop is finished', () => {
  const app = fresh();
  const stop = app.StoryEngine.allBeatsFlat().find(b => b.type === 'read' && b.verses);
  const [book, chapter] = stop.chapters[0];
  const [from, to] = stop.verses;
  assert.equal(app.StoryEngine.isVerseRead(book, chapter, from), false);
  app.Storage.completeBeat(stop.id);
  assert.equal(app.StoryEngine.isVerseRead(book, chapter, from), true);
  assert.equal(app.StoryEngine.isVerseRead(book, chapter, to), true);
  assert.equal(app.StoryEngine.isVerseRead(book, chapter, to + 1000), false);
});

test('replaying an early game only offers what had been read by that point', () => {
  const app = fresh();
  const flat = app.StoryEngine.allBeatsFlat();
  const firstRead = flat.find(b => b.type === 'read' && b.verses);
  const firstGameAfter = flat.slice(flat.indexOf(firstRead)).find(b => b.type === 'game');
  const [book, chapter] = firstRead.chapters[0];
  flat.forEach(b => app.Storage.completeBeat(b.id));                 // reader finished everything
  assert.equal(app.StoryEngine.isVerseAvailableForBeat(book, chapter, firstRead.verses[0], firstGameAfter.id), true);
  const laterRead = flat.slice(flat.indexOf(firstGameAfter) + 1).find(b => b.type === 'read' && b.verses && b.chapters[0][0] === book && b.chapters[0][1] === chapter);
  if (laterRead) {
    assert.equal(app.StoryEngine.isVerseAvailableForBeat(book, chapter, laterRead.verses[0], firstGameAfter.id), false,
      'a later stop in the same chapter must not leak into an earlier game');
  }
});
