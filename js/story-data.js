// story-data.js
// The campaign spine. An "arc" is a stretch of narrative (Creation, the Exodus,
// David & Goliath...). Each arc is an ordered list of "beats". A beat is either:
//   { type: 'read', id, chapters: [[book, chapter], ...], verses?, lastSegment?, label, devotional? }
//     — complete by tapping "Next" from the Story reading screen itself.
//       Marking a chapter read from the Bible tab does NOT auto-complete
//       this (see storage.js markRead) — Story progress is tracked strictly
//       through the Story sequence, on purpose, so a chapter split into a
//       few reading stops can't all get marked done at once out of order.
//     `verses` (optional): [start, end] — when a chapter is split into a few
//       reading stops (e.g. Genesis 1's three "days" breaks), each stop is
//       its own beat covering just that slice. Only the stop with
//       `lastSegment: true` actually flips the chapter's real read-progress
//       (and so unlocks anything gated on "has this chapter been read") —
//       earlier stops just complete themselves and hand off to the next one.
//       Beats with no `verses` cover (and complete) the whole chapter, as before.
//     `devotional` (optional): { reflection, question } — a short paragraph plus
//       a guided question, shown in its own "Devotional" tab on the Story
//       reading screen. The reader's written response is saved per-beat
//       (Storage.saveDevotional) and shows up later in the Library's Notes
//       tab alongside verse notes, so it's easy to look back on.
//   { type: 'game', id, gameId, level, label, chapters? }
//     — complete by playing the linked game (from GameRegistry) at least once
//       and tapping "Mark complete" in the Story view. `gameId` matching a
//       chapter-game id ('matching' or 'quiz') opens that chapter's game pack
//       instead of the arcade view; `chapters` should be set in that case so
//       we know which chapter to open.
//
// Not every chapter needs a beat — skip genealogies/law codes and let people
// read those straight from the Bible tab. Reserve arcs for narrative stretches.
// Arcs unlock in order; within an arc, beats unlock in order.

