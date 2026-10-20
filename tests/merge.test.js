const assert = require('assert');
const { mergeStates, stateHash, canonicalJSON } = require('../js/cloud.js');
let n = 0; const t = (name, fn) => { fn(); n++; console.log('ok -', name); };
const base = () => ({ progress:{}, notes:{}, verseNotes:{}, devotionals:{}, gameData:{}, highScores:{}, friends:[], lastReadDate:null, streak:0, theme:'light', textSize:'medium', bibleVersion:'KJV', versionChosen:false, storyProgress:{completedBeats:{}} });

t('progress is a union', () => {
  const a = base(), b = base(); a.progress['Genesis-1']=true; b.progress['Genesis-2']=true;
  assert.deepStrictEqual(Object.keys(mergeStates(a,b).progress).sort(), ['Genesis-1','Genesis-2']);
});
t('story beats union', () => {
  const a = base(), b = base(); a.storyProgress.completedBeats.x=true; b.storyProgress.completedBeats.y=true;
  assert.deepStrictEqual(Object.keys(mergeStates(a,b).storyProgress.completedBeats).sort(), ['x','y']);
});
t('verse notes: union by id, newest edit wins, none lost', () => {
  const a = base(), b = base();
  a.verseNotes['Genesis-1'] = [{id:'n1',verses:[1],text:'old',createdAt:1},{id:'n2',verses:[2],text:'only local',createdAt:2}];
  b.verseNotes['Genesis-1'] = [{id:'n1',verses:[1],text:'edited',createdAt:1,updatedAt:50},{id:'n3',verses:[3],text:'only cloud',createdAt:3}];
  const m = mergeStates(a,b).verseNotes['Genesis-1'];
  assert.strictEqual(m.length, 3);
  assert.strictEqual(m.find(x=>x.id==='n1').text, 'edited');
});
t('devotional: newest wins', () => {
  const a = base(), b = base();
  a.devotionals.d1 = {id:'d1',text:'local',updatedAt:10}; b.devotionals.d1 = {id:'d1',text:'cloud',updatedAt:99};
  assert.strictEqual(mergeStates(a,b).devotionals.d1.text, 'cloud');
  assert.strictEqual(mergeStates(b,a).devotionals.d1.text, 'cloud');
});
t('general notes: identical or contained text is not duplicated', () => {
  const a = base(), b = base(); a.notes['Genesis-1']='Same'; b.notes['Genesis-1']='Same';
  assert.strictEqual(mergeStates(a,b).notes['Genesis-1'], 'Same');
  a.notes['Genesis-1']='Same plus more'; assert.strictEqual(mergeStates(a,b).notes['Genesis-1'], 'Same plus more');
});
t('general notes: different text keeps both', () => {
  const a = base(), b = base(); a.notes['Exodus-1']='phone thought'; b.notes['Exodus-1']='laptop thought';
  const m = mergeStates(a,b).notes['Exodus-1']; assert(m.includes('phone thought') && m.includes('laptop thought'));
});
t('re-merging is stable (no growth)', () => {
  const a = base(), b = base(); a.notes['X-1']='one'; b.notes['X-1']='two';
  const m1 = mergeStates(a,b), m2 = mergeStates(m1,b), m3 = mergeStates(m2,m1);
  assert.strictEqual(m3.notes['X-1'], m1.notes['X-1']);
});
t('high scores keep the max; friends union by id', () => {
  const a = base(), b = base(); a.highScores.g=5; b.highScores.g=9; b.highScores.h=1;
  a.friends=[{id:'f1',name:'A'}]; b.friends=[{id:'f1',name:'A'},{id:'f2',name:'B'}];
  const m = mergeStates(a,b);
  assert.deepStrictEqual(m.highScores,{g:9,h:1}); assert.strictEqual(m.friends.length,2);
});
t('streak follows the most recent reader', () => {
  const a = base(), b = base(); a.lastReadDate='Sat Oct 03 2026'; a.streak=2; b.lastReadDate='Sun Oct 04 2026'; b.streak=7;
  const m = mergeStates(a,b); assert.strictEqual(m.streak,7); assert.strictEqual(m.lastReadDate,'Sun Oct 04 2026');
});
t('fresh device does not overwrite chosen settings', () => {
  const fresh = base(), saved = base(); saved.versionChosen=true; saved.bibleVersion='ESV'; saved.theme='dark'; saved.textSize='large';
  const m = mergeStates(fresh, saved); assert.strictEqual(m.bibleVersion,'ESV'); assert.strictEqual(m.theme,'dark'); assert.strictEqual(m.textSize,'large'); assert.strictEqual(m.versionChosen,true);
});
t('device that already chose keeps its own settings', () => {
  const mine = base(), other = base(); mine.versionChosen=true; mine.bibleVersion='KJV'; other.versionChosen=true; other.bibleVersion='NIV';
  assert.strictEqual(mergeStates(mine,other).bibleVersion,'KJV');
});
t('merging with empty/undefined sides is safe', () => {
  const a = base(); a.progress['Genesis-1']=true;
  assert.strictEqual(mergeStates(a,{}).progress['Genesis-1'],true);
  assert.strictEqual(mergeStates(undefined,a).progress['Genesis-1'],true);
  assert.strictEqual(mergeStates({},{}).friends.length,0);
});
t('hash ignores key order (jsonb reorders keys)', () => {
  assert.strictEqual(stateHash({a:1,b:{c:2,d:[1,2]}}), stateHash({b:{d:[1,2],c:2},a:1}));
  assert.notStrictEqual(stateHash({a:1}), stateHash({a:2}));
});
console.log(`\n${n} passed`);
