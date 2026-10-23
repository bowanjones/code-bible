// arcs/genesis-10-50.js
// Story arcs for the rest of Genesis: the nations and Babel, Abraham, Isaac,
// Jacob, and Joseph. Same shape as the arcs in story-data.js (see the comment at
// the top of that file for every field), added to STORY_ARCS in reading order.
//
// Each arc is: verse-split readings with a devotional, a game after each reading,
// a "Big Picture" recap, and a crossword finale. Games used here are the ones that
// are fully built; the arcade games still marked "In the works" are not wired in.
//
// Shortcuts used below (they produce ordinary beat objects):
//   read(id, chapter, verses, label, reflection, question)
//       verses: null for the whole chapter, [from, to], or [from, to, true] for the
//       last stop of a split chapter (the one that marks the chapter read).
//   play(id, gameId, label, extra)         a game stop; extra holds wordSet etc.
//   summary(id, label, recap, reflection, question)
(function () {
  const BOOK = 'Genesis';
  const read = (id, chapter, verses, label, reflection, question) => {
    const beat = { id, type: 'read', chapters: [[BOOK, chapter]] };
    if (verses) { beat.verses = [verses[0], verses[1]]; if (verses[2]) beat.lastSegment = true; }
    beat.label = label;
    beat.devotional = { reflection, question };
    return beat;
  };
  const play = (id, gameId, label, extra) => Object.assign({ id, type: 'game', gameId, label }, extra || {});
  const summary = (id, label, recap, reflection, question) =>
    ({ id, type: 'summary', label, recap, devotional: { reflection, question } });
  const words = (name, list) => ({ wordSet: { name, words: list } });

  // Crossword layouts for each arc's finale. row/col place each word on a grid;
  // every word crosses at least one other (tests/unit/arcs.test.js checks this).
  const CW = {
    babel: [
      { word: 'SARAI', clue: 'Abram’s wife, who could not have children', row: 0, col: 2, dir: 'down' },
      { word: 'SHEM', clue: 'The son of Noah whose line leads to Abram', row: 0, col: 2, dir: 'across' },
      { word: 'TERAH', clue: 'The father of Abram, Nahor and Haran', row: 2, col: 0, dir: 'across' },
      { word: 'BRICK', clue: 'What they used instead of stone', row: 3, col: 5, dir: 'down' },
      { word: 'SHINAR', clue: 'The plain where the people settled to build', row: 4, col: 0, dir: 'across' },
      { word: 'HARAN', clue: 'The city where Terah settled on the way to Canaan', row: 4, col: 1, dir: 'down' },
      { word: 'NIMROD', clue: 'A “mighty hunter before the LORD” (Genesis 10:9)', row: 4, col: 3, dir: 'down' }
    ],
    abram: [
      { word: 'CANAAN', clue: 'The land God led Abram to', row: 0, col: 0, dir: 'down' },
      { word: 'SODOM', clue: 'The city near the land Lot chose', row: 0, col: 4, dir: 'down' },
      { word: 'LOT', clue: 'Abram’s nephew, who chose the Jordan plain', row: 1, col: 3, dir: 'across' },
      { word: 'ABRAM', clue: 'The man God called to leave his country (Genesis 12:1)', row: 4, col: 0, dir: 'across' },
      { word: 'ALTAR', clue: 'What Abram built to the LORD wherever he went', row: 4, col: 3, dir: 'down' },
      { word: 'TITHE', clue: 'The tenth Abram gave to Melchizedek', row: 6, col: 1, dir: 'across' },
      { word: 'HEBRON', clue: 'Where Abram settled, by the oaks of Mamre', row: 8, col: 0, dir: 'across' }
    ],
    covenant: [
      { word: 'ISHMAEL', clue: 'Hagar’s son, whose name means “God hears”', row: 0, col: 7, dir: 'down' },
      { word: 'ISAAC', clue: 'The promised son, whose name means “laughter”', row: 1, col: 0, dir: 'down' },
      { word: 'HAGAR', clue: 'Sarai’s Egyptian servant', row: 1, col: 2, dir: 'down' },
      { word: 'STARS', clue: 'What Abram was told to count (Genesis 15:5)', row: 2, col: 0, dir: 'across' },
      { word: 'SARAH', clue: 'Sarai’s new name', row: 2, col: 4, dir: 'down' },
      { word: 'ABRAHAM', clue: 'Abram’s new name, “father of many nations”', row: 4, col: 2, dir: 'across' },
      { word: 'SHIELD', clue: 'What God called himself to Abram, along with “exceeding great reward”', row: 6, col: 3, dir: 'across' }
    ],
    sodom: [
      { word: 'ISAAC', clue: 'The son born to Abraham at age 100', row: 0, col: 2, dir: 'across' },
      { word: 'SARAH', clue: 'She laughed in the tent when she heard the promise', row: 0, col: 3, dir: 'down' },
      { word: 'ANGELS', clue: 'The two visitors who came to Sodom in the evening', row: 0, col: 5, dir: 'down' },
      { word: 'SODOM', clue: 'The city Abraham pleaded for', row: 1, col: 1, dir: 'down' },
      { word: 'SALT', clue: 'What Lot’s wife became a pillar of', row: 1, col: 7, dir: 'down' },
      { word: 'ZOAR', clue: 'The small city where Lot fled', row: 2, col: 0, dir: 'across' },
      { word: 'LOT', clue: 'Abraham’s nephew who lived in Sodom', row: 4, col: 5, dir: 'across' }
    ],
    moriah: [
      { word: 'MACHPELAH', clue: 'The cave Abraham bought as a burial place', row: 0, col: 4, dir: 'down' },
      { word: 'ISAAC', clue: 'The son who carried the wood', row: 1, col: 2, dir: 'across' },
      { word: 'CAMELS', clue: 'The ten animals the servant took on his journey', row: 1, col: 6, dir: 'down' },
      { word: 'RAM', clue: 'What God provided in the thicket', row: 2, col: 0, dir: 'down' },
      { word: 'ABRAHAM', clue: 'He “called the name of that place Jehovah-jireh”', row: 3, col: 0, dir: 'across' },
      { word: 'WELL', clue: 'Where the servant prayed for a sign', row: 5, col: 3, dir: 'across' },
      { word: 'LABAN', clue: 'Rebekah’s brother', row: 7, col: 1, dir: 'across' }
    ],
    jacob: [
      { word: 'WELLS', clue: 'What Isaac dug again in Gerar', row: 0, col: 0, dir: 'across' },
      { word: 'ESAU', clue: 'The older twin, a skilled hunter', row: 0, col: 1, dir: 'down' },
      { word: 'JACOB', clue: 'The younger twin, who held his brother’s heel', row: 2, col: 0, dir: 'across' },
      { word: 'BLESSING', clue: 'What Jacob received by deceiving his father', row: 2, col: 4, dir: 'down' },
      { word: 'STEW', clue: 'What Jacob was cooking when Esau came in hungry', row: 4, col: 2, dir: 'across' },
      { word: 'ISAAC', clue: 'The father who was old and nearly blind', row: 5, col: 1, dir: 'down' },
      { word: 'HARAN', clue: 'Where Rebekah sent Jacob to stay with Laban', row: 8, col: 0, dir: 'across' }
    ],
    bethel: [
      { word: 'LABAN', clue: 'The uncle who deceived Jacob', row: 0, col: 1, dir: 'down' },
      { word: 'GALEED', clue: 'The heap of stones that witnessed the covenant', row: 1, col: 0, dir: 'across' },
      { word: 'LADDER', clue: 'What Jacob saw in his dream, with angels on it', row: 3, col: 0, dir: 'across' },
      { word: 'RACHEL', clue: 'The younger daughter Jacob loved', row: 3, col: 5, dir: 'down' },
      { word: 'LEAH', clue: 'The older daughter, “tender eyed”', row: 5, col: 3, dir: 'down' },
      { word: 'JOSEPH', clue: 'Rachel’s first son', row: 6, col: 0, dir: 'across' },
      { word: 'BETHEL', clue: 'The place Jacob named “house of God”', row: 8, col: 0, dir: 'across' }
    ],
    israel: [
      { word: 'DINAH', clue: 'Leah’s daughter, whose story is told in Genesis 34', row: 0, col: 3, dir: 'down' },
      { word: 'RACHEL', clue: 'She died near Ephrath, which is Bethlehem', row: 1, col: 5, dir: 'down' },
      { word: 'BENJAMIN', clue: 'The youngest son, born as Rachel died', row: 2, col: 1, dir: 'across' },
      { word: 'BETHEL', clue: 'Where God told Jacob to go and dwell', row: 2, col: 1, dir: 'down' },
      { word: 'ISRAEL', clue: 'The new name God gave to Jacob', row: 2, col: 7, dir: 'down' },
      { word: 'ESAU', clue: 'The brother who ran to embrace Jacob', row: 5, col: 5, dir: 'across' },
      { word: 'PENIEL', clue: 'The place Jacob named “face of God”', row: 6, col: 0, dir: 'across' }
    ],
    josephdream: [
      { word: 'EDOM', clue: 'The nation that descended from Esau', row: 0, col: 5, dir: 'down' },
      { word: 'DOTHAN', clue: 'Where the brothers were pasturing the flocks', row: 0, col: 7, dir: 'down' },
      { word: 'PIT', clue: 'Where the brothers first put Joseph', row: 1, col: 0, dir: 'across' },
      { word: 'PEREZ', clue: 'One of Tamar’s twin sons', row: 1, col: 0, dir: 'down' },
      { word: 'TAMAR', clue: 'The woman who said Judah had been unjust to her', row: 1, col: 2, dir: 'down' },
      { word: 'COAT', clue: 'The gift of “many colours” that Jacob made', row: 2, col: 4, dir: 'across' },
      { word: 'REUBEN', clue: 'The oldest brother, who tried to save Joseph', row: 5, col: 2, dir: 'across' }
    ],
    josephegypt: [
      { word: 'EPHRAIM', clue: 'Joseph’s second son, “fruitful”', row: 0, col: 0, dir: 'down' },
      { word: 'POTIPHAR', clue: 'The captain of the guard who bought Joseph', row: 0, col: 3, dir: 'across' },
      { word: 'PHARAOH', clue: 'The king whose dreams Joseph interpreted', row: 0, col: 7, dir: 'down' },
      { word: 'PRISON', clue: 'Where “the LORD was with Joseph” after he was accused', row: 1, col: 2, dir: 'down' },
      { word: 'BAKER', clue: 'The other official, whose dream meant bad news', row: 2, col: 6, dir: 'across' },
      { word: 'DREAMS', clue: 'What Joseph said belong to God to interpret', row: 4, col: 4, dir: 'across' },
      { word: 'MANASSEH', clue: 'Joseph’s firstborn, whose name means “forgetting”', row: 6, col: 0, dir: 'across' }
    ],
    reunion: [
      { word: 'GOSHEN', clue: 'The land where Joseph’s family would live', row: 0, col: 1, dir: 'across' },
      { word: 'STEWARD', clue: 'The man who chased the brothers about the cup', row: 0, col: 3, dir: 'down' },
      { word: 'WAGONS', clue: 'What Pharaoh sent to carry Jacob’s family', row: 0, col: 9, dir: 'down' },
      { word: 'SILVER', clue: 'What was hidden in the brothers’ sacks, and in a cup', row: 1, col: 7, dir: 'down' },
      { word: 'JOSEPH', clue: 'He said, “I am ___; doth my father yet live?”', row: 2, col: 0, dir: 'across' },
      { word: 'JUDAH', clue: 'The brother who offered to stay as a slave', row: 2, col: 0, dir: 'down' },
      { word: 'BROTHERS', clue: 'The ten men who bowed before Joseph', row: 5, col: 2, dir: 'across' }
    ],
    egypt: [
      { word: 'EPHRAIM', clue: 'The younger grandson who received the greater blessing', row: 0, col: 0, dir: 'down' },
      { word: 'BONES', clue: 'What Joseph asked the Israelites to carry out of Egypt', row: 0, col: 3, dir: 'across' },
      { word: 'EMBALMED', clue: 'What the physicians did to Jacob’s body for forty days', row: 0, col: 6, dir: 'down' },
      { word: 'COFFIN', clue: 'Where Joseph’s embalmed body was placed in Egypt', row: 1, col: 2, dir: 'down' },
      { word: 'GOSHEN', clue: 'The part of Egypt where Jacob’s family settled', row: 4, col: 4, dir: 'down' },
      { word: 'MANASSEH', clue: 'The older grandson', row: 6, col: 0, dir: 'across' },
      { word: 'SEVENTY', clue: 'The number of Jacob’s household that went to Egypt', row: 9, col: 0, dir: 'across' }
    ]
  };

  STORY_ARCS.push(

    // ------------------------------------------------------------ Genesis 10-11
    {
      id: 'babel',
      title: 'The Nations & the Tower of Babel',
      range: 'Genesis 10–11',
      color: 'brass',
      beats: [
        read('gen10-read', 10, null, 'Read Genesis 10 — the table of nations',
          'Genesis 10 reads like a roll call, but it makes a big claim: every nation on earth traces back to one family, and every one of them is known by name to God. Even the long lists in Scripture say that no people are an afterthought.',
          'Who is a person or a people you tend to overlook, and what would it look like to see them the way God does, by name?'),
        play('gen10-game', 'wordsearch', 'Play: word search', words('Table of Nations', ['SHEM', 'HAM', 'JAPHETH', 'CUSH', 'NIMROD', 'NINEVEH', 'CANAAN', 'NATIONS'])),
        read('gen11a-read', 11, [1, 9], 'Read Genesis 11:1-9 — the tower of Babel',
          'The builders want a name for themselves and safety in sameness, “lest we be scattered.” But God had told people to fill the earth. Babel isn’t really about bricks. It’s about securing ourselves on our own terms instead of trusting God.',
          'Where are you tempted to “make a name for yourself” or build your own security instead of trusting God with it?'),
        play('gen11a-game', 'unscramble', 'Play: unscramble', { scrambleWords: ['SHINAR', 'BABEL', 'BRICK', 'TOWER', 'NAME', 'LANGUAGE', 'SCATTERED', 'HEAVEN'] }),
        read('gen11b-read', 11, [10, 32, true], 'Read Genesis 11:10-32 — from Shem to Terah, and a family heading for Canaan',
          'After the scattering, the story narrows: one line of names leads down to Terah and to a son named Abram. Notice that Sarai is introduced as barren (v.30). The promise ahead will rest on a family that, humanly speaking, can’t have children.',
          'What “impossible” situation in your life might God be quietly setting the stage in?'),
        play('gen11b-game', 'versebuilder', 'Play: rebuild the verse'),
        summary('babel-summary', 'Genesis 10-11: The Big Picture',
          'Genesis 10 shows the nations spreading out from Noah’s sons, each one known by name. Genesis 11 zooms in on a single moment of human pride: a city and a tower built to “make us a name” and avoid being scattered. God confuses their language and spreads them out. Then the story narrows sharply, tracing Shem’s line to Terah and his son Abram. After Babel’s attempt to reach up to God, the next chapter shows God reaching down to one man.',
          'Babel is people trying to climb to God on their own. What comes next is God coming down to a family and making a promise. The Bible’s story turns here from humanity’s plans to God’s.',
          'Where in your own life are you trying to “reach up” by your own effort, and what would it mean to receive instead?'),
        play('babel-finale', 'crossword', 'Finale: crossword — Babel and the nations', { crossword: CW.babel })
      ]
    },

    // ------------------------------------------------------------ Genesis 12-14
    {
      id: 'abram-call',
      title: 'The Call of Abram',
      range: 'Genesis 12–14',
      color: 'game',
      beats: [
        read('gen12a-read', 12, [1, 9], 'Read Genesis 12:1-9 — God calls Abram, and he goes',
          'God’s call comes with a command and a promise: go, and I will make you a great nation and bless you so you can be a blessing. Abram gets no map or details, only a direction. Faith here means taking the next step before the whole route is clear.',
          'What “next step” do you sense God asking of you, even without the whole plan?'),
        play('gen12a-game', 'wordsearch', 'Play: word search', words('The call', ['ABRAM', 'SARAI', 'LOT', 'HARAN', 'CANAAN', 'SHECHEM', 'ALTAR', 'BLESSING'])),
        read('gen12b-read', 12, [10, 20, true], 'Read Genesis 12:10-20 — famine, Egypt, and Sarai taken',
          'Right after a big step of faith, Abram makes a very human mistake: fear drives him to pass Sarai off as his sister. God protects her and the promise anyway. The promise doesn’t depend on Abram’s perfect record. It depends on God’s faithfulness.',
          'Where has fear led you to cut a corner, and where have you seen God cover for it?'),
        play('gen12b-game', 'fillblank', 'Play: fill in the blank'),
        read('gen13-read', 13, null, 'Read Genesis 13 — Abram and Lot part ways',
          'Abram, the elder with every right to choose first, lets Lot pick. Lot chooses what looks best, well-watered land near Sodom, while Abram trusts God to provide. After Lot leaves, God renews the promise to Abram. Generosity makes room for God to speak.',
          'When have you chosen by what looked best instead of what was wise? What would “letting the other person choose first” look like in a conflict you face?'),
        play('gen13-game', 'unscramble', 'Play: unscramble', { scrambleWords: ['ABRAM', 'LOT', 'SODOM', 'JORDAN', 'HEBRON', 'MAMRE', 'HERDSMEN', 'DUST'] }),
        read('gen14a-read', 14, [1, 16], 'Read Genesis 14:1-16 — a war, and Abram rescues Lot',
          'Lot’s choice cost him: he’s taken captive in a war between kings. Abram, the one Lot left behind, gathers 318 trained men and goes after him. Family doesn’t stop being family after a bad decision.',
          'Who in your life made choices that hurt them, and how can you show up for them anyway?'),
        play('gen14a-game', 'versebuilder', 'Play: rebuild the verse'),
        read('gen14b-read', 14, [17, 24, true], 'Read Genesis 14:17-24 — Melchizedek, bread and wine, and a refused reward',
          'A mysterious priest-king, Melchizedek, blesses Abram, and Abram gives him a tenth. Then Abram turns down the king of Sodom’s offer so no one can say, “I have made Abram rich.” He wants God alone to be known as his provider.',
          'Is there a “reward” you could take but shouldn’t, so that God, not you, gets the credit?'),
        play('gen14b-game', 'memorymatch', 'Play: memory match'),
        summary('abram-call-summary', 'Genesis 12-14: The Big Picture',
          'Abram steps out in faith at God’s call, stumbles in Egypt, and then shows remarkable generosity with Lot. When war sweeps Lot away, Abram rescues him with a small force and refuses a reward from the king of Sodom, giving a tenth to Melchizedek, priest of God Most High. These chapters show a faith that obeys, fails, and still trusts that God is the one who provides.',
          'Abram’s faith isn’t flawless. He goes, he fears, he gives, he fights, he refuses. The thread through all of it is that God keeps him and keeps his word.',
          'Which moment from Genesis 12-14 (the call, the fear in Egypt, the choice with Lot, the rescue, or the refused reward) feels most like your own life right now?'),
        play('abram-call-finale', 'crossword', 'Finale: crossword — the call of Abram', { crossword: CW.abram })
      ]
    },

    // ------------------------------------------------------------ Genesis 15-17
    {
      id: 'covenant',
      title: 'The Covenant & the Promised Son',
      range: 'Genesis 15–17',
      color: 'brass',
      beats: [
        read('gen15a-read', 15, [1, 6], 'Read Genesis 15:1-6 — “Look toward heaven”: a promise, and a belief',
          'Abram has been waiting, and he says so honestly: I have no child. God doesn’t scold him. He takes him outside and tells him to count the stars. “And he believed in the LORD; and he counted it to him for righteousness.” Trust, not performance, is what God counts.',
          'What honest “waiting” are you carrying that you could bring to God the way Abram did?'),
        play('gen15a-game', 'wordsearch', 'Play: word search', words('The stars', ['STARS', 'SHIELD', 'REWARD', 'ELIEZER', 'HEIR', 'BELIEVED', 'RIGHTEOUS', 'DAMASCUS'])),
        read('gen15b-read', 15, [7, 21, true], 'Read Genesis 15:7-21 — the covenant of the smoking pot and flaming torch',
          'Abram asks how he can know, and God answers with a covenant ceremony. Then God alone passes between the pieces while Abram sleeps. The promise is secured by God’s faithfulness, not Abram’s.',
          'What would change if you believed your standing with God rests on his faithfulness rather than yours?'),
        play('gen15b-game', 'fillblank', 'Play: fill in the blank'),
        read('gen16-read', 16, null, 'Read Genesis 16 — Hagar and Ishmael',
          'Sarai and Abram try to “help” God’s promise along through Hagar, and the result is pain and conflict. Yet the angel of the LORD finds Hagar in the wilderness, and she names God “Thou God seest me.” It’s one of the Bible’s most tender moments for someone overlooked.',
          'Where have you tried to speed up God’s plan, and where have you felt seen by God in a lonely place?'),
        play('gen16-game', 'unscramble', 'Play: unscramble', { scrambleWords: ['HAGAR', 'SARAI', 'ISHMAEL', 'SHUR', 'FOUNTAIN', 'ANGEL', 'EGYPTIAN', 'WILDERNESS'] }),
        read('gen17-read', 17, null, 'Read Genesis 17 — new names and the sign of the covenant',
          'God renames Abram “Abraham,” father of many nations, when he is ninety-nine and still childless. The promises stay the same, but now they come with a sign and with names that keep reminding them what God has said. Isaac’s name will mean laughter.',
          'What promise or name from God do you need to keep repeating to yourself while you wait?'),
        play('gen17-game', 'versebuilder', 'Play: rebuild the verse'),
        summary('covenant-summary', 'Genesis 15-17: The Big Picture',
          'God promises Abram offspring as countless as the stars, and Abram believes, and it is counted to him as righteousness. God then seals the promise in a covenant ceremony where he alone passes between the pieces. Impatience leads to Hagar and Ishmael, but God sees and cares for Hagar. At ninety-nine, Abram becomes Abraham and Sarai becomes Sarah, with circumcision as the covenant sign and Isaac promised for the next year.',
          'These chapters keep returning to one question: will God do what he said? Each time the answer is a covenant, a name, or a promise that outlasts human impatience.',
          'Which part of Genesis 15-17 gives you the most courage to keep trusting God’s timing?'),
        play('covenant-finale', 'crossword', 'Finale: crossword — the covenant', { crossword: CW.covenant })
      ]
    },

    // ------------------------------------------------------------ Genesis 18-21
    {
      id: 'sodom',
      title: 'Visitors, Sodom & Isaac',
      range: 'Genesis 18–21',
      color: 'game',
      beats: [
        read('gen18a-read', 18, [1, 15], 'Read Genesis 18:1-15 — three visitors, and a promise Sarah laughs at',
          'Abraham runs to welcome strangers, and they bring news: Sarah will have a son. She laughs from inside the tent, and the LORD asks, “Is any thing too hard for the LORD?” Hospitality opens the door to the promise being repeated face to face.',
          'What is one thing you’ve quietly written off as “too hard” that you could hand back to God?'),
        play('gen18a-game', 'wordsearch', 'Play: word search', words('The visitors', ['ABRAHAM', 'SARAH', 'MAMRE', 'OAKS', 'CALF', 'LAUGHED', 'TENT', 'PROMISE'])),
        read('gen18b-read', 18, [16, 33, true], 'Read Genesis 18:16-33 — Abraham pleads for Sodom',
          'The LORD shares his plans with Abraham, and Abraham dares to ask, “Shall not the Judge of all the earth do right?” He bargains from fifty down to ten, asking God to show mercy for the sake of the righteous in the city. Prayer can be bold, honest, and persistent.',
          'Who is a person or a place you could pray boldly for this week?'),
        play('gen18b-game', 'fillblank', 'Play: fill in the blank'),
        read('gen19a-read', 19, [1, 14], 'Read Genesis 19:1-14 — angels in Sodom',
          'Lot welcomes the visitors as Abraham did, but the city’s sin is on full display. The angels act to protect Lot’s household, yet his warning sounds like a joke to his sons-in-law. It’s hard to be taken seriously by people who have grown comfortable with sin.',
          'Where have you grown so comfortable with the culture around you that warnings barely register?'),
        play('gen19a-game', 'unscramble', 'Play: unscramble', { scrambleWords: ['LOT', 'SODOM', 'ANGELS', 'GATE', 'DOOR', 'BLIND', 'WARNING', 'CITY'] }),
        read('gen19b-read', 19, [15, 38, true], 'Read Genesis 19:15-38 — escape, fire, and a pillar of salt',
          'The angels have to take Lot, his wife, and his daughters by the hand, because “he lingered.” God’s mercy is persistent, and the warning is simple: don’t look back. Lot’s wife does, and the story ends with sorrowful consequences that follow even those who escape. Rescue is real, and so is the cost of lingering.',
          'What are you still “lingering” over that God is asking you to leave behind?'),
        play('gen19b-game', 'versebuilder', 'Play: rebuild the verse'),
        read('gen20-read', 20, null, 'Read Genesis 20 — Abraham and Abimelech in Gerar',
          'Abraham repeats the sister story from Egypt, fear tripping him up again. God steps in to protect Sarah through a dream, and Abraham prays for Abimelech’s household. God’s grace covers failure even when the same mistake comes around twice.',
          'What recurring weakness do you keep running into, and what would it look like to bring it into the light?'),
        play('gen20-game', 'memorymatch', 'Play: memory match'),
        read('gen21a-read', 21, [1, 21], 'Read Genesis 21:1-21 — Isaac is born, and Hagar and Ishmael are sent out',
          '“And the LORD visited Sarah as he had said.” After twenty-five years of waiting, the promise arrives, and Sarah laughs again, this time with joy. The same chapter shows pain for Hagar and Ishmael, and God hears the boy’s voice in the wilderness and opens Hagar’s eyes to a well.',
          'Where do you need God to open your eyes to provision that is already near?'),
        play('gen21a-game', 'wordsearch', 'Play: word search', words('Isaac and Hagar', ['ISAAC', 'SARAH', 'HAGAR', 'ISHMAEL', 'LAUGH', 'WELL', 'WATER', 'ARCHER'])),
        read('gen21b-read', 21, [22, 34, true], 'Read Genesis 21:22-34 — the well at Beersheba',
          'Abimelech sees that God is with Abraham and asks for a peace treaty. Abraham settles a dispute over a well with seven lambs, plants a tree, and calls on “the everlasting God.” Wells and water, the ordinary stuff of survival, become places of covenant.',
          'How can you be a peacemaker in a dispute close to you?'),
        play('gen21b-game', 'fillblank', 'Play: fill in the blank'),
        summary('sodom-summary', 'Genesis 18-21: The Big Picture',
          'Abraham welcomes three visitors and hears again that Sarah will have a son, then pleads with God for Sodom. Sodom falls and Lot barely escapes, a sobering picture of mercy and consequences. Abraham stumbles again in Gerar, yet God protects the promise. Finally Isaac is born, Hagar and Ishmael are sent away yet cared for, and Abraham makes peace at Beersheba. After the long waiting, the promise arrives with laughter.',
          'From a tent door to a wilderness well, these chapters show God keeping his word, hearing prayers for others, and caring for people who are easy to overlook.',
          'Where did you see God’s character most clearly in Genesis 18-21: his promise, his mercy, or his care for the forgotten?'),
        play('sodom-finale', 'crossword', 'Finale: crossword — Sodom and Isaac', { crossword: CW.sodom })
      ]
    },

    // ------------------------------------------------------------ Genesis 22-24
    {
      id: 'moriah',
      title: 'Moriah & a Bride for Isaac',
      range: 'Genesis 22–24',
      color: 'brass',
      beats: [
        read('gen22a-read', 22, [1, 14], 'Read Genesis 22:1-14 — the test on Mount Moriah',
          'God asks for the thing Abraham loves most, the son of the promise. Abraham obeys with remarkable calm: “God will provide himself a lamb.” At the last moment God provides a ram in the thicket, and the place is named Jehovah-jireh, which means “the LORD will provide.”',
          'What are you holding tightly that God might be asking you to hold with an open hand?'),
        play('gen22a-game', 'wordsearch', 'Play: word search', words('Moriah', ['MORIAH', 'ISAAC', 'ALTAR', 'WOOD', 'KNIFE', 'RAM', 'THICKET', 'PROVIDE'])),
        read('gen22b-read', 22, [15, 24, true], 'Read Genesis 22:15-24 — the promise renewed, and Rebekah is named',
          'Because Abraham obeyed, God repeats and deepens the promise: descendants like the stars and the sand, and blessing for all nations. The chapter ends quietly with news of Nahor’s family, including a girl named Rebekah. God is already preparing the next step.',
          'Where might God have been quietly setting the stage behind a recent hard season?'),
        play('gen22b-game', 'fillblank', 'Play: fill in the blank'),
        read('gen23-read', 23, null, 'Read Genesis 23 — Sarah dies, and Abraham buys a burial cave',
          'Abraham grieves, and then does the careful, practical work of buying a burial place at full price. After years of living as a stranger in the land, this small cave and field is the first piece of the promised land he owns. Grief and faith can share a chapter.',
          'How do you handle grief, and where might God be calling you to invest in the future even in sorrow?'),
        play('gen23-game', 'unscramble', 'Play: unscramble', { scrambleWords: ['SARAH', 'HEBRON', 'EPHRON', 'HITTITE', 'MACHPELAH', 'SHEKELS', 'CAVE', 'GRIEF'] }),
        read('gen24a-read', 24, [1, 27], 'Read Genesis 24:1-27 — the servant’s prayer at the well',
          'Abraham’s servant prays for a specific sign, and Rebekah is already walking toward the well. He bows in worship before anything else happens. When prayer meets obedience and ordinary kindness, God’s guidance can look surprisingly natural.',
          'How could you ask God for guidance in a specific decision, and stay watchful for his answer?'),
        play('gen24a-game', 'versebuilder', 'Play: rebuild the verse'),
        read('gen24b-read', 24, [28, 67, true], 'Read Genesis 24:28-67 — “I will go”',
          'Rebekah is asked, “Wilt thou go with this man?” and she answers simply, “I will go.” Isaac meets her in the evening, and the chapter closes with him loving her and finding comfort after his mother’s death. God’s plans often arrive wrapped in quiet yeses.',
          'Where is God inviting you to say “I will go,” even with a small yes?'),
        play('gen24b-game', 'memorymatch', 'Play: memory match'),
        summary('moriah-summary', 'Genesis 22-24: The Big Picture',
          'Abraham’s greatest test comes on Mount Moriah, where God stops the sacrifice of Isaac and provides a ram, repeating the promise of blessing for all nations. After Sarah dies and Abraham buys the cave at Machpelah, his servant travels to find a wife for Isaac and prays at a well. Rebekah answers, “I will go,” and Isaac is comforted after his mother’s death. Across three chapters, God provides: a ram, a field, and a wife.',
          'Moriah, Machpelah, and a well in Nahor’s city are three places where Abraham’s household sees that God provides, sometimes at the last moment and sometimes through patient planning.',
          'What has God provided for you that you couldn’t have arranged yourself?'),
        play('moriah-finale', 'crossword', 'Finale: crossword — Moriah and Rebekah', { crossword: CW.moriah })
      ]
    },

    // ------------------------------------------------------------ Genesis 25-27
    {
      id: 'jacob-esau',
      title: 'Isaac, Jacob & Esau',
      range: 'Genesis 25–27',
      color: 'game',
      beats: [
        read('gen25a-read', 25, [1, 18], 'Read Genesis 25:1-18 — the end of Abraham’s life, and Ishmael’s line',
          'Abraham dies “in a good old age, an old man, and full of years,” and Isaac and Ishmael bury him together. A family pulled apart for years stands side by side at the grave. Some reconciliations only happen at the edges of life, and they still matter.',
          'Is there a relationship where a small step toward reconciliation could happen sooner rather than later?'),
        play('gen25a-game', 'wordsearch', 'Play: word search', words('The end of Abraham', ['ABRAHAM', 'KETURAH', 'ISAAC', 'ISHMAEL', 'MACHPELAH', 'BURIED', 'PRINCES', 'BLESSED'])),
        read('gen25b-read', 25, [19, 34, true], 'Read Genesis 25:19-34 — twins, and a birthright for a bowl of stew',
          'Rebekah struggles through a hard pregnancy and hears that the older will serve the younger. Years later Esau, hungry, trades his birthright for stew: “thus Esau despised his birthright.” It’s easy to give away something lasting for something immediate.',
          'What “bowl of stew,” what quick fix, tempts you to trade away something more lasting?'),
        play('gen25b-game', 'fillblank', 'Play: fill in the blank'),
        read('gen26-read', 26, null, 'Read Genesis 26 — Isaac in Gerar, and the wells',
          'Isaac repeats his father’s mistake about his wife and his father’s work on the wells, which the Philistines had stopped up. He keeps moving and keeps digging, naming wells for what they teach: contention, then hatred, then “room.” God’s blessing follows him without a fight.',
          'Where might choosing peace over a fight give you “room” to flourish?'),
        play('gen26-game', 'unscramble', 'Play: unscramble', { scrambleWords: ['ISAAC', 'REBEKAH', 'GERAR', 'PHILISTINES', 'WELLS', 'ESEK', 'SITNAH', 'REHOBOTH'] }),
        read('gen27a-read', 27, [1, 29], 'Read Genesis 27:1-29 — the stolen blessing',
          'Rebekah and Jacob deceive blind Isaac to get the blessing meant for Esau. The plan “works,” but everyone in the family loses something. God’s purposes for Jacob had already been spoken, yet deception was never required to get there.',
          'Where have you been tempted to force an outcome that God had already promised?'),
        play('gen27a-game', 'versebuilder', 'Play: rebuild the verse'),
        read('gen27b-read', 27, [30, 46, true], 'Read Genesis 27:30-46 — Esau’s cry, and Jacob sent away',
          'Esau begs, “Bless me, even me also, O my father.” Isaac trembles, but the blessing has been given. Esau’s anger grows to murder, and Rebekah sends Jacob away to Haran. Deception carries a hidden cost: years of separation from the family he was trying to gain.',
          'Has a shortcut ever cost you something you didn’t expect? What did you learn?'),
        play('gen27b-game', 'memorymatch', 'Play: memory match'),
        summary('jacob-esau-summary', 'Genesis 25-27: The Big Picture',
          'Abraham dies and is buried by both of his sons, and attention shifts to Isaac’s family. Rebekah has twins, Esau and Jacob, and Esau sells his birthright for stew. Isaac moves among the Philistines and digs the wells his father dug. Then Rebekah and Jacob trick Isaac into giving Jacob the blessing meant for Esau, and Jacob must flee. The promise passes through a family full of favoritism and deceit, which says as much about God’s patience as about theirs.',
          'The family in these chapters is far from perfect, yet the promise keeps moving forward. God’s plan doesn’t depend on good behavior, but sin still carries real consequences.',
          'Which person in Genesis 25-27 (Esau, Jacob, Rebekah, or Isaac) do you most need to learn from right now?'),
        play('jacob-esau-finale', 'crossword', 'Finale: crossword — Jacob and Esau', { crossword: CW.jacob })
      ]
    },

    // ------------------------------------------------------------ Genesis 28-31
    {
      id: 'bethel',
      title: 'Jacob, Bethel & Laban',
      range: 'Genesis 28–31',
      color: 'brass',
      beats: [
        read('gen28-read', 28, null, 'Read Genesis 28 — the ladder at Bethel',
          'Jacob is alone, running, and sleeping on a stone when God meets him: a ladder with angels, and a promise, “I am with thee, and will keep thee in all places whither thou goest.” God shows up for someone who hasn’t earned it. Jacob wakes and says, “Surely the LORD is in this place; and I knew it not.”',
          'Where might God already be present in a place or season where you haven’t noticed him?'),
        play('gen28-game', 'wordsearch', 'Play: word search', words('Bethel', ['JACOB', 'BETHEL', 'LADDER', 'ANGELS', 'PILLAR', 'OIL', 'HARAN', 'VOW'])),
        read('gen29-read', 29, null, 'Read Genesis 29 — Rachel, Leah, and a switched bride',
          'Jacob the deceiver meets Laban the deceiver. Seven years of work for Rachel feel like a few days, but Laban swaps in Leah. God sees Leah (“the LORD saw that Leah was hated”) and gives her children whose names tell the story of her hurt and hope.',
          'Who is someone feeling overlooked that you could notice and encourage?'),
        play('gen29-game', 'fillblank', 'Play: fill in the blank'),
        read('gen30-read', 30, null, 'Read Genesis 30 — a growing family, and growing flocks',
          'Rivalry between Rachel and Leah fills the chapter: servants, mandrakes, and names given in competition. Meanwhile Jacob’s flocks grow under Laban’s care, and even Laban admits, “the LORD hath blessed me for thy sake.” God’s blessing runs through messy households.',
          'Where do comparison or rivalry steal your joy, and what would gratitude look like instead?'),
        play('gen30-game', 'unscramble', 'Play: unscramble', { scrambleWords: ['JOSEPH', 'REUBEN', 'LEVI', 'JUDAH', 'DINAH', 'RACHEL', 'LEAH', 'FLOCKS'] }),
        read('gen31a-read', 31, [1, 21], 'Read Genesis 31:1-21 — leaving Haran in secret',
          'God tells Jacob to go home, and he and his family slip away without telling Laban. Rachel takes her father’s household gods. Twenty years of working, being cheated, and growing wealthy come to a head, and God’s word, “Return unto the land of thy fathers,” is what moves him.',
          'What does it look like to follow God’s direction even when the way out is messy?'),
        play('gen31a-game', 'versebuilder', 'Play: rebuild the verse'),
        read('gen31b-read', 31, [22, 55, true], 'Read Genesis 31:22-55 — Laban’s pursuit, and a heap of witness',
          'Laban chases Jacob for seven days, but God warns him in a dream not to harm Jacob. They end the confrontation with a heap of stones and the words, “The LORD watch between me and thee.” God stands between people who can’t trust each other.',
          'Where could you invite God to “stand between” you and someone you struggle to trust?'),
        play('gen31b-game', 'memorymatch', 'Play: memory match'),
        summary('bethel-summary', 'Genesis 28-31: The Big Picture',
          'Fleeing from Esau, Jacob dreams of a ladder to heaven at Bethel, where God promises to be with him. In Haran he is deceived by Laban, marries Leah and Rachel, and fathers eleven sons and a daughter as his flocks grow. After twenty years God calls him home, and he leaves quietly. Laban pursues, God warns him, and the two men part with a covenant heap at Galeed. Through scheming, rivalry, and fear, God keeps his promise: “I am with thee.”',
          'The ladder at Bethel and the heap at Galeed bracket this whole stretch. God meets Jacob running away, and later stands between him and the man who would harm him.',
          'Where do you most need the promise “I am with you” to be true right now?'),
        play('bethel-finale', 'crossword', 'Finale: crossword — Bethel and Laban', { crossword: CW.bethel })
      ]
    },

    // ------------------------------------------------------------ Genesis 32-35
    {
      id: 'israel',
      title: 'Jacob Becomes Israel',
      range: 'Genesis 32–35',
      color: 'game',
      beats: [
        read('gen32a-read', 32, [1, 21], 'Read Genesis 32:1-21 — angels, fear, and gifts for Esau',
          'Jacob is going home, and Esau is coming with four hundred men. Jacob prays an honest, humble prayer (“I am not worthy of the least of all the mercies”) and sends gifts ahead. Fear and faith can show up in the same chapter, and in the same prayer.',
          'What are you afraid of facing, and what would an honest prayer about it sound like?'),
        play('gen32a-game', 'wordsearch', 'Play: word search', words('Before Esau', ['JACOB', 'ESAU', 'MAHANAIM', 'JABBOK', 'GIFTS', 'CAMELS', 'PRAYER', 'FEAR'])),
        read('gen32b-read', 32, [22, 32, true], 'Read Genesis 32:22-32 — wrestling at the Jabbok',
          'Alone in the night, Jacob wrestles until dawn and refuses to let go until he’s blessed. He gets a new name, Israel, and a limp. God blesses him and marks him. Sometimes the blessing comes through a struggle we don’t walk away from unchanged.',
          'What are you wrestling with God about, and what would it look like to hold on for his blessing?'),
        play('gen32b-game', 'fillblank', 'Play: fill in the blank'),
        read('gen33-read', 33, null, 'Read Genesis 33 — Jacob and Esau meet',
          'Jacob bows seven times, expecting the worst, and Esau runs to meet him, falls on his neck, and weeps. Jacob says seeing his brother’s face is “as though I had seen the face of God.” Forgiveness that finds you is a picture of grace.',
          'Who might be waiting for you to take the first step toward reconciliation?'),
        play('gen33-game', 'unscramble', 'Play: unscramble', { scrambleWords: ['ESAU', 'JACOB', 'EMBRACED', 'KISSED', 'WEPT', 'SUCCOTH', 'SHECHEM', 'ALTAR'] }),
        read('gen34-read', 34, null, 'Read Genesis 34 — Dinah, Shechem, and a family in crisis',
          'This is one of Genesis’s hardest chapters: Dinah is violated, and her brothers answer with deceit and slaughter. God is hardly mentioned. The story shows what happens when anger and silence replace justice and wisdom. Some chapters of Scripture are there to tell the truth, not to hand us an easy lesson.',
          'How can you make room for hard stories, and for people who have been hurt, without rushing to a tidy answer?'),
        play('gen34-game', 'versebuilder', 'Play: rebuild the verse'),
        read('gen35-read', 35, null, 'Read Genesis 35 — back to Bethel, and the twelve sons',
          'God tells Jacob to go back to Bethel, and Jacob tells his household to put away their foreign gods. Along the way Rachel dies giving birth to Benjamin, and Isaac dies at 180. The chapter is full of grief and also of renewed promise: “a nation and a company of nations shall be of thee.”',
          'What “foreign gods” might you need to put away in order to fully return to where God met you before?'),
        play('gen35-game', 'memorymatch', 'Play: memory match'),
        summary('israel-summary', 'Genesis 32-35: The Big Picture',
          'Jacob prepares to meet Esau with prayer and gifts, wrestles with God at the Jabbok, and receives a new name, Israel. Esau greets him with an embrace. Then trouble comes at Shechem, where Dinah is wronged and her brothers respond with violence. God sends Jacob back to Bethel, where he renews the covenant. Rachel dies giving birth to Benjamin, and Isaac dies. The twelve sons are named, the beginnings of the nation of Israel.',
          'In these chapters Jacob is humbled, renamed, reconciled, shaken, and called back to Bethel. God keeps shaping the man he chose, one hard moment at a time.',
          'Where do you see God reshaping you, through a struggle, a reconciliation, or a call to return?'),
        play('israel-finale', 'crossword', 'Finale: crossword — Jacob becomes Israel', { crossword: CW.israel })
      ]
    },

    // ------------------------------------------------------------ Genesis 36-38
    {
      id: 'joseph-dreamer',
      title: 'Esau’s Line & Joseph the Dreamer',
      range: 'Genesis 36–38',
      color: 'brass',
      beats: [
        read('gen36-read', 36, null, 'Read Genesis 36 — the generations of Esau (Edom)',
          'A long list of Esau’s family, kings, and chiefs sits between the stories of Jacob and Joseph. It’s easy to skim, but it shows that Esau, too, became a great people. God’s care reaches wider than the main storyline.',
          'Who might God be caring for in a story that isn’t “yours”?'),
        play('gen36-game', 'wordsearch', 'Play: word search', words('The line of Esau', ['ESAU', 'EDOM', 'SEIR', 'ADAH', 'ELIPHAZ', 'AMALEK', 'CHIEFS', 'KINGS'])),
        read('gen37a-read', 37, [1, 11], 'Read Genesis 37:1-11 — the coat of many colors, and two dreams',
          'Joseph is his father’s favorite, wearing a coat that says so, and he shares dreams in which the family bows to him. His brothers hate him for it. Favoritism and pride stir up trouble, but God had put the dreams in motion.',
          'How do you handle the gifts or favor you’ve received, with humility or with pride?'),
        play('gen37a-game', 'fillblank', 'Play: fill in the blank'),
        read('gen37b-read', 37, [12, 36, true], 'Read Genesis 37:12-36 — into the pit, and sold to Egypt',
          'The brothers throw Joseph into a pit, then sell him to traders, and tell their father he’s dead. Reuben and Judah each try to soften the blow, but nobody stops it. The story is brutal, and yet it will become the path God uses to preserve the family.',
          'Where have you seen God work through someone else’s betrayal, or through your own hurt?'),
        play('gen37b-game', 'unscramble', 'Play: unscramble', { scrambleWords: ['JOSEPH', 'JACOB', 'REUBEN', 'JUDAH', 'DOTHAN', 'PIT', 'COAT', 'DREAMS'] }),
        read('gen38-read', 38, null, 'Read Genesis 38 — Judah and Tamar',
          'Judah leaves his brothers, marries, and loses two sons. When he fails to keep his promise to Tamar, she acts boldly to claim justice, and Judah says, “She hath been more righteous than I.” It’s the story of a man brought to honest repentance, and the line of Judah continues through Perez.',
          'When has someone else’s honesty exposed your own failing, and what did you do about it?'),
        play('gen38-game', 'versebuilder', 'Play: rebuild the verse'),
        summary('joseph-dreamer-summary', 'Genesis 36-38: The Big Picture',
          'Genesis 36 traces Esau’s family into the nation of Edom. Genesis 37 begins the story of Joseph: his father’s favorite, hated by his brothers for his dreams, sold into slavery, and reported dead. Genesis 38 interrupts with Judah’s story: his failures, Tamar’s courage, and Judah’s confession. Together they show a family full of favoritism and compromise, with God quietly at work.',
          'Joseph is sold, Judah stumbles, and Esau’s line grows. These are three storylines that look very different, all unfolding under the same God.',
          'What storyline in your life looks messy right now, and how might God be at work in it?'),
        play('joseph-dreamer-finale', 'crossword', 'Finale: crossword — Joseph the dreamer', { crossword: CW.josephdream })
      ]
    },

    // ------------------------------------------------------------ Genesis 39-41
    {
      id: 'joseph-egypt',
      title: 'Joseph in Egypt',
      range: 'Genesis 39–41',
      color: 'game',
      beats: [
        read('gen39-read', 39, null, 'Read Genesis 39 — Potiphar’s house and the prison',
          'Joseph is a slave far from home, and “the LORD was with Joseph.” When Potiphar’s wife pursues him, he flees: “How then can I do this great wickedness, and sin against God?” He is punished for doing right, and the LORD is with him in prison too.',
          'Where have you suffered for doing the right thing, and how did you sense God’s presence?'),
        play('gen39-game', 'wordsearch', 'Play: word search', words('Potiphar’s house', ['JOSEPH', 'POTIPHAR', 'EGYPT', 'PRISON', 'GARMENT', 'KEEPER', 'FAVOR', 'INTEGRITY'])),
        read('gen40-read', 40, null, 'Read Genesis 40 — two dreams in prison',
          'Joseph notices that the cupbearer and the baker are troubled, asks about their dreams, and says, “Do not interpretations belong to God?” The cupbearer is restored and forgets him. Faithful service in an unseen place can go unremembered for a while.',
          'What good work are you doing that feels forgotten, and how can you keep faith that God sees it?'),
        play('gen40-game', 'fillblank', 'Play: fill in the blank'),
        read('gen41a-read', 41, [1, 36], 'Read Genesis 41:1-36 — Pharaoh’s dreams',
          'After two more years, Pharaoh’s dreams trouble him and the cupbearer finally remembers Joseph. Joseph says, “It is not in me: God shall give Pharaoh an answer of peace,” and then offers a wise plan. He gives God the credit and then gets to work.',
          'How do you handle credit when you’re given an opportunity, and what does wise preparation look like in your life right now?'),
        play('gen41a-game', 'unscramble', 'Play: unscramble', { scrambleWords: ['PHARAOH', 'COWS', 'GRAIN', 'FAMINE', 'PLENTY', 'NILE', 'DREAMS', 'STOREHOUSES'] }),
        read('gen41b-read', 41, [37, 57, true], 'Read Genesis 41:37-57 — Joseph raised up',
          'Joseph goes from prison to second-in-command at thirty. He names his sons for what God did: Manasseh, because God “hath made me forget all my toil,” and Ephraim, because God “hath caused me to be fruitful in the land of my affliction.” Even when everything is reversed, he keeps naming God in the story.',
          'How would you describe, in your own words, what God has done for you in a hard place?'),
        play('gen41b-game', 'versebuilder', 'Play: rebuild the verse'),
        summary('joseph-egypt-summary', 'Genesis 39-41: The Big Picture',
          'Sold to Potiphar, Joseph prospers because the LORD is with him. When he refuses Potiphar’s wife, he is thrown into prison, where he interprets the dreams of the cupbearer and baker and is forgotten for two years. Then Pharaoh’s dreams require him, and Joseph, now thirty, is raised from prison to oversee Egypt’s grain and prepare for seven years of famine. At every stage the story says the same thing: the LORD was with Joseph.',
          'A slave, a prisoner, and a ruler: Joseph’s circumstances swing wildly, but what doesn’t change is that God is with him and that he stays faithful.',
          'What would it mean for you to be as faithful “in the pit” as you are “in the palace”?'),
        play('joseph-egypt-finale', 'crossword', 'Finale: crossword — Joseph in Egypt', { crossword: CW.josephegypt })
      ]
    },

    // ------------------------------------------------------------ Genesis 42-45
    {
      id: 'reunion',
      title: 'Joseph & His Brothers',
      range: 'Genesis 42–45',
      color: 'brass',
      beats: [
        read('gen42-read', 42, null, 'Read Genesis 42 — the brothers come to Egypt',
          'Famine drives the brothers to Egypt, where they bow before a man they don’t recognize. Joseph tests them, and their guilt surfaces: “We are verily guilty concerning our brother.” Old wrongs rarely stay buried. They come out when pressure comes.',
          'Is there an old wrong you’ve buried that deserves honesty and repair?'),
        play('gen42-game', 'wordsearch', 'Play: word search', words('The brothers return', ['JOSEPH', 'BENJAMIN', 'SIMEON', 'REUBEN', 'GRAIN', 'EGYPT', 'SPIES', 'SACKS'])),
        read('gen43-read', 43, null, 'Read Genesis 43 — a second journey with Benjamin',
          'Judah steps forward to be surety for Benjamin, and Jacob lets go with the words, “If I be bereaved of my children, I am bereaved.” Joseph meets Benjamin, hurries out, and weeps privately. Judah, who once suggested selling a brother, becomes the one who will protect another.',
          'Where is God growing you from self-protection into sacrifice for someone else?'),
        play('gen43-game', 'fillblank', 'Play: fill in the blank'),
        read('gen44-read', 44, null, 'Read Genesis 44 — the silver cup, and Judah’s plea',
          'Joseph’s silver cup is found in Benjamin’s sack, and Judah offers himself as a slave in Benjamin’s place, pleading for his father’s sake. The same brothers who sold Joseph now will not abandon Benjamin. Repentance shows up as costly love.',
          'What would a costly act of love look like for someone in your life this week?'),
        play('gen44-game', 'unscramble', 'Play: unscramble', { scrambleWords: ['JUDAH', 'BENJAMIN', 'SILVER', 'CUP', 'SACK', 'STEWARD', 'SLAVE', 'FATHER'] }),
        read('gen45-read', 45, null, 'Read Genesis 45 — “I am Joseph”',
          'Joseph can’t hold it in: “I am Joseph; doth my father yet live?” He tells his terrified brothers, “God sent me before you to preserve you a posterity in the earth.” He doesn’t deny what they did, but he sees God’s larger purpose and chooses grace.',
          'Who is someone you need to forgive, and how might seeing God’s bigger picture help?'),
        play('gen45-game', 'versebuilder', 'Play: rebuild the verse'),
        summary('reunion-summary', 'Genesis 42-45: The Big Picture',
          'Famine sends Joseph’s brothers to Egypt, where they bow to him without recognizing him. Joseph tests them with accusations, the return of their money, and the demand to bring Benjamin. On the second trip Judah offers himself in Benjamin’s place, and Joseph reveals himself, weeping. He tells his brothers that God sent him ahead to save lives, and invites the whole family to Egypt. A story that began in betrayal ends in forgiveness.',
          'Joseph’s forgiveness is not casual. It follows tests, tears, and real change in his brothers, and it is rooted in his conviction that God was at work all along.',
          'What would it take for you to move from resentment toward the kind of forgiveness Joseph shows?'),
        play('reunion-finale', 'crossword', 'Finale: crossword — Joseph and his brothers', { crossword: CW.reunion })
      ]
    },

    // ------------------------------------------------------------ Genesis 46-50
    {
      id: 'egypt',
      title: 'Israel in Egypt',
      range: 'Genesis 46–50',
      color: 'game',
      beats: [
        read('gen46-read', 46, null, 'Read Genesis 46 — Jacob goes down to Egypt',
          'Before leaving Canaan, Jacob stops at Beersheba to worship, and God tells him, “Fear not to go down into Egypt; for I will there make of thee a great nation.” The chapter lists seventy people who go with him. God goes with his people into places that feel risky.',
          'What “Egypt,” what risky or unfamiliar place, are you facing, and how can you take God’s promise with you?'),
        play('gen46-game', 'wordsearch', 'Play: word search', words('Down to Egypt', ['JACOB', 'JOSEPH', 'GOSHEN', 'BEERSHEBA', 'SEVENTY', 'SHEPHERDS', 'WAGONS', 'NATION'])),
        read('gen47-read', 47, null, 'Read Genesis 47 — Jacob before Pharaoh, and the famine',
          'Jacob blesses Pharaoh and describes his own life as “few and evil.” The famine deepens, and Joseph manages Egypt’s grain wisely. At the end Jacob asks Joseph to promise to bury him with his fathers. Even near the end, Jacob’s eyes are on the promised land.',
          'What would you want your last wishes to say about where your hope is?'),
        play('gen47-game', 'fillblank', 'Play: fill in the blank'),
        read('gen48-read', 48, null, 'Read Genesis 48 — Jacob blesses Ephraim and Manasseh',
          'Jacob, nearly blind, adopts Joseph’s sons as his own and, crossing his hands, gives the greater blessing to the younger, Ephraim. He calls God “the God which fed me all my life long.” A lifetime of wrestling ends in simple gratitude.',
          'How would you finish the sentence, “God has fed me all my life long with…”?'),
        play('gen48-game', 'unscramble', 'Play: unscramble', { scrambleWords: ['JACOB', 'EPHRAIM', 'MANASSEH', 'JOSEPH', 'BLESSING', 'RIGHT', 'HAND', 'SHEPHERD'] }),
        read('gen49-read', 49, null, 'Read Genesis 49 — Jacob’s words over the twelve tribes',
          'Jacob gathers his sons and speaks to each of them. Some words are sharp and some are tender. To Judah he says, “The sceptre shall not depart from Judah.” Looking back, this chapter points toward a king who would come from Judah’s line.',
          'If someone spoke honestly over your life, what would be true and good, and what might need attention?'),
        play('gen49-game', 'versebuilder', 'Play: rebuild the verse'),
        read('gen50-read', 50, null, 'Read Genesis 50 — burying Jacob, and “God meant it unto good”',
          'After Jacob dies, the brothers fear Joseph will pay them back. Joseph weeps and says, “Ye thought evil against me; but God meant it unto good.” Genesis ends with Joseph asking that his bones be carried out of Egypt someday, looking ahead to the Exodus.',
          'What hard thing in your story are you beginning to see as something God “meant it unto good”?'),
        play('gen50-game', 'memorymatch', 'Play: memory match'),
        summary('egypt-summary', 'Genesis 46-50: The Big Picture',
          'Jacob moves his family to Egypt, reunites with Joseph, and is received by Pharaoh. Joseph guides Egypt through the famine. Before he dies, Jacob blesses Joseph’s sons and speaks over each of the twelve tribes, with a promise attached to Judah. After Jacob’s burial in Canaan, Joseph reassures his brothers that God meant their evil for good, and asks that his bones be carried to the promised land. Genesis ends with a family in Egypt and a promise still waiting.',
          'The book that began with “In the beginning God” ends with a coffin in Egypt and a promise: God will surely visit you. The story is unfinished on purpose.',
          'Looking back over all of Genesis, what is the one thing you most want to remember about who God is?'),
        play('egypt-finale', 'crossword', 'Finale: crossword — Israel in Egypt', { crossword: CW.egypt })
      ]
    }

  );
})();