const STORY_ARCS = [
  {
    id: 'creation',
    title: 'Creation & the Garden',
    range: 'Genesis 1–3',
    color: 'brass',
    beats: [
      { id: 'gen1a-read', type: 'read', chapters: [['Genesis', 1]], verses: [1, 8], label: 'Read Genesis 1:1-8 — Day 1: light; Day 2: the sky',
        devotional: {
          reflection: "God's first act is to speak light into darkness and put things in order. Creation doesn't start with a finished world — it starts with God stepping into formlessness and shaping it, one day at a time.",
          question: "Where do you need God's light and order in a chaotic or unformed part of your life right now?"
        } },
      { id: 'gen1a-game', type: 'game', gameId: 'fillblank', label: 'Play: fill in the blank' },
      { id: 'gen1b-read', type: 'read', chapters: [['Genesis', 1]], verses: [9, 19], label: 'Read Genesis 1:9-19 — Day 3: land & plants; Day 4: sun, moon, stars',
        devotional: {
          reflection: "God builds in rhythm here — land that produces seed after its own kind, lights that mark seasons and days and years. Provision and pattern show up before a single living creature exists to need them.",
          question: "What season of life do you feel you're in right now, and where have you actually seen God provide in it?"
        } },
      { id: 'gen1b-game', type: 'game', gameId: 'wordsearch', label: 'Play: word search',
        wordSet: { name: 'Days 3 & 4', words: ['LAND', 'SEAS', 'GRASS', 'TREES', 'SUN', 'MOON', 'STARS', 'SEASONS'] } },
      { id: 'gen1c-read', type: 'read', chapters: [['Genesis', 1]], verses: [20, 31], lastSegment: true, label: 'Read Genesis 1:20-31 — Day 5: sea & sky creatures; Day 6: land animals and humans',
        devotional: {
          reflection: 'Everything up to now was called "good." Only after humanity is made in God\'s own image does creation get called "very good." Your worth was never up for debate — it was declared on day six.',
          question: "What does it mean to you that you were made in God's image? Where is it hardest for you to actually believe that about yourself, or about someone else?"
        } },
      { id: 'gen1c-game', type: 'game', gameId: 'creationsort', label: 'Play: Sort of Creation — name the day, sort what God made' },

      { id: 'gen2a-read', type: 'read', chapters: [['Genesis', 2]], verses: [1, 17], label: 'Read Genesis 2:1-17 — the seventh day, the garden, and the two trees',
        devotional: {
          reflection: "God rests — not out of exhaustion, but to model it. Then he plants a garden and gives exactly one boundary: don't eat from this one tree. Even in paradise, love shows up as both provision and a limit.",
          question: "What's one boundary in your life that, like the tree in the garden, actually protects you rather than just restricting you?"
        } },
      { id: 'gen2a-game', type: 'game', gameId: 'unscramble', label: 'Play: unscramble',
        scrambleWords: ['GARDEN', 'EDEN', 'RIVER', 'REST', 'GOOD', 'EVIL', 'LIFE', 'KNOWLEDGE'] },
      { id: 'gen2b-read', type: 'read', chapters: [['Genesis', 2]], verses: [18, 25], lastSegment: true, label: 'Read Genesis 2:18-25 — naming the animals, and the first marriage',
        devotional: {
          reflection: '"It is not good that man should be alone" is the first thing in creation God calls "not good." Companionship isn\'t a nice extra — it\'s built into the design from the very beginning.',
          question: "Who are the people God has placed around you for companionship and support? Have you thanked God — or them — for that lately?"
        } },
      { id: 'gen2b-game', type: 'game', gameId: 'versebuilder', label: 'Play: rebuild the verse' },

      { id: 'gen3a-read', type: 'read', chapters: [['Genesis', 3]], verses: [1, 13], label: 'Read Genesis 3:1-13 — the serpent, the fruit, and the fall' ,
        devotional: {
          reflection: 'The serpent doesn\'t start with a command to disobey — he starts with a question that makes God\'s word sound uncertain: "Did God really say...?" Doubt, then desire, then the decision, all in a few short verses.',
          question: "What's a lie or half-truth you've believed that pulled you away from trusting God's word?"
        } },
      { id: 'gen3a-game', type: 'game', gameId: 'crossword', label: 'Play: crossword',
        crossword: [
          { word: 'FRUIT', clue: 'What Eve took from the tree and ate (Genesis 3:6)', row: 0, col: 0, dir: 'across' },
          { word: 'TREE', clue: 'Where the forbidden fruit grew', row: 0, col: 4, dir: 'down' },
          { word: 'EAT', clue: 'What the serpent tempted Eve to do with the fruit', row: 2, col: 4, dir: 'across' }
        ] },
      { id: 'gen3b-read', type: 'read', chapters: [['Genesis', 3]], verses: [14, 24], lastSegment: true, label: 'Read Genesis 3:14-24 — the curses, and the exile from Eden',
        devotional: {
          reflection: "Real consequences follow — but so does grace. God makes clothing for Adam and Eve himself (v.21), and even in the curse on the serpent, plants the first promise of a rescue still to come (v.15).",
          question: "Where in your life have you experienced God's grace even in the middle of consequences you brought on yourself?"
        } },

      { id: 'creation-summary', type: 'summary', label: 'Genesis 1-3: The Big Picture',
        recap: "In three chapters, the Bible moves from nothing to everything, and then to the first crack in it. Genesis 1 shows a God who speaks order into chaos and calls humanity — made in his own image — \u201cvery good.\u201d Genesis 2 zooms in on the details: rest, a garden built for people, and one loving boundary. Genesis 3 shows what happens when that boundary is crossed — doubt, desire, and a choice that changes everything. But even here, grace shows up before the story ends: God still clothes Adam and Eve, and plants the first promise that this isn't the end of the story.",
        devotional: {
          reflection: "Creation, the garden, and the fall are really one story: a good God who makes, provides, sets a boundary out of love, and doesn't walk away when that boundary gets crossed.",
          question: "Looking back at Genesis 1-3 as a whole, what's the one thing that stands out to you most about who God is?"
        } },

      { id: 'creation-finale', type: 'game', gameId: 'gardentrail',
        label: 'Arcade finale: Garden Trail' }
    ]
  },
  {
    id: 'adamline',
    title: "Cain, Abel & the Line of Adam",
    range: 'Genesis 4–5',
    color: 'brass',
    beats: [
      { id: 'gen4a-read', type: 'read', chapters: [['Genesis', 4]], verses: [1, 16], label: 'Read Genesis 4:1-16 — Cain, Abel, and the first murder',
        devotional: {
          reflection: '"Sin lies at the door, and its desire is for you, but you should rule over it" — God warns Cain before the murder, not after. The anger itself isn\'t the sin; what Cain does with it is.',
          question: "When you feel jealousy or anger rising, what actually helps you 'rule over it' before it rules over you?"
        } },
      { id: 'gen4a-game', type: 'game', gameId: 'wordsearch', label: 'Play: word search',
        wordSet: { name: 'Cain & Abel', words: ['CAIN', 'ABEL', 'OFFERING', 'ANGER', 'GROUND', 'MARK', 'EXILE', 'BROTHER'] } },
      { id: 'gen4b-read', type: 'read', chapters: [['Genesis', 4]], verses: [17, 26], lastSegment: true, label: "Read Genesis 4:17-26 — Cain's line, and the birth of Seth",
        devotional: {
          reflection: "Cain's line builds cities and culture but also boasts of violence (Lamech's song, v.23-24). Then Seth is born, and by the end of the chapter, people 'began to call upon the name of the LORD' again.",
          question: "What kind of legacy — spiritually — do you want to leave for the people who come after you?"
        } },
      { id: 'gen4b-game', type: 'game', gameId: 'memorymatch', label: 'Play: memory match' },

      { id: 'gen5a-read', type: 'read', chapters: [['Genesis', 5]], verses: [1, 24], label: 'Read Genesis 5:1-24 — the generations of Adam, down to Enoch',
        devotional: {
          reflection: 'This genealogy repeats one grim line over and over: "and he died." Then it breaks the pattern for Enoch — he "walked with God: and he was not; for God took him." One quiet, faithful life stands out from a very long list.',
          question: "What would it look like for you to 'walk with God' more closely this week?"
        } },
      { id: 'gen5a-game', type: 'game', gameId: 'fillblank', label: 'Play: fill in the blank' },
      { id: 'gen5b-read', type: 'read', chapters: [['Genesis', 5]], verses: [25, 32], lastSegment: true, label: 'Read Genesis 5:25-32 — Lamech, and the birth of Noah',
        devotional: {
          reflection: 'Lamech names his son Noah, hoping he\'ll bring "comfort" from the hard labor of life under the curse. After a chapter full of death, the story ends on a name that means hope for relief.',
          question: "Where do you need God's comfort or a fresh start right now?"
        } },
      { id: 'adamline-summary', type: 'summary', label: 'Genesis 4-5: The Big Picture',
        recap: "Genesis 4 and 5 trace two different paths after Eden. Cain's anger leads to the first murder, yet even then God shows mercy \u2014 marking Cain not to condemn him further but to protect his life. His line builds cities and boasts of violence, but Seth's birth reopens something: people \u201cbegan to call upon the name of the LORD.\u201d The long genealogy in Genesis 5 repeats one grim refrain, \u201cand he died,\u201d until it breaks for Enoch, who \u201cwalked with God: and he was not; for God took him.\u201d The chapter closes with the birth of Noah, whose name means comfort \u2014 setting up the next turn in the story.",
        devotional: {
          reflection: "Two brothers, two responses to God, and two very different family lines \u2014 but even the darker line eventually turns back toward worship, and one ordinary man's quiet, faithful life stands out from a very long list of names.",
          question: "Whose example in Genesis 4-5 \u2014 Cain's, Seth's, or Enoch's \u2014 feels most like a mirror for where you are right now?"
        } },

      { id: 'adamline-finale', type: 'game', gameId: 'farmplot',
        label: 'Arcade finale: Tend the Ground' }
    ]
  },
  {
    id: 'flood',
    title: 'Noah & the Flood',
    range: 'Genesis 6–9',
    color: 'game',
    beats: [
      { id: 'gen6a-read', type: 'read', chapters: [['Genesis', 6]], verses: [1, 8], label: "Read Genesis 6:1-8 — the world's corruption, and Noah's favor with God",
        devotional: {
          reflection: 'The world has gone thoroughly wrong, and God grieves it. In the middle of that bleak assessment, one line changes everything: "But Noah found grace in the eyes of the LORD."',
          question: "In what areas is it hardest for you to live differently from the people around you?"
        } },
      { id: 'gen6a-game', type: 'game', gameId: 'memorymatch', label: 'Play: memory match' },
      { id: 'gen6b-read', type: 'read', chapters: [['Genesis', 6]], verses: [9, 22], lastSegment: true, label: "Read Genesis 6:9-22 — God's instructions for the ark",
        devotional: {
          reflection: "God gives Noah exact, costly, sometimes strange instructions — for a flood that hasn't happened yet. Noah builds anyway. Obedience here means acting on what God says before the reason is fully visible.",
          question: "Is there something God has asked you to prepare for or obey, even if you don't yet see the reason why?"
        } },
      { id: 'gen6b-game', type: 'game', gameId: 'fillblank', label: 'Play: fill in the blank' },
      { id: 'gen7-read', type: 'read', chapters: [['Genesis', 7]], label: 'Read Genesis 7 — the flood comes',
        devotional: {
          reflection: 'The chapter repeats a quiet detail: Noah did "according unto all that God commanded him." Then comes the line that steadies everything: "and the LORD shut him in." God both asks for obedience and provides the safety.',
          question: "Where do you need to trust that God has you 'shut in' safely while the storm is still raging?"
        } },
      { id: 'gen8-read', type: 'read', chapters: [['Genesis', 8]], label: 'Read Genesis 8 — the waters recede',
        devotional: {
          reflection: '"And God remembered Noah." The waters go down slowly, over months, and Noah waits, sending out a raven and then a dove and taking his time before leaving the ark. When he finally steps out, the first thing he builds is an altar.',
          question: "What does it look like for you to wait on God's timing, and to answer first with worship when a hard season ends?"
        } },
      { id: 'gen9-read', type: 'read', chapters: [['Genesis', 9]], label: 'Read Genesis 9 — the rainbow covenant',
        devotional: {
          reflection: 'God sets a bow in the clouds as the sign that he will never again destroy the earth with a flood. The promise is for every living creature, and it comes without conditions. The same chapter shows Noah\'s family still struggling after the flood: new ground, same human hearts.',
          question: "What reminder of God's faithfulness, a 'rainbow' of your own, can you set in your life?"
        } },
      { id: 'flood-memory', type: 'game', gameId: 'memorymatch', label: 'Play: memory match' },

      { id: 'flood-summary', type: 'summary', label: 'Genesis 6-9: The Big Picture',
        recap: "As human wickedness fills the earth, God grieves, yet Noah finds grace. God tells him how to build the ark, and Noah obeys. The flood covers the earth, God remembers Noah, and the waters recede. Noah worships, and God makes a covenant with every living creature, sealing it with the rainbow. Judgment and mercy meet in the same story: the world is cleansed, and a family is carried through.",
        devotional: {
          reflection: "From corruption to covenant: the flood story shows a God who takes evil seriously and who also keeps his creatures safe.",
          question: "Where do you see both God's seriousness about wrong and his mercy toward people in this story?"
        } },

      { id: 'flood-finale', type: 'game', gameId: 'crossword', label: 'Finale: crossword — Noah and the flood',
        crossword: [
          { word: 'ARARAT', clue: 'The mountains where the ark came to rest', row: 0, col: 0, dir: 'across' },
          { word: 'RAVEN', clue: 'The first bird Noah sent out', row: 0, col: 3, dir: 'down' },
          { word: 'DOVE', clue: 'The bird that returned with an olive leaf', row: 2, col: 1, dir: 'across' },
          { word: 'ARK', clue: 'The vessel God told Noah to build', row: 3, col: 0, dir: 'down' },
          { word: 'NOAH', clue: 'Who “found grace in the eyes of the LORD” (Genesis 6:8)', row: 3, col: 5, dir: 'down' },
          { word: 'RAINBOW', clue: 'The sign of God’s covenant never to flood the earth again', row: 4, col: 0, dir: 'across' },
          { word: 'PITCH', clue: 'What Noah used to seal the ark, inside and out', row: 6, col: 1, dir: 'across' }
        ] }
    ]
  }
  // More arcs live in js/arcs/ (Genesis 10-50 is in js/arcs/genesis-10-50.js). To add
  // one, copy that file's shape, load it in index.html and sw.js right after this file,
  // and list it in tests/unit/helpers/load.js. The arcade games still marked "In the
  // works" (runner, pacman, frogger, slingshot, etc.) work as free play from the Library
  // and aren't wired to a stop until they're built.
];

