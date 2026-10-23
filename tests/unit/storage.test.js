// js/storage.js: progress, streaks, notes, devotionals, scores, friends.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadCore, memoryStorage } = require('./helpers/load');

function fresh() {
  const app = loadCore();
  app.Storage.load();
  return app;
}
// Objects built inside the vm sandbox have a different prototype; compare plain copies.
const plain = x => JSON.parse(JSON.stringify(x));
const day = offset => { const d = new Date(); d.setDate(d.getDate() + offset); return d.toDateString(); };

test('first load seeds the Genesis 1 game pack and starter note', () => {
  const { Storage } = fresh();
  assert.ok(Storage.state.gameData['Genesis-1']);
  assert.match(Storage.state.notes['Genesis-1'], /seven days of creation/);
});

test('markRead toggles a chapter and reports the new state', () => {
  const { Storage } = fresh();
  assert.equal(Storage.markRead('Genesis', 1), true);
  assert.equal(Storage.state.progress['Genesis-1'], true);
  assert.equal(Storage.markRead('Genesis', 1), false);
  assert.equal(Storage.state.progress['Genesis-1'], undefined);
});

test('streak: starts at 1, same day does not add, next day adds, a gap resets', () => {
  const { Storage } = fresh();
  Storage.markRead('Genesis', 1);
  assert.equal(Storage.state.streak, 1);
  Storage.markRead('Genesis', 2);
  assert.equal(Storage.state.streak, 1, 'second chapter the same day');

  Storage.state.lastReadDate = day(-1); Storage.state.streak = 4;
  Storage.markRead('Genesis', 3);
  assert.equal(Storage.state.streak, 5, 'read yesterday -> streak continues');

  Storage.state.lastReadDate = day(-3); Storage.state.streak = 9;
  Storage.markRead('Genesis', 4);
  assert.equal(Storage.state.streak, 1, 'missed days -> streak resets');
});

test('marking a chapter read never completes Story stops by itself', () => {
  const { Storage, StoryEngine } = fresh();
  StoryEngine.allBeatsFlat().filter(b => b.type === 'read' && b.chapters).forEach(b => {
    Storage.markRead(b.chapters[0][0], b.chapters[0][1]);
  });
  assert.equal(Object.keys(Storage.state.storyProgress.completedBeats).length, 0);
});

test('save() persists and a new load() restores it', () => {
  const ls = memoryStorage();
  const a = loadCore({ localStorage: ls }); a.Storage.load();
  a.Storage.markRead('John', 3); a.Storage.setNotes('John', 3, 'for God so loved');
  const b = loadCore({ localStorage: ls }); b.Storage.load();
  assert.equal(b.Storage.state.progress['John-3'], true);
  assert.equal(b.Storage.state.notes['John-3'], 'for God so loved');
});

test('a corrupted save does not crash loading', () => {
  const ls = memoryStorage({ 'bible-companion-v1': '{not json' });
  const { Storage } = loadCore({ localStorage: ls });
  assert.doesNotThrow(() => Storage.load());
  assert.deepEqual(plain(Storage.state.progress), {});
});

test('verse notes: add (sorted), update (stamps updatedAt), delete, list', () => {
  const { Storage } = fresh();
  const n = Storage.addVerseNote('Genesis', 1, [3, 1, 2], 'hello');
  assert.deepEqual(plain(n.verses), [1, 2, 3]);
  assert.ok(n.id && n.createdAt);
  assert.equal(Storage.getVerseNotes('Genesis', 1).length, 1);

  Storage.updateVerseNote('Genesis', 1, n.id, 'changed');
  assert.equal(Storage.getVerseNotes('Genesis', 1)[0].text, 'changed');
  assert.ok(Storage.getVerseNotes('Genesis', 1)[0].updatedAt);

  Storage.addVerseNote('Exodus', 2, [5], 'x');
  const all = Storage.allVerseNotes();
  assert.equal(all.length, 2);
  assert.ok(all.every(x => x.chapterKey));

  Storage.deleteVerseNote('Genesis', 1, n.id);
  assert.equal(Storage.getVerseNotes('Genesis', 1).length, 0);
});

test('devotionals: one entry per stop; editing keeps createdAt; empty text deletes', () => {
  const { Storage } = fresh();
  const meta = { book: 'Genesis', chapter: 1, label: 'L', question: 'Q' };
  const first = Storage.saveDevotional('b1', meta, '  my answer  ');
  assert.equal(first.text, 'my answer');
  const again = Storage.saveDevotional('b1', meta, 'edited');
  assert.equal(again.createdAt, first.createdAt);
  assert.equal(Storage.allDevotionals().length, 1);
  assert.equal(Storage.saveDevotional('b1', meta, '   '), null);
  assert.equal(Storage.getDevotional('b1'), null);
});

test('high scores only ever go up', () => {
  const { Storage } = fresh();
  assert.equal(Storage.saveHighScore('g', 10), true);
  assert.equal(Storage.saveHighScore('g', 5), false);
  assert.equal(Storage.saveHighScore('g', 10), false);
  assert.equal(Storage.saveHighScore('g', 11), true);
  assert.equal(Storage.getHighScore('g'), 11);
  assert.equal(Storage.getHighScore('never-played'), 0);
});

test('friends: trimmed, blank rejected, sorted by name, removable', () => {
  const { Storage } = fresh();
  assert.equal(Storage.addFriend('   ', 'x'), null);
  Storage.addFriend('  Zed ', ' note ');
  Storage.addFriend('Amy', '');
  assert.deepEqual(plain(Storage.allFriends().map(f => f.name)), ['Amy', 'Zed']);
  assert.equal(Storage.allFriends()[1].note, 'note');
  Storage.removeFriend(Storage.allFriends()[0].id);
  assert.deepEqual(plain(Storage.allFriends().map(f => f.name)), ['Zed']);
});

test('story stops complete only through completeBeat', () => {
  const { Storage } = fresh();
  assert.equal(Storage.isBeatComplete('x'), false);
  Storage.completeBeat('x');
  assert.equal(Storage.isBeatComplete('x'), true);
});

test('importGamePack stores valid JSON and rejects invalid JSON', () => {
  const { Storage } = fresh();
  Storage.importGamePack('Exodus', 3, '{"sections":[],"quiz":[]}');
  assert.deepEqual(plain(Storage.state.gameData['Exodus-3']), { sections: [], quiz: [] });
  assert.throws(() => Storage.importGamePack('Exodus', 4, '{oops'));
  assert.equal(Storage.state.gameData['Exodus-4'], undefined);
});
