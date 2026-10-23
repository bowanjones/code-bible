// Cloud-sync merge rules (js/cloud.js). If two devices edit at once, nothing
// either one wrote may be lost. These are the rules that protect people's notes.
const test = require('node:test');
const assert = require('node:assert/strict');
const { mergeStates, stateHash, mergeText } = require('../../js/cloud.js');

const base = () => ({
  progress: {}, notes: {}, verseNotes: {}, devotionals: {}, gameData: {}, highScores: {},
  friends: [], lastReadDate: null, streak: 0, theme: 'light', textSize: 'medium',
  bibleVersion: 'KJV', versionChosen: false, storyProgress: { completedBeats: {} }
});

test('chapters read are combined from both sides', () => {
  const a = base(), b = base();
  a.progress['Genesis-1'] = true; b.progress['Genesis-2'] = true;
  assert.deepEqual(Object.keys(mergeStates(a, b).progress).sort(), ['Genesis-1', 'Genesis-2']);
});

test('completed story stops are combined', () => {
  const a = base(), b = base();
  a.storyProgress.completedBeats.x = true; b.storyProgress.completedBeats.y = true;
  assert.deepEqual(Object.keys(mergeStates(a, b).storyProgress.completedBeats).sort(), ['x', 'y']);
});

test('verse notes: union by id, newest edit wins, none lost', () => {
  const a = base(), b = base();
  a.verseNotes['Genesis-1'] = [{ id: 'n1', verses: [1], text: 'old', createdAt: 1 }, { id: 'n2', verses: [2], text: 'only local', createdAt: 2 }];
  b.verseNotes['Genesis-1'] = [{ id: 'n1', verses: [1], text: 'edited', createdAt: 1, updatedAt: 50 }, { id: 'n3', verses: [3], text: 'only cloud', createdAt: 3 }];
  const m = mergeStates(a, b).verseNotes['Genesis-1'];
  assert.equal(m.length, 3);
  assert.equal(m.find(n => n.id === 'n1').text, 'edited');
});

test('devotionals: the most recent edit wins from either direction', () => {
  const a = base(), b = base();
  a.devotionals.d1 = { id: 'd1', text: 'local', updatedAt: 10 };
  b.devotionals.d1 = { id: 'd1', text: 'cloud', updatedAt: 99 };
  assert.equal(mergeStates(a, b).devotionals.d1.text, 'cloud');
  assert.equal(mergeStates(b, a).devotionals.d1.text, 'cloud');
});

test('chapter notes: identical or contained text is not duplicated', () => {
  const a = base(), b = base();
  a.notes['Genesis-1'] = 'Same'; b.notes['Genesis-1'] = 'Same';
  assert.equal(mergeStates(a, b).notes['Genesis-1'], 'Same');
  a.notes['Genesis-1'] = 'Same plus more';
  assert.equal(mergeStates(a, b).notes['Genesis-1'], 'Same plus more');
});

test('chapter notes: genuinely different text keeps both', () => {
  const a = base(), b = base();
  a.notes['Exodus-1'] = 'phone thought'; b.notes['Exodus-1'] = 'laptop thought';
  const m = mergeStates(a, b).notes['Exodus-1'];
  assert.ok(m.includes('phone thought') && m.includes('laptop thought'));
});

test('merging again never makes notes grow (stable)', () => {
  const a = base(), b = base();
  a.notes['X-1'] = 'one'; b.notes['X-1'] = 'two';
  const m1 = mergeStates(a, b), m2 = mergeStates(m1, b), m3 = mergeStates(m2, m1);
  assert.equal(m3.notes['X-1'], m1.notes['X-1']);
});

test('high scores keep the best; friends are combined by id', () => {
  const a = base(), b = base();
  a.highScores.g = 5; b.highScores.g = 9; b.highScores.h = 1;
  a.friends = [{ id: 'f1', name: 'A' }]; b.friends = [{ id: 'f1', name: 'A' }, { id: 'f2', name: 'B' }];
  const m = mergeStates(a, b);
  assert.deepEqual(m.highScores, { g: 9, h: 1 });
  assert.equal(m.friends.length, 2);
});

test('streak follows whichever side read most recently', () => {
  const a = base(), b = base();
  a.lastReadDate = 'Sat Oct 03 2026'; a.streak = 2;
  b.lastReadDate = 'Sun Oct 04 2026'; b.streak = 7;
  const m = mergeStates(a, b);
  assert.equal(m.streak, 7);
  assert.equal(m.lastReadDate, 'Sun Oct 04 2026');
});

test('a fresh device does not overwrite settings the account already chose', () => {
  const fresh = base(), saved = base();
  Object.assign(saved, { versionChosen: true, bibleVersion: 'ESV', theme: 'dark', textSize: 'large' });
  const m = mergeStates(fresh, saved);
  assert.deepEqual([m.bibleVersion, m.theme, m.textSize, m.versionChosen], ['ESV', 'dark', 'large', true]);
});

test('a device that already chose keeps its own settings', () => {
  const mine = base(), other = base();
  Object.assign(mine, { versionChosen: true, bibleVersion: 'KJV' });
  Object.assign(other, { versionChosen: true, bibleVersion: 'NIV' });
  assert.equal(mergeStates(mine, other).bibleVersion, 'KJV');
});

test('empty or missing sides are handled safely', () => {
  const a = base(); a.progress['Genesis-1'] = true;
  assert.equal(mergeStates(a, {}).progress['Genesis-1'], true);
  assert.equal(mergeStates(undefined, a).progress['Genesis-1'], true);
  assert.equal(mergeStates({}, {}).friends.length, 0);
});

test('merge does not modify its inputs', () => {
  const a = base(), b = base();
  a.progress['A-1'] = true; b.progress['B-1'] = true;
  const aCopy = JSON.stringify(a), bCopy = JSON.stringify(b);
  mergeStates(a, b);
  assert.equal(JSON.stringify(a), aCopy);
  assert.equal(JSON.stringify(b), bCopy);
});

test('state hash ignores key order (the database re-orders JSON keys)', () => {
  assert.equal(stateHash({ a: 1, b: { c: 2, d: [1, 2] } }), stateHash({ b: { d: [1, 2], c: 2 }, a: 1 }));
  assert.notEqual(stateHash({ a: 1 }), stateHash({ a: 2 }));
});

test('mergeText basics', () => {
  assert.equal(mergeText('', 'b'), 'b');
  assert.equal(mergeText('a', ''), 'a');
  assert.equal(mergeText('same', 'same'), 'same');
});