const StoryEngine = {
  allBeats() {
    const out = [];
    STORY_ARCS.forEach(arc => arc.beats.forEach(beat => out.push({ arc, beat })));
    return out;
  },

  // A beat is complete only once IT has actually been completed through the
  // Story flow itself (reading through to "Next", or playing a game and
  // tapping "Next"). We deliberately do NOT treat "the chapter happens to be
  // marked read elsewhere" as automatic completion here — with chapters now
  // split into a few reading stops, that shortcut was letting a chapter
  // marked read some other way (or leftover progress from testing an older
  // version of this campaign) instantly mark EVERY stop for that chapter as
  // done, out of order — which is exactly the "shows complete but I haven't
  // actually read it" mismatch. Story order is the one source of truth.
  isBeatComplete(beat) {
    return Storage.isBeatComplete(beat.id);
  },

  // Every beat across the whole campaign, in one flat, campaign-wide order
  // (arc by arc, beat by beat). Used to figure out "everything before this
  // specific spot," which plain per-beat completion can't tell you once
  // you've read further and come back to replay something earlier.
  allBeatsFlat() {
    const out = [];
    STORY_ARCS.forEach(arc => arc.beats.forEach(beat => out.push(beat)));
    return out;
  },

  // Whether a specific verse has actually been read yet, purely by walking
  // the Story sequence: true only if some completed 'read' beat's own verse
  // range covers it. This is the GLOBAL version — "has this verse been
  // covered by ANY completed reading stop, anywhere in the campaign so
  // far" — used for free play from the Library, where there's no specific
  // spot in the story to anchor to.
  isVerseRead(book, chapter, verse) {
    for (const arc of STORY_ARCS) {
      for (const beat of arc.beats) {
        if (beat.type !== 'read' || !beat.chapters) continue;
        if (!beat.chapters.some(([b, c]) => b === book && c === chapter)) continue;
        const inRange = beat.verses ? (verse >= beat.verses[0] && verse <= beat.verses[1]) : true;
        if (inRange && this.isBeatComplete(beat)) return true;
      }
    }
    return false;
  },

  // Whether a verse is fair game for a game played AT a specific beat's own
  // position in the campaign — true only if some completed 'read' beat that
  // comes AT OR BEFORE that position (not anywhere in the campaign) covers
  // it. This is what makes replaying an earlier game always show only what
  // had been read by that point: going back to the Genesis 1:1-8 activity
  // after finishing Genesis 3 still only offers Genesis 1:1-8, because
  // everything from Genesis 1:9 onward sits AFTER that game's own spot in
  // the sequence, no matter how much has been completed since.
  isVerseAvailableForBeat(book, chapter, verse, gameBeatId) {
    const flat = this.allBeatsFlat();
    const gameIndex = flat.findIndex(b => b.id === gameBeatId);
    const cutoff = gameIndex === -1 ? flat.length : gameIndex;
    for (let i = 0; i < cutoff; i++) {
      const beat = flat[i];
      if (beat.type !== 'read' || !beat.chapters) continue;
      if (!beat.chapters.some(([b, c]) => b === book && c === chapter)) continue;
      const inRange = beat.verses ? (verse >= beat.verses[0] && verse <= beat.verses[1]) : true;
      if (inRange && this.isBeatComplete(beat)) return true;
    }
    return false;
  },

  arcProgress(arc) {
    const done = arc.beats.filter(b => this.isBeatComplete(b)).length;
    return { done, total: arc.beats.length };
  },

  isArcComplete(arc) {
    const p = this.arcProgress(arc);
    return p.done === p.total;
  },

  isArcUnlocked(arcIndex) {
    if (arcIndex === 0) return true;
    return this.isArcComplete(STORY_ARCS[arcIndex - 1]);
  },

  isBeatUnlocked(arc, beatIndex) {
    if (beatIndex === 0) return true;
    return this.isBeatComplete(arc.beats[beatIndex - 1]);
  },

  // Finds the first beat (in arc order) that plays a given game, wherever it
  // shows up in the campaign.
  findGameBeat(gameId) {
    for (let ai = 0; ai < STORY_ARCS.length; ai++) {
      const arc = STORY_ARCS[ai];
      for (let bi = 0; bi < arc.beats.length; bi++) {
        if (arc.beats[bi].gameId === gameId) return { arc, arcIndex: ai, beat: arc.beats[bi], beatIndex: bi };
      }
    }
    return null;
  },

  // Whether a game (by GameRegistry id) should be playable from the Library
  // right now. Games tied to a story beat stay locked ("Continue reading to
  // unlock") until the reader has actually reached that point — both the
  // beat's own arc and the beat itself need to be unlocked. Games that aren't
  // tied to any beat (free-play extras) are always considered unlocked.
  isGameUnlocked(gameId) {
    const loc = this.findGameBeat(gameId);
    if (!loc) return true;
    return this.isArcUnlocked(loc.arcIndex) && this.isBeatUnlocked(loc.arc, loc.beatIndex);
  },

  // Finds the very next thing the player should do: first incomplete beat
  // in the first arc that isn't fully complete.
  nextUp() {
    for (let ai = 0; ai < STORY_ARCS.length; ai++) {
      const arc = STORY_ARCS[ai];
      if (!this.isArcUnlocked(ai)) return null;
      for (let bi = 0; bi < arc.beats.length; bi++) {
        if (!this.isBeatComplete(arc.beats[bi])) {
          return { arc, arcIndex: ai, beat: arc.beats[bi], beatIndex: bi };
        }
      }
    }
    return null; // campaign fully complete
  }
};