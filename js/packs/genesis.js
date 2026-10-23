// Built-in game packs for Genesis 2-50 (Genesis 1 lives in data.js as SEED_GAME).
// Same shape as docs/GAME_PACK_FORMAT.md: matching sections + a 5-question quiz.
//
// They ship with the app, so every reader gets them and updates arrive with each
// deploy. A pack a reader imports for the same chapter still wins over these.
//
// Authoring shortcuts (the result is plain pack data):
//   m(heading, prompt, pairs)               one matching game
//   q(question, correct, wrong1, wrong2, wrong3)
//        builds a 4-option question and places the correct answer at a position
//        chosen from the question text, so answers are spread across A-D and the
//        order is the same on every device.
(function () {
  const m = (heading, prompt, pairs) => ({ heading, matching: { prompt, pairs } });
  const q = (text, correct, ...wrong) => {
    let h = 5381;
    for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
    const at = h % (wrong.length + 1);
    const options = wrong.slice();
    options.splice(at, 0, correct);
    return { q: text, options, answer: at };
  };
  const pack = (sections, quiz) => ({ sections, quiz });

  Object.assign(BUILTIN_PACKS, {

    'Genesis-2': pack([
      m('The garden', 'Match each part of the garden story.', [
        ['Man was formed from', 'Dust of the ground'],
        ['Life came from', 'God’s breath'],
        ['The garden was in', 'Eden, to the east'],
        ['The forbidden tree', 'Knowledge of good and evil']]),
      m('The first woman', 'Match each step in making the woman.', [
        ['Not good', 'That the man was alone'],
        ['The man was put into', 'A deep sleep'],
        ['The woman was built from', 'The man’s rib'],
        ['Husband and wife', 'Become one flesh']])
    ], [
      q('What did God form the man from?', 'The dust of the ground', 'Clay from the river Pishon', 'Stones gathered from the field', 'The light of the first day'),
      q('Which day did God bless and set apart as holy?', 'The seventh day', 'The first day', 'The fourth day', 'The sixth day'),
      q('What did God say was “not good”?', 'The man being alone', 'Being naked', 'Working the garden', 'Naming the animals'),
      q('Which tree was the man told not to eat from?', 'The tree of the knowledge of good and evil', 'The fig tree beside the river Gihon', 'The vine growing near the garden gate', 'The olive tree east of Eden'),
      q('How did the man and woman feel about being naked at first?', 'Not ashamed', 'Afraid', 'Ashamed', 'Cold')
    ]),

    'Genesis-3': pack([
      m('The temptation', 'Match each person to what they did.', [
        ['The serpent', 'Questioned what God said'],
        ['Eve', 'Ate and gave to her husband'],
        ['Adam', 'Ate, then blamed the woman'],
        ['Both of them', 'Sewed fig leaves']]),
      m('What followed', 'Match each to what God said or did.', [
        ['The serpent', 'Would crawl on its belly'],
        ['The woman', 'Pain in childbearing'],
        ['The man', 'Toil among thorns'],
        ['East of Eden', 'Cherubim and a flaming sword']])
    ], [
      q('How did the serpent begin the conversation?', '“Did God really say…?”', '“Are you hungry?”', '“Who made you?”', '“Where is your husband?”'),
      q('What did Adam and Eve use to cover themselves?', 'Fig leaves', 'Animal skins', 'Palm branches', 'Wool'),
      q('What name did Adam give his wife?', 'Eve', 'Sarah', 'Rachel', 'Naomi'),
      q('What did God make for them before sending them out?', 'Garments of skin', 'Tents', 'Sandals', 'A shelter'),
      q('Who was posted to guard the way to the tree of life?', 'Cherubim', 'Seraphim', 'Gabriel', 'Adam')
    ]),

    'Genesis-4': pack([
      m('Two brothers', 'Match each name to the right detail.', [
        ['Cain', 'Worked the ground'],
        ['Abel', 'Kept sheep'],
        ['Seth', 'Born after Abel’s death'],
        ['Enoch', 'The city Cain built']]),
      m('Lamech’s sons', 'Match each son to his trade.', [
        ['Jabal', 'Tents and livestock'],
        ['Jubal', 'Harp and pipe'],
        ['Tubal-cain', 'Bronze and iron tools']])
    ], [
      q('Whose offering did the LORD look on with favor?', 'Abel’s', 'Cain’s', 'Seth’s', 'Enoch’s'),
      q('What did God say was crouching at Cain’s door?', 'Sin', 'An enemy', 'A lion', 'Death'),
      q('How did Cain answer when God asked about Abel?', '“Am I my brother’s keeper?”', '“He ran away.”', '“He is sleeping.”', '“I did not see him.”'),
      q('Where did Cain settle?', 'The land of Nod', 'The land of Egypt', 'The land of Canaan', 'The land of Shinar'),
      q('What did people begin to do when Enosh was born?', 'Call on the name of the LORD', 'Build cities for their families', 'Raise tents and keep their cattle', 'Play the harp and the pipe')
    ]),

    'Genesis-5': pack([
      m('Long lives', 'Match each person to the detail.', [
        ['Adam', 'Lived 930 years'],
        ['Enoch', 'Walked with God; God took him'],
        ['Methuselah', 'Lived 969 years, the longest'],
        ['Lamech', 'Named his son Noah']]),
      m('The line to Noah', 'Match each father to his son.', [
        ['Adam', 'Seth'],
        ['Seth', 'Enosh'],
        ['Enoch', 'Methuselah'],
        ['Noah', 'Shem, Ham and Japheth']])
    ], [
      q('Who “walked with God” and then “was not, for God took him”?', 'Enoch', 'Noah', 'Seth', 'Lamech'),
      q('Who lived the longest, at 969 years?', 'Methuselah', 'Adam', 'Jared', 'Noah'),
      q('How old was Noah when he became the father of Shem, Ham and Japheth?', '500', '100', '300', '900'),
      q('Which son was born in Adam’s own likeness and image?', 'Seth', 'Cain', 'Abel', 'Enosh'),
      q('What sentence ends each life listed in the chapter (except Enoch’s)?', '“And he died.”', '“And he rested.”', '“And he travelled.”', '“And he prayed.”')
    ]),

    'Genesis-6': pack([
      m('Building the ark', 'Match each detail of the ark.', [
        ['Made of', 'Gopher wood'],
        ['Sealed with', 'Pitch, inside and out'],
        ['Length', '300 cubits'],
        ['Levels', 'Three decks']]),
      m('Noah', 'Match each to the right detail.', [
        ['What Noah found', 'Grace in the LORD’s eyes'],
        ['How Noah lived', 'Walked with God'],
        ['His three sons', 'Shem, Ham, Japheth'],
        ['What God made', 'A covenant with Noah']])
    ], [
      q('What did Noah find in the eyes of the LORD?', 'Grace', 'Wealth', 'Wisdom', 'A kingdom'),
      q('What was the ark made of?', 'Gopher wood', 'Cedar', 'Acacia', 'Olive wood'),
      q('How long was the ark?', '300 cubits', '30 cubits', '100 cubits', '1,000 cubits'),
      q('How does the chapter describe the earth in God’s sight?', 'Corrupt and filled with violence', 'Empty, silent and without life', 'Peaceful and full of worship', 'Divided among quarreling nations'),
      q('What did God promise to establish with Noah?', 'A covenant', 'A kingdom', 'A temple', 'A city')
    ]),

    'Genesis-7': pack([
      m('Into the ark', 'Match each detail.', [
        ['Clean animals', 'Taken in by sevens'],
        ['Unclean animals', 'Taken in by twos'],
        ['Noah’s age', '600 years'],
        ['Who shut the door', 'The LORD']]),
      m('The flood', 'Match each detail of the flood.', [
        ['Rain fell', 'Forty days and nights'],
        ['The great deep', 'Its fountains broke open'],
        ['The waters prevailed', '150 days'],
        ['Who stayed alive', 'Noah and those with him']])
    ], [
      q('How old was Noah when the flood came?', '600', '500', '950', '120'),
      q('How long did the rain fall?', 'Forty days and forty nights', 'One hundred and fifty days', 'Seven days and seven nights', 'A full year and ten days'),
      q('Who shut the door of the ark?', 'The LORD', 'Noah', 'Shem', 'An angel'),
      q('What happened to “the fountains of the great deep”?', 'They were broken up', 'They dried out', 'They froze', 'They were sealed'),
      q('How many days did the waters prevail on the earth?', '150 days', '40 days', '7 days', '365 days')
    ]),

    'Genesis-8': pack([
      m('The waters go down', 'Match each detail.', [
        ['The ark came to rest', 'Mountains of Ararat'],
        ['The first bird sent out', 'A raven'],
        ['The dove brought back', 'An olive leaf'],
        ['Third time the dove', 'Did not return']]),
      m('After the flood', 'Match each detail.', [
        ['Noah built', 'An altar'],
        ['He offered', 'Burnt offerings'],
        ['God promised', 'Never to flood the earth again'],
        ['Seasons would not cease', 'Seedtime and harvest']])
    ], [
      q('Where did the ark come to rest?', 'The mountains of Ararat', 'The slopes of Mount Sinai', 'The heights of Mount Moriah', 'The ridge of Mount Carmel'),
      q('What did the dove bring back to Noah?', 'An olive leaf', 'A fig', 'A grape', 'A twig of cedar'),
      q('What did Noah build when he left the ark?', 'An altar', 'A house', 'A tower', 'A city'),
      q('How many times did Noah send out the dove?', 'Three', 'Once', 'Two', 'Seven'),
      q('What did God say would not cease while the earth remains?', 'Seedtime and harvest', 'Kings and their kingdoms', 'Flocks and their shepherds', 'Tents and their builders')
    ]),

    'Genesis-9': pack([
      m('God’s covenant', 'Match each detail.', [
        ['The sign of the covenant', 'The rainbow'],
        ['God’s promise', 'No more worldwide flood'],
        ['Why life is protected', 'Man is made in God’s image'],
        ['The first command', 'Be fruitful and multiply']]),
      m('Noah’s family', 'Match each person to what happened.', [
        ['Noah', 'Planted a vineyard'],
        ['Ham', 'Told his brothers'],
        ['Shem and Japheth', 'Covered their father'],
        ['Canaan', 'Was cursed by Noah']])
    ], [
      q('What is the sign of God’s covenant with Noah?', 'The rainbow', 'A star', 'A dove', 'An altar'),
      q('What did God promise never to do again?', 'Destroy all life with a flood', 'Send fire down on every city', 'Bring a famine on all the earth', 'Scatter the nations once again'),
      q('Why is human life to be protected?', 'People are made in God’s image', 'People are stronger than animals', 'People are wiser than the angels', 'People are the oldest creatures'),
      q('Whom did Noah curse after the incident in the tent?', 'Canaan', 'Shem', 'Japheth', 'Cush'),
      q('How old was Noah when he died?', '950', '600', '777', '175')
    ]),

    'Genesis-10': pack([
      m('Noah’s sons', 'Match each son to a descendant.', [
        ['Japheth', 'Gomer'],
        ['Ham', 'Cush'],
        ['Shem', 'Arphaxad'],
        ['Cush', 'Nimrod']]),
      m('Names and places', 'Match each to the right detail.', [
        ['Nimrod', 'A mighty hunter before the LORD'],
        ['Asshur', 'Built Nineveh'],
        ['Peleg', 'The earth was divided in his days'],
        ['Eber', 'Shem’s descendant and father of Peleg']])
    ], [
      q('How many sons did Noah have?', 'Three', 'Two', 'Seven', 'Twelve'),
      q('Who was “a mighty hunter before the LORD”?', 'Nimrod', 'Cush', 'Eber', 'Asshur'),
      q('Which city did Asshur build?', 'Nineveh', 'Babel', 'Sodom', 'Haran'),
      q('In whose days was “the earth divided”?', 'Peleg', 'Nimrod', 'Noah', 'Eber'),
      q('Which of Noah’s sons was the father of Canaan?', 'Ham', 'Shem', 'Japheth', 'Cush')
    ]),

    'Genesis-11': pack([
      m('Babel', 'Match each detail of the tower story.', [
        ['The land', 'Shinar'],
        ['Building materials', 'Brick and tar'],
        ['Their goal', 'Make a name for themselves'],
        ['God’s response', 'Confused their language']]),
      m('Toward Abram', 'Match each person to the right detail.', [
        ['Terah', 'Father of Abram'],
        ['Sarai', 'Abram’s wife'],
        ['Lot', 'Abram’s nephew'],
        ['Haran (the city)', 'Where Terah settled']])
    ], [
      q('In which land did the people build the tower?', 'Shinar', 'Egypt', 'Canaan', 'Goshen'),
      q('Why did the people want to build the tower?', 'To make a name for themselves and not be scattered', 'To escape a second flood they feared', 'To honor their king with a monument', 'To watch the stars and track the seasons'),
      q('What did God do to stop the project?', 'Confused their language', 'Sent a second flood upon them', 'Sent fire down on the tower', 'Struck the builders with a famine'),
      q('What does “Babel” point to?', 'Confusion', 'Gate of heaven', 'House of bread', 'City of peace'),
      q('Who was Abram’s father?', 'Terah', 'Nahor', 'Haran', 'Lot')
    ]),

    'Genesis-12': pack([
      m('God’s call', 'Match each part of the call and promise.', [
        ['Abram’s age', '75 years old'],
        ['The promise', 'A great nation'],
        ['All the families of the earth', 'Would be blessed through him'],
        ['Abram traveled to', 'The land of Canaan']]),
      m('Altars and Egypt', 'Match each detail.', [
        ['First altar', 'Near Shechem'],
        ['Why Abram went to Egypt', 'A famine'],
        ['What Abram called Sarai', 'His sister'],
        ['Who took Sarai', 'Pharaoh']])
    ], [
      q('How old was Abram when he left Haran?', '75', '99', '40', '100'),
      q('What was God’s promise to Abram?', 'To make him a great nation and bless all families through him', 'To make him king over all the land of Egypt', 'To give him long life and keep him safe from famine', 'To bless Lot’s family and leave Abram with nothing'),
      q('Why did Abram go down to Egypt?', 'There was a famine in the land', 'He wanted to trade with the Egyptians', 'He had been invited by Pharaoh', 'He was fleeing from a great war'),
      q('What did Abram tell the Egyptians about Sarai?', 'That she was his sister', 'That she was a servant', 'That she was a queen', 'That she was his daughter'),
      q('How did God respond when Pharaoh took Sarai?', 'He sent plagues on Pharaoh’s house', 'He sent an earthquake on the palace', 'He sent darkness over all of Egypt', 'He sent a famine on Pharaoh’s house')
    ]),

    'Genesis-13': pack([
      m('Abram and Lot', 'Match each person to what they did.', [
        ['Abram', 'Let Lot choose first'],
        ['Lot', 'Chose the Jordan plain'],
        ['Their herdsmen', 'Quarreled'],
        ['Abram settled at', 'Hebron, by the oaks of Mamre']]),
      m('The promise renewed', 'Match each detail.', [
        ['Lot’s land', 'Well watered, like the LORD’s garden'],
        ['Lot pitched his tent toward', 'Sodom'],
        ['The men of Sodom', 'Wicked sinners against the LORD'],
        ['Abram’s descendants', 'Like the dust of the earth']])
    ], [
      q('Why did Abram and Lot need to separate?', 'Their flocks were too large to share the land', 'They disagreed about where to worship', 'Pharaoh ordered them to live apart', 'Lot wanted to go back to Ur of the Chaldeans'),
      q('Who offered the other the first choice of land?', 'Abram', 'Lot', 'Pharaoh', 'Melchizedek'),
      q('Which land did Lot choose?', 'The plain of the Jordan', 'The hill country', 'The Negeb', 'The coast'),
      q('How are the men of Sodom described?', 'Wicked, sinning greatly against the LORD', 'Poor, hungry and begging for bread', 'Wise, generous and welcoming to strangers', 'Few, weak and afraid of their neighbors'),
      q('How many descendants did God promise Abram?', 'As many as the dust of the earth', 'Twelve', 'As many as the sheep', 'One for each year of his life')
    ]),

    'Genesis-14': pack([
      m('Rescuing Lot', 'Match each detail of the rescue.', [
        ['Who was captured', 'Lot'],
        ['Abram’s trained men', '318'],
        ['Abram attacked', 'By night'],
        ['What he brought back', 'Lot and the goods']]),
      m('Two kings', 'Match each king to the detail.', [
        ['Melchizedek', 'King of Salem and priest'],
        ['He brought out', 'Bread and wine'],
        ['Abram gave him', 'A tenth of everything'],
        ['The king of Sodom', 'Offered Abram the goods']])
    ], [
      q('Who was taken captive in the war of the kings?', 'Lot', 'Isaac', 'Sarai', 'Eliezer'),
      q('How many trained men did Abram take to rescue him?', '318', '12', '70', '1,000'),
      q('Who was “priest of God Most High” and king of Salem?', 'Melchizedek', 'Abimelech', 'Chedorlaomer', 'Hamor'),
      q('What did Abram give to Melchizedek?', 'A tenth of everything', 'A lamb from his flock', 'His sword and his shield', 'A field by the river'),
      q('What did Abram refuse from the king of Sodom?', 'Any of the goods, even a thread', 'A seat beside the king of Sodom', 'A home inside the city of Sodom', 'An alliance with the kings of the east')
    ]),

    'Genesis-15': pack([
      m('God’s promises', 'Match each promise or image.', [
        ['“I am your…”', 'Shield and great reward'],
        ['Abram’s descendants', 'Like the stars'],
        ['Counted as righteousness', 'Abram’s belief'],
        ['Time in a foreign land', 'Four hundred years']]),
      m('The covenant scene', 'Match each detail.', [
        ['Abram’s servant-heir', 'Eliezer of Damascus'],
        ['Animals cut in two', 'Heifer, goat and ram'],
        ['What came down on Abram', 'A deep sleep'],
        ['What passed between the pieces', 'A smoking pot and flaming torch']])
    ], [
      q('What did God tell Abram to count?', 'The stars', 'The sand', 'The sheep', 'The years'),
      q('What was “counted to him as righteousness”?', 'Abram believed the LORD', 'Abram’s sacrifice', 'Abram’s wealth', 'Abram’s obedience in battle'),
      q('Who was Abram’s servant, who might have been his heir?', 'Eliezer of Damascus', 'Lot the son of his brother', 'Laban of the city of Haran', 'Hagar’s son Ishmael'),
      q('How long would his descendants be strangers in a land not theirs?', 'Four hundred years', 'Forty years', 'Seventy years', 'Ten years'),
      q('What passed between the pieces of the animals?', 'A smoking fire pot and a flaming torch', 'A white dove carrying an olive leaf', 'An angel holding a sword of fire', 'A rainbow stretching over the pieces')
    ]),

    'Genesis-16': pack([
      m('Hagar', 'Match each detail.', [
        ['Hagar', 'Sarai’s Egyptian servant'],
        ['Why she was given to Abram', 'Sarai had no children'],
        ['Where the angel found her', 'A spring in the wilderness'],
        ['Her son', 'Ishmael']]),
      m('Names that mean something', 'Match each name to its meaning.', [
        ['Ishmael', '“God hears”'],
        ['El Roi', '“The God who sees me”'],
        ['Beer-lahai-roi', 'The well named after that']])
    ], [
      q('Who was Hagar?', 'Sarai’s Egyptian servant', 'Lot’s wife', 'Pharaoh’s daughter', 'Isaac’s nurse'),
      q('Why did Sarai give Hagar to Abram?', 'Sarai had not been able to have children', 'Hagar had begged to be Abram’s wife', 'Pharaoh had commanded the arrangement', 'Abram needed another servant for his house'),
      q('Where did the angel of the LORD find Hagar?', 'By a spring in the wilderness', 'Inside Sarai’s tent in the camp', 'Beside the altar at Bethel', 'In the shade of the oaks of Mamre'),
      q('What was the child to be named?', 'Ishmael', 'Isaac', 'Esau', 'Eliezer'),
      q('How old was Abram when Ishmael was born?', '86', '75', '99', '100')
    ]),

    'Genesis-17': pack([
      m('New names', 'Match the old name to the new one.', [
        ['Abram', 'Abraham'],
        ['Sarai', 'Sarah'],
        ['Abraham means', '“Father of many nations”'],
        ['The promised son', 'Isaac']]),
      m('The covenant', 'Match each detail.', [
        ['Abraham’s age', '99 years old'],
        ['God’s name here', 'God Almighty'],
        ['The sign of the covenant', 'Circumcision'],
        ['When it was done to a baby boy', 'On the eighth day']])
    ], [
      q('How old was Abram when God appeared to him in this chapter?', '99', '75', '86', '100'),
      q('What did God change Abram’s name to?', 'Abraham', 'Israel', 'Ibrahim', 'Abimelech'),
      q('What is the sign of the covenant given here?', 'Circumcision', 'A rainbow', 'A pillar of stone', 'A burning bush'),
      q('What was Abraham’s reaction to the promise of a son by Sarah?', 'He fell on his face and laughed', 'He wept and tore his clothing', 'He built an altar and praised God', 'He argued with God and refused'),
      q('What name was Sarah’s promised son to be given?', 'Isaac', 'Ishmael', 'Jacob', 'Esau')
    ]),

    'Genesis-18': pack([
      m('Visitors at Mamre', 'Match each detail.', [
        ['Where the visitors found Abraham', 'At his tent, by the oaks of Mamre'],
        ['Abraham’s welcome', 'Water, bread and a calf'],
        ['The news they brought', 'Sarah will have a son'],
        ['Sarah’s reaction', 'She laughed']]),
      m('Praying for Sodom', 'Match each detail.', [
        ['Abraham’s question', 'Will the Judge of all the earth do right?'],
        ['First number of righteous', 'Fifty'],
        ['The lowest number', 'Ten'],
        ['Abraham’s role', 'Speaking up for others']])
    ], [
      q('Who laughed when she heard she would have a son?', 'Sarah', 'Hagar', 'Lot’s wife', 'Rebekah'),
      q('What did the LORD ask Abraham about Sarah’s laugh?', '“Is anything too hard for the LORD?”', '“Why are you afraid of the stranger?”', '“Where is your son who was promised?”', '“Who told you about the coming son?”'),
      q('What did Abraham plead for?', 'That Sodom be spared for the righteous in it', 'That Lot be given a house in Sodom', 'That Isaac be born before the winter', 'That Hagar return to Abraham’s tent'),
      q('What was the smallest number of righteous people Abraham asked about?', 'Ten', 'Five', 'Twenty', 'Thirty'),
      q('How did Abraham describe God in his plea?', 'The Judge of all the earth', 'The King of Egypt', 'The Shepherd of Israel', 'The God of Moab')
    ]),

    'Genesis-19': pack([
      m('Escaping Sodom', 'Match each detail.', [
        ['Lot was sitting', 'In the gate of Sodom'],
        ['The visitors', 'Two angels'],
        ['The warning', 'Do not look back'],
        ['Lot fled to', 'Zoar']]),
      m('The judgment', 'Match each detail.', [
        ['What fell on the cities', 'Sulfur and fire'],
        ['Lot’s wife', 'Became a pillar of salt'],
        ['What Abraham saw', 'Smoke like a furnace'],
        ['Lot’s descendants', 'Moab and Ammon']])
    ], [
      q('How many angels came to Sodom?', 'Two', 'One', 'Three', 'Seven'),
      q('What happened to the men who crowded Lot’s door?', 'They were struck with blindness', 'They were turned back by soldiers', 'They fell asleep at the door', 'They were driven away by fire'),
      q('What happened to Lot’s wife when she looked back?', 'She became a pillar of salt', 'She fell ill', 'She was left behind', 'She was swallowed by the earth'),
      q('Which small city did Lot ask to flee to?', 'Zoar', 'Gerar', 'Salem', 'Admah'),
      q('What did the LORD rain on Sodom and Gomorrah?', 'Sulfur and fire', 'Hail', 'Water', 'Stones only')
    ]),

    'Genesis-20': pack([
      m('Abraham in Gerar', 'Match each detail.', [
        ['Where Abraham stayed', 'Gerar'],
        ['The king', 'Abimelech'],
        ['What Abraham said of Sarah', 'She is my sister'],
        ['How God warned Abimelech', 'In a dream']]),
      m('Putting it right', 'Match each detail.', [
        ['Abraham was called', 'A prophet'],
        ['What Abraham did', 'Prayed for Abimelech'],
        ['God’s response', 'Healed Abimelech’s household'],
        ['What Abimelech gave', 'Animals, servants and silver']])
    ], [
      q('In which place did Abraham stay in this chapter?', 'Gerar', 'Haran', 'Hebron', 'Bethel'),
      q('How did God warn Abimelech not to touch Sarah?', 'In a dream', 'Through an angel at the gate', 'Through a plague', 'Through a prophet'),
      q('Why had Abraham said Sarah was his sister?', 'He feared no one there feared God', 'Sarah had asked him to say it', 'It was the custom of the people there', 'Abimelech had demanded that he say it'),
      q('Whom did God say would pray for Abimelech?', 'Abraham', 'Isaac', 'Sarah', 'Lot'),
      q('What happened after Abraham prayed?', 'God healed Abimelech’s household', 'A famine ended across all of Gerar', 'A well opened beside the city gate', 'An army came to defend the king')
    ]),

    'Genesis-21': pack([
      m('Isaac is born', 'Match each detail.', [
        ['Isaac’s name', 'Means “he laughs”'],
        ['Abraham’s age at his birth', '100 years old'],
        ['Isaac was circumcised', 'On the eighth day'],
        ['The feast', 'When Isaac was weaned']]),
      m('Hagar and Beersheba', 'Match each detail.', [
        ['Hagar and Ishmael were sent to', 'The wilderness'],
        ['God showed Hagar', 'A well of water'],
        ['Ishmael grew up to be', 'An archer'],
        ['Seven lambs', 'Witness to the well at Beersheba']])
    ], [
      q('How old was Abraham when Isaac was born?', '100', '86', '75', '120'),
      q('What did Sarah say God had done for her?', 'Made her laugh', 'Given her land', 'Made her a queen', 'Sent her a servant'),
      q('What did God say about Ishmael?', 'He would also become a nation', 'He would rule Isaac', 'He would be forgotten', 'He would return to Egypt'),
      q('How did God help Hagar in the wilderness?', 'He opened her eyes to a well of water', 'He sent rain that filled the valley', 'He sent bread down from heaven', 'He sent a caravan of traveling merchants'),
      q('What does Beersheba recall?', 'The well of the oath, with seven lambs', 'A battle fought against the Philistines', 'A tower built beside the sea', 'A flood that stopped at the border')
    ]),

    'Genesis-22': pack([
      m('The test on Moriah', 'Match each detail.', [
        ['The place', 'The land of Moriah'],
        ['Who carried the wood', 'Isaac'],
        ['Who stopped Abraham', 'The angel of the LORD'],
        ['The substitute', 'A ram caught in a thicket']]),
      m('The promise', 'Match each detail.', [
        ['The name Abraham gave the place', '“The LORD will provide”'],
        ['His descendants', 'Like the stars and the sand'],
        ['Why God blessed him', 'He obeyed God’s voice'],
        ['Rebekah’s father', 'Bethuel']])
    ], [
      q('What did God ask Abraham to do with Isaac?', 'Offer him as a burnt offering', 'Send him away to find a wife', 'Give him a new name and a new land', 'Take him to Bethel to build an altar'),
      q('What did Isaac ask his father on the way up the mountain?', '“Where is the lamb for the offering?”', '“Where are we going after this?”', '“Who will carry the wood back home?”', '“When will we return to the tent?”'),
      q('What did Abraham answer?', '“God will provide the lamb.”', '“I do not know.”', '“We have one in the tent.”', '“Ask the servants.”'),
      q('What did Abraham find caught in a thicket?', 'A ram', 'A lamb', 'A goat', 'A bull'),
      q('What name did Abraham give the place?', 'Jehovah-jireh, “the LORD will provide”', 'Bethel, “the house of God”', 'Peniel, “the face of God”', 'Mizpah, “the LORD watch between us”')
    ]),

    'Genesis-23': pack([
      m('Sarah’s death', 'Match each detail.', [
        ['Sarah’s age at death', '127'],
        ['Where she died', 'Hebron'],
        ['Abraham’s words about himself', '“A stranger and sojourner”'],
        ['Where she was buried', 'Cave of Machpelah']]),
      m('The purchase', 'Match each detail.', [
        ['The seller', 'Ephron the Hittite'],
        ['The price', '400 shekels of silver'],
        ['Where the deal was made', 'At the city gate'],
        ['The property', 'A field with a cave']])
    ], [
      q('How old was Sarah when she died?', '127', '100', '90', '175'),
      q('Where did Sarah die?', 'Hebron (Kiriath-arba)', 'Beersheba, in the Negeb', 'Gerar, among the Philistines', 'Bethel, near the altar'),
      q('From whom did Abraham buy a burial place?', 'Ephron the Hittite', 'Abimelech', 'Melchizedek', 'Hamor'),
      q('How much did Abraham pay?', '400 shekels of silver', '30 pieces of silver', '1,000 pieces of silver', '100 pieces of money'),
      q('What did Abraham call himself among the Hittites?', 'A stranger and sojourner', 'A king passing through', 'A prophet of the LORD', 'A judge of the people')
    ]),

    'Genesis-24': pack([
      m('Finding a wife', 'Match each detail.', [
        ['The servant’s task', 'Find a wife for Isaac'],
        ['Where she must come from', 'Abraham’s own relatives'],
        ['His sign at the well', 'Water for him and his camels'],
        ['How many camels he took', 'Ten']]),
      m('Rebekah', 'Match each detail.', [
        ['Rebekah’s father', 'Bethuel'],
        ['Her brother', 'Laban'],
        ['Her answer to “Will you go?”', '“I will go”'],
        ['Where Isaac was when she arrived', 'Meditating in the field']])
    ], [
      q('What did Abraham want for Isaac’s wife?', 'Someone from his own family, not a Canaanite', 'A princess from the house of Pharaoh', 'A daughter of Lot who lived in Zoar', 'A woman chosen from the Canaanites'),
      q('What sign did the servant ask for at the well?', 'That the girl would offer water for him and his camels', 'That a bright star would appear above the well', 'That it would rain on the road back to Haran', 'That a dove would land on his shoulder at the spring'),
      q('What did Rebekah do when asked for a drink?', 'She drew water for him and for his camels', 'She walked away and called her brother', 'She told him to find another well', 'She prayed with him for rain on the road'),
      q('What did Rebekah answer when asked if she would go with the man?', '“I will go.”', '“Not yet.”', '“Ask my mother.”', '“I cannot.”'),
      q('How did Isaac feel about Rebekah?', 'He loved her, and was comforted after his mother’s death', 'He was afraid of her family and wanted to leave', 'He did not know her and waited a year to marry', 'He was angry she had come with so many servants')
    ]),

    'Genesis-25': pack([
      m('Abraham’s end', 'Match each detail.', [
        ['Abraham’s age at death', '175'],
        ['Buried by', 'Isaac and Ishmael'],
        ['Where he was buried', 'Cave of Machpelah'],
        ['Ishmael’s sons', 'Twelve princes']]),
      m('Esau and Jacob', 'Match each detail.', [
        ['Esau', 'Skilled hunter, Isaac’s favorite'],
        ['Jacob', 'Quiet, lived in tents'],
        ['Esau’s other name', 'Edom'],
        ['The price of the birthright', 'Bread and lentil stew']])
    ], [
      q('How old was Abraham when he died?', '175', '127', '100', '99'),
      q('What did the LORD tell Rebekah about her twins?', 'The older will serve the younger', 'The twins will rule together in peace', 'The younger will die before the older', 'Both will live in the land of Egypt'),
      q('How was Jacob’s birth remembered?', 'His hand was holding Esau’s heel', 'He was the firstborn of the twins', 'He was born at night in a tent', 'He was born with red skin and hair'),
      q('What did Esau sell to Jacob?', 'His birthright', 'His tent', 'His bow', 'His flocks'),
      q('What did Esau receive in return?', 'Bread and lentil stew', 'Silver and a woolen cloak', 'A field near the oaks', 'A flock of his father’s goats')
    ]),

    'Genesis-26': pack([
      m('Isaac in Gerar', 'Match each detail.', [
        ['God told Isaac', 'Do not go to Egypt'],
        ['What Isaac said of Rebekah', 'She is my sister'],
        ['His harvest', 'A hundredfold'],
        ['The king', 'Abimelech']]),
      m('Wells', 'Match each well to its name or meaning.', [
        ['Esek', '“Contention”'],
        ['Sitnah', '“Enmity”'],
        ['Rehoboth', '“Room”'],
        ['Beersheba', 'Where the LORD appeared and he built an altar']])
    ], [
      q('What did God tell Isaac during the famine?', 'Do not go down to Egypt', 'Go back to Haran', 'Go to Moab', 'Build a ship'),
      q('How did Isaac’s harvest turn out?', 'A hundredfold', 'Poor', 'Average', 'It failed'),
      q('Why did the Philistines stop up the wells?', 'They envied Isaac’s growing wealth', 'They needed the water', 'They were at war with Abimelech', 'They wanted to hide treasure'),
      q('What did Isaac name the well nobody argued over?', 'Rehoboth', 'Esek', 'Sitnah', 'Shebah'),
      q('Who made a covenant of peace with Isaac at Beersheba?', 'Abimelech', 'Esau', 'Laban', 'Hamor')
    ]),

    'Genesis-27': pack([
      m('The blessing', 'Match each detail.', [
        ['Isaac asked Esau for', 'Wild game'],
        ['Rebekah disguised Jacob with', 'Goat skins'],
        ['What Isaac noticed', 'The voice was Jacob’s'],
        ['Esau’s cry', '“Bless me, even me also”']]),
      m('The fallout', 'Match each detail.', [
        ['Esau planned to', 'Kill Jacob'],
        ['Rebekah told Jacob to flee to', 'Laban in Haran'],
        ['Isaac’s condition', 'Old and nearly blind'],
        ['Who overheard the plan', 'Rebekah']])
    ], [
      q('What was Isaac’s condition in this chapter?', 'He was old and nearly blind', 'He was ill with fever', 'He was a prisoner', 'He was away on a journey'),
      q('What did Rebekah put on Jacob’s hands and neck?', 'Goat skins', 'Wool', 'Oil', 'Ashes'),
      q('What did Isaac say that gave him pause?', '“The voice is Jacob’s, but the hands are Esau’s.”', '“Your brother is waiting outside the tent.”', '“This meat is not from my own flock.”', '“I smell smoke on your hands and clothing.”'),
      q('How did Esau react when he learned what happened?', 'He cried out bitterly', 'He laughed', 'He left at once', 'He blessed Jacob'),
      q('Where did Rebekah send Jacob?', 'To her brother Laban in Haran', 'To her cousin Ishmael in the desert', 'To Abimelech at Gerar for safety', 'To the hill country near Hebron')
    ]),

    'Genesis-28': pack([
      m('The dream at Bethel', 'Match each detail.', [
        ['Jacob’s pillow', 'A stone'],
        ['What he saw', 'A ladder with angels'],
        ['What God promised', 'Land, descendants and his presence'],
        ['Jacob’s words', '“This is the gate of heaven”']]),
      m('The vow', 'Match each detail.', [
        ['Bethel means', '“House of God”'],
        ['The old name of the place', 'Luz'],
        ['What Jacob poured on the pillar', 'Oil'],
        ['What he vowed to give', 'A tenth']])
    ], [
      q('What did Jacob use for a pillow?', 'A stone', 'A bundle of cloth', 'His cloak', 'A saddle'),
      q('What did Jacob see in his dream?', 'A ladder reaching to heaven with angels on it', 'A burning bush that was not consumed', 'A great light shining over the stone', 'A storm cloud with a hand reaching down'),
      q('What did Jacob say when he woke?', '“Surely the LORD is in this place, and I did not know it.”', '“I am alone in this place, and no one is near.”', '“This was only a dream, and I will forget it.”', '“Where is my brother, and why has he not come?”'),
      q('What did Jacob name the place?', 'Bethel', 'Peniel', 'Mizpah', 'Succoth'),
      q('What did Jacob vow to give God?', 'A tenth of all he received', 'One lamb from every flock', 'Half of everything he owned', 'The land where he lay down')
    ]),

    'Genesis-29': pack([
      m('At the well', 'Match each detail.', [
        ['Rachel came with', 'Her father’s sheep'],
        ['Jacob rolled away', 'The stone from the well'],
        ['Jacob met', 'His uncle Laban'],
        ['Years served for Rachel', 'Seven']]),
      m('Leah’s sons', 'Match each son to the right detail.', [
        ['Reuben', 'Firstborn of Jacob'],
        ['Simeon', 'Second son'],
        ['Levi', 'Third son'],
        ['Judah', 'Fourth son']])
    ], [
      q('Which daughter of Laban did Jacob love?', 'Rachel', 'Leah', 'Dinah', 'Rebekah'),
      q('How did the seven years seem to Jacob?', 'Like only a few days because he loved her', 'Like a long and bitter prison sentence', 'Heavy and hard, and he nearly gave up', 'Like a punishment for deceiving his father'),
      q('Whom did Laban give to Jacob first?', 'Leah', 'Rachel', 'Bilhah', 'Zilpah'),
      q('What was Laban’s excuse?', 'The older daughter must marry first', 'Jacob owed him money for the flocks', 'Rachel was too ill to be married', 'It was the order of the local king'),
      q('Who was Leah’s fourth son?', 'Judah', 'Levi', 'Simeon', 'Reuben')
    ]),

    'Genesis-30': pack([
      m('Jacob’s family grows', 'Match each mother to a son.', [
        ['Bilhah', 'Dan'],
        ['Zilpah', 'Gad'],
        ['Leah', 'Issachar'],
        ['Rachel', 'Joseph']]),
      m('Jacob’s flocks', 'Match each detail.', [
        ['Jacob’s wages', 'Speckled and spotted animals'],
        ['Laban said', 'The LORD blessed him for Jacob’s sake'],
        ['Joseph’s name hopes for', 'Another son'],
        ['Leah’s daughter', 'Dinah']])
    ], [
      q('Who was Rachel’s first son?', 'Joseph', 'Benjamin', 'Dan', 'Gad'),
      q('Who was Bilhah’s son?', 'Naphtali', 'Asher', 'Zebulun', 'Issachar'),
      q('What did Laban say about Jacob’s presence?', 'The LORD had blessed him for Jacob’s sake', 'Jacob had become a burden to his house', 'Jacob’s sons had wasted his wealth', 'Jacob had cheated him in every deal'),
      q('What did Jacob ask as his wages?', 'The speckled and spotted animals', 'All of the white sheep in the flock', 'A field and a house near Haran', 'Silver for each year he worked'),
      q('What was the name of Leah’s daughter?', 'Dinah', 'Tamar', 'Rachel', 'Zilpah')
    ]),

    'Genesis-31': pack([
      m('Leaving Laban', 'Match each detail.', [
        ['God told Jacob', 'Return to your homeland'],
        ['Rachel stole', 'Her father’s household idols'],
        ['Laban chased for', 'Seven days'],
        ['God warned Laban', 'In a dream']]),
      m('The covenant', 'Match each detail.', [
        ['Years Jacob had served Laban', 'Twenty'],
        ['The heap of stones', 'Galeed'],
        ['The watchtower', 'Mizpah'],
        ['Laban’s farewell', 'Kissed his family and blessed them']])
    ], [
      q('What did Rachel steal from her father’s house?', 'Household idols', 'Silver and gold coins', 'Her father’s best sheep', 'Her mother’s jewelry'),
      q('How did Rachel hide them?', 'She sat on them in a camel saddle', 'She buried them under an oak tree', 'She gave them to Leah to carry', 'She dropped them down a nearby well'),
      q('How long had Jacob worked for Laban?', 'Twenty years', 'Seven years', 'Fourteen years', 'Forty years'),
      q('How did God warn Laban not to harm Jacob?', 'In a dream', 'Through an angel at the gate', 'Through a prophet', 'Through a storm'),
      q('What marked the covenant between Jacob and Laban?', 'A heap of stones', 'A written scroll', 'An exchange of rings', 'A feast alone')
    ]),

    'Genesis-32': pack([
      m('Before meeting Esau', 'Match each detail.', [
        ['Where Jacob met angels', 'Mahanaim'],
        ['Esau was coming with', '400 men'],
        ['Jacob’s response', 'He prayed and sent gifts ahead'],
        ['The river Jacob crossed', 'The Jabbok']]),
      m('The wrestling', 'Match each detail.', [
        ['Jacob wrestled', 'Until daybreak'],
        ['His demand', '“I will not let you go unless you bless me”'],
        ['His new name', 'Israel'],
        ['Peniel means', '“Face of God”']])
    ], [
      q('How many men were coming with Esau?', '400', '40', '12', '1,000'),
      q('What did Jacob do when he feared Esau?', 'He prayed and sent gifts ahead', 'He fled to Egypt', 'He hid in a cave', 'He built an altar and waited'),
      q('Where did Jacob wrestle with a man?', 'Beside the Jabbok', 'At Bethel', 'At Hebron', 'In the Jordan'),
      q('What did Jacob ask of the man?', 'A blessing', 'A weapon', 'A new home', 'Water'),
      q('What new name did Jacob receive?', 'Israel', 'Peniel', 'Esau', 'Joseph')
    ]),

    'Genesis-33': pack([
      m('The reunion', 'Match each detail.', [
        ['How Jacob approached', 'Bowing seven times'],
        ['How Esau greeted him', 'Ran, embraced and kissed him'],
        ['Esau’s words about gifts', '“I have enough”'],
        ['Jacob’s words to Esau', 'Like seeing the face of God']]),
      m('Settling down', 'Match each detail.', [
        ['Where Jacob built booths', 'Succoth'],
        ['Where he bought land', 'Near Shechem'],
        ['Whom he bought it from', 'The sons of Hamor'],
        ['The altar’s name', 'El-elohe-Israel']])
    ], [
      q('How did Esau greet Jacob?', 'He ran, embraced him and kissed him', 'He drew his sword and stood aside', 'He ignored him and walked away', 'He bowed low and kept his distance'),
      q('How many times did Jacob bow as he approached?', 'Seven', 'Three', 'Twelve', 'Once'),
      q('What did Esau say about Jacob’s gifts?', '“I have enough, my brother.”', '“Take them back.”', '“Send more.”', '“Where did you get these?”'),
      q('Where did Jacob build booths for his livestock?', 'Succoth', 'Bethel', 'Peniel', 'Mizpah'),
      q('Where did Jacob buy a plot of land?', 'Near the city of Shechem', 'Near the city of Hebron', 'Near the well at Beersheba', 'Near the town of Haran')
    ]),

    'Genesis-34': pack([
      m('Shechem', 'Match each detail.', [
        ['Dinah’s father', 'Jacob'],
        ['The city', 'Shechem'],
        ['The condition set by her brothers', 'All the men be circumcised'],
        ['The brothers who acted', 'Simeon and Levi']]),
      m('What it cost', 'Match each detail.', [
        ['Dinah’s mother', 'Leah'],
        ['The prince’s father', 'Hamor the Hivite'],
        ['Jacob’s fear', 'A bad name among the Canaanites'],
        ['The brothers’ defense', '“Should he treat our sister like that?”']])
    ], [
      q('Who was Dinah’s father?', 'Jacob', 'Esau', 'Isaac', 'Laban'),
      q('Which city is at the center of this chapter?', 'Shechem', 'Bethel', 'Hebron', 'Sodom'),
      q('What condition did Jacob’s sons set for the men of the city?', 'That every male be circumcised', 'That they pay silver', 'That they leave the land', 'That they serve Jacob'),
      q('Which two brothers took violent revenge?', 'Simeon and Levi', 'Reuben and Judah', 'Dan and Gad', 'Joseph and Benjamin'),
      q('What did Jacob fear would happen?', 'The people of the land would turn on his family', 'A famine would come over the whole land', 'Esau would return with four hundred men', 'Laban would come back to claim his flocks')
    ]),

    'Genesis-35': pack([
      m('Back to Bethel', 'Match each detail.', [
        ['God told Jacob', 'Go up to Bethel'],
        ['Jacob told his household', 'Put away foreign gods'],
        ['Where the idols were buried', 'Under the oak near Shechem'],
        ['Rebekah’s nurse', 'Deborah']]),
      m('Losses and a new son', 'Match each detail.', [
        ['Rachel died near', 'Ephrath (Bethlehem)'],
        ['Rachel named the baby', 'Ben-oni, “son of my sorrow”'],
        ['Jacob renamed him', 'Benjamin, “son of the right hand”'],
        ['Isaac’s age at death', '180']])
    ], [
      q('Where did God tell Jacob to go and settle?', 'Bethel', 'Egypt', 'Haran', 'Beersheba'),
      q('What did Jacob tell his household to do?', 'Put away their foreign gods', 'Build a tower', 'Offer their firstborn', 'Pack for Egypt'),
      q('Where did Rachel die?', 'Near Ephrath, which is Bethlehem', 'In Haran, in the house of Laban', 'At Bethel, beneath Deborah’s oak', 'In Hebron, beside Sarah’s grave'),
      q('What name did Jacob give Rachel’s newborn son?', 'Benjamin', 'Joseph', 'Reuben', 'Levi'),
      q('How old was Isaac when he died?', '180', '175', '127', '147')
    ]),

    'Genesis-36': pack([
      m('Esau’s family', 'Match each detail.', [
        ['Esau’s other name', 'Edom'],
        ['Where Esau settled', 'Mount Seir'],
        ['Why they separated', 'Too many possessions to share'],
        ['Esau’s descendants', 'The Edomites']]),
      m('Names', 'Match each person to the right detail.', [
        ['Adah', 'Esau’s wife, mother of Eliphaz'],
        ['Eliphaz', 'Esau’s firstborn son'],
        ['Timna', 'Mother of Amalek'],
        ['Seir', 'A Horite whose sons lived in that land']])
    ], [
      q('What is Esau’s other name?', 'Edom', 'Israel', 'Seir', 'Moab'),
      q('Where did Esau settle?', 'The hill country of Seir', 'The land of Egypt near the Nile', 'The city of Haran in Aram', 'The plain of Gerar by the sea'),
      q('Why did Jacob and Esau live in separate lands?', 'Their possessions were too great for one place', 'They quarreled over their father’s blessing', 'God commanded Esau to leave at once', 'A famine forced the family to separate'),
      q('What nation descended from Esau?', 'The Edomites', 'The Moabites', 'The Philistines', 'The Hittites'),
      q('Who was Esau’s firstborn son through Adah?', 'Eliphaz', 'Reuel', 'Jeush', 'Amalek')
    ]),

    'Genesis-37': pack([
      m('Joseph and his brothers', 'Match each detail.', [
        ['Joseph’s age', '17'],
        ['The gift from his father', 'A coat of many colors'],
        ['Dream one', 'Sheaves bowing down'],
        ['Dream two', 'Sun, moon and eleven stars']]),
      m('The plot', 'Match each person to what they did.', [
        ['Reuben', 'Tried to rescue Joseph'],
        ['Judah', 'Suggested selling him'],
        ['The price', 'Twenty pieces of silver'],
        ['The brothers’ lie', 'The coat dipped in goat’s blood']])
    ], [
      q('How old was Joseph at the start of the chapter?', '17', '30', '12', '25'),
      q('What did Jacob make for Joseph?', 'A coat of many colors', 'A staff of almond wood', 'A tent of woven goat hair', 'A ring of gold and silver'),
      q('What did the brothers do with Joseph?', 'Threw him in a pit and then sold him', 'Left him with Reuben and walked away', 'Took him to Shechem and set him free', 'Sent him home with a bag of silver'),
      q('For how much did they sell Joseph?', 'Twenty pieces of silver', 'Thirty pieces of silver', 'One hundred pieces of silver', 'Ten pieces of gold'),
      q('What did the brothers show their father?', 'The coat, dipped in goat’s blood', 'A sandal covered in desert dust', 'A staff stained with animal blood', 'A letter written in Joseph’s hand')
    ]),

    'Genesis-38': pack([
      m('Judah’s family', 'Match each detail.', [
        ['Judah’s eldest son', 'Er'],
        ['His second son', 'Onan'],
        ['His youngest son', 'Shelah'],
        ['The wife of Er and then Onan', 'Tamar']]),
      m('Tamar’s plan', 'Match each detail.', [
        ['What Tamar wore', 'A veil'],
        ['Judah’s pledge', 'Signet, cord and staff'],
        ['Judah’s verdict', '“She is more righteous than I”'],
        ['Tamar’s twins', 'Perez and Zerah']])
    ], [
      q('Who was Tamar?', 'Judah’s daughter-in-law', 'Judah’s younger sister', 'Joseph’s Egyptian wife', 'Leah’s maidservant'),
      q('Which items did Judah leave as a pledge?', 'His signet, cord and staff', 'A gold ring and his best coat', 'A goat, a cup and a bracelet', 'Silver coins and a ring'),
      q('What did Judah say about Tamar after the truth came out?', '“She is more righteous than I.”', '“She deserves to be punished.”', '“She is a stranger to my family.”', '“I never knew who she was.”'),
      q('What were the names of Tamar’s twins?', 'Perez and Zerah', 'Er and Onan', 'Ephraim and Manasseh', 'Jacob and Esau'),
      q('Which twin had a scarlet thread tied on his hand?', 'Zerah', 'Perez', 'Er', 'Shelah')
    ]),

    'Genesis-39': pack([
      m('Joseph in Egypt', 'Match each detail.', [
        ['Joseph’s master', 'Potiphar'],
        ['Potiphar’s job', 'Captain of the guard'],
        ['Why Joseph prospered', 'The LORD was with him'],
        ['Joseph’s role in the house', 'Overseer of everything']]),
      m('Pressure and prison', 'Match each detail.', [
        ['Joseph’s answer', '“How can I sin against God?”'],
        ['What he left behind', 'His garment'],
        ['Where he was sent', 'The king’s prison'],
        ['Who showed him favor there', 'The prison keeper']])
    ], [
      q('Who bought Joseph in Egypt?', 'Potiphar', 'Pharaoh', 'Laban', 'Hamor'),
      q('Why did Joseph succeed in Potiphar’s house?', 'The LORD was with him', 'He was clever with money', 'He was Potiphar’s relative', 'He was strong'),
      q('How did Joseph answer the temptation?', '“How could I sin against God?”', '“I am afraid of my master.”', '“Ask my master what he wants.”', '“Not today, but perhaps later.”'),
      q('What did Joseph leave behind as he fled?', 'His garment', 'His sandals', 'His staff', 'His bread'),
      q('Where did Joseph end up?', 'In prison', 'Back at home', 'In the palace', 'In the desert')
    ]),

    'Genesis-40': pack([
      m('Two prisoners', 'Match each person to the dream.', [
        ['The cupbearer', 'A vine with three branches'],
        ['The baker', 'Three baskets of bread'],
        ['What interpretations belong to', 'God'],
        ['The three branches', 'Three days']]),
      m('What happened', 'Match each detail.', [
        ['The cupbearer', 'Restored to his place'],
        ['The baker', 'Hanged'],
        ['The day of the outcome', 'Pharaoh’s birthday'],
        ['The cupbearer afterward', 'Forgot Joseph']])
    ], [
      q('Who interpreted the dreams of the two officials?', 'Joseph', 'Pharaoh', 'The baker', 'Potiphar'),
      q('What did Joseph say belongs to God?', 'Interpretations', 'Prisons', 'Dreams of kings', 'Bread'),
      q('What did the three branches mean?', 'Three days', 'Three kings', 'Three years', 'Three sons'),
      q('What happened to the baker?', 'He was hanged', 'He was restored', 'He was freed', 'He was sent away'),
      q('What did the cupbearer do after he was restored?', 'He forgot Joseph', 'He spoke up for Joseph', 'He visited Joseph', 'He sent gifts to Joseph')
    ]),

    'Genesis-41': pack([
      m('Pharaoh’s dreams', 'Match each detail.', [
        ['First dream', 'Seven fat and seven thin cows'],
        ['Second dream', 'Seven full and seven thin ears of grain'],
        ['Seven good years', 'Plenty'],
        ['Seven bad years', 'Famine']]),
      m('Joseph rises', 'Match each detail.', [
        ['Joseph’s age', '30'],
        ['His new office', 'Second only to Pharaoh'],
        ['His wife', 'Asenath'],
        ['His sons', 'Manasseh and Ephraim']])
    ], [
      q('Who remembered Joseph and told Pharaoh about him?', 'The cupbearer', 'The baker', 'Potiphar', 'The prison keeper'),
      q('Whom did Joseph credit for the interpretation?', 'God', 'Himself', 'The cupbearer', 'The wise men'),
      q('What did Joseph advise Pharaoh to do?', 'Store grain during the good years', 'Build a wall around the whole land', 'Go to war with the nations nearby', 'Send the people away to Canaan'),
      q('How old was Joseph when he entered Pharaoh’s service?', '30', '17', '40', '50'),
      q('What did Joseph name his firstborn, Manasseh, to remember?', 'God had made him forget his hardship', 'God had given him his father’s house', 'God had spared his wife’s family', 'God had opened the prison doors')
    ]),

    'Genesis-42': pack([
      m('Brothers in Egypt', 'Match each detail.', [
        ['How many brothers went', 'Ten'],
        ['Who stayed home', 'Benjamin'],
        ['What Joseph called them', 'Spies'],
        ['Who was kept as a hostage', 'Simeon']]),
      m('Guilt and fear', 'Match each detail.', [
        ['What Joseph demanded', 'Bring the youngest brother'],
        ['What they found in their sacks', 'Their money'],
        ['What the brothers recalled', 'Their treatment of Joseph'],
        ['Jacob’s response', 'He refused to send Benjamin']])
    ], [
      q('How many of Joseph’s brothers went to buy grain?', 'Ten', 'Eleven', 'Twelve', 'Seven'),
      q('Which brother did Joseph keep in prison?', 'Simeon', 'Reuben', 'Judah', 'Levi'),
      q('What did Joseph require before he would believe them?', 'That they bring their youngest brother', 'That they pay twice the price for grain', 'That they swear an oath to Pharaoh', 'That they bring their father to Egypt'),
      q('What did they find in their sacks on the way home?', 'Their money', 'A cup', 'Extra grain', 'A letter'),
      q('Why did Jacob refuse to send Benjamin?', 'He feared losing Rachel’s other son', 'He was too ill to let anyone travel', 'He did not trust the roads to Egypt', 'He needed him to tend the flocks')
    ]),

    'Genesis-43': pack([
      m('The second trip', 'Match each detail.', [
        ['The one who vouched for Benjamin', 'Judah'],
        ['What they brought', 'Double money and gifts'],
        ['The steward told them', 'Do not fear'],
        ['Who was released', 'Simeon']]),
      m('The meal', 'Match each detail.', [
        ['Joseph ate with them at', 'Noon'],
        ['Joseph’s reaction to Benjamin', 'He wept in private'],
        ['Benjamin’s portion', 'Five times as much'],
        ['How the brothers felt at the end', 'They drank and were merry']])
    ], [
      q('Who promised to be responsible for Benjamin’s safety?', 'Judah', 'Reuben', 'Simeon', 'Levi'),
      q('What did Jacob send as a gift to the man in Egypt?', 'Balm, honey, spices, myrrh, nuts and almonds', 'Sheep, goats, oxen and young donkeys', 'Gold, silver, copper and fine linen', 'Wine, olive oil, wheat and dried figs'),
      q('What did the steward tell the brothers about their money?', 'Their God had given them the treasure', 'It was a mistake that must be repaid', 'It belonged to Pharaoh’s treasury', 'It was payment for the grain they sold'),
      q('How did Joseph react when he saw Benjamin?', 'He went away and wept', 'He laughed', 'He sent him away', 'He gave orders for a feast only'),
      q('How much more food did Benjamin receive than the others?', 'Five times as much', 'Twice as much', 'Three times as much', 'Ten times as much')
    ]),

    'Genesis-44': pack([
      m('The silver cup', 'Match each detail.', [
        ['What Joseph had hidden', 'His silver cup'],
        ['Where it was found', 'Benjamin’s sack'],
        ['The brothers’ reaction', 'They tore their clothes'],
        ['Joseph’s penalty', 'Benjamin would stay as a slave']]),
      m('Judah’s plea', 'Match each detail.', [
        ['Who spoke up', 'Judah'],
        ['What he offered', 'To stay in Benjamin’s place'],
        ['What he feared', 'His father’s grief'],
        ['His promise earlier', 'To be responsible for Benjamin']])
    ], [
      q('What was hidden in Benjamin’s sack?', 'Joseph’s silver cup', 'A gold ring', 'A purse of silver', 'A knife'),
      q('What was the punishment for the one who had the cup?', 'He would become Joseph’s servant', 'He would be put to death at once', 'He would be sent back to Canaan', 'He would pay a fine of silver'),
      q('Who stepped forward to speak for the brothers?', 'Judah', 'Reuben', 'Simeon', 'Benjamin'),
      q('What did Judah offer?', 'To stay as a slave in Benjamin’s place', 'To pay twice the value of the cup', 'To bring their father to Egypt at once', 'To leave Benjamin and return home'),
      q('Why could Judah not return home without Benjamin?', 'His father would die of sorrow', 'He had sworn to Joseph', 'He was afraid of Pharaoh', 'He needed the money')
    ]),

    'Genesis-45': pack([
      m('Joseph reveals himself', 'Match each detail.', [
        ['Joseph’s words', '“I am Joseph”'],
        ['His first question', 'Does my father still live?'],
        ['Why God sent Joseph ahead', 'To preserve life'],
        ['Years of famine left', 'Five']]),
      m('Bringing Jacob', 'Match each detail.', [
        ['Where the family would live', 'Goshen'],
        ['What Pharaoh sent', 'Wagons'],
        ['Benjamin’s gift', 'Three hundred pieces of silver'],
        ['Jacob’s response', 'His spirit revived']])
    ], [
      q('What did Joseph say when he revealed himself?', '“I am Joseph. Is my father still alive?”', '“Do not be afraid of Pharaoh’s anger.”', '“Bring me your sacks and your silver.”', '“Leave this land and never return.”'),
      q('Who did Joseph say had sent him ahead to Egypt?', 'God', 'Pharaoh', 'The brothers', 'Potiphar'),
      q('How many years of famine remained?', 'Five', 'Seven', 'Two', 'Ten'),
      q('Where did Joseph say the family should live?', 'Goshen', 'Rameses', 'Memphis', 'Canaan'),
      q('How did Jacob react to the news that Joseph was alive?', 'His heart went numb, then his spirit revived', 'He did not believe it and turned away', 'He wept in anger at his sons’ deceit', 'He refused to go and stayed in Canaan')
    ]),

    'Genesis-46': pack([
      m('The move to Egypt', 'Match each detail.', [
        ['Where Jacob offered sacrifices', 'Beersheba'],
        ['God’s promise', 'A great nation in Egypt'],
        ['Number in Jacob’s family', 'Seventy'],
        ['Who was sent ahead to Goshen', 'Judah']]),
      m('The reunion', 'Match each detail.', [
        ['Joseph’s greeting', 'Wept on his father’s neck'],
        ['Jacob’s words', '“Now I can die, since I have seen your face”'],
        ['The family’s work', 'Shepherds'],
        ['How Egyptians saw shepherds', 'As detestable']])
    ], [
      q('What did God tell Jacob about going down to Egypt?', 'Do not be afraid; I will make you a great nation there', 'Do not go, because Egypt will enslave your children', 'Return within one year to the land of Canaan', 'Go, but stay only until the famine has ended'),
      q('About how many people in Jacob’s family went to Egypt?', 'Seventy', 'Twelve', 'One hundred and twenty', 'Three hundred'),
      q('Who was sent ahead to Goshen?', 'Judah', 'Reuben', 'Benjamin', 'Levi'),
      q('How did Joseph greet his father?', 'He embraced him and wept for a long time', 'He bowed and stood silently before him', 'He gave him silver and fine garments', 'He sent a servant to welcome him home'),
      q('What did Joseph tell his family to say about their work?', 'That they were shepherds', 'That they were farmers', 'That they were soldiers', 'That they were traders')
    ]),

    'Genesis-47': pack([
      m('Before Pharaoh', 'Match each detail.', [
        ['Jacob’s age before Pharaoh', '130'],
        ['What he called his life', 'Few and hard'],
        ['What Jacob did for Pharaoh', 'Blessed him'],
        ['Land given to the family', 'Goshen']]),
      m('Famine and farewell', 'Match each detail.', [
        ['Pharaoh’s share of the crops', 'One fifth'],
        ['Jacob’s total years', '147'],
        ['Where he asked to be buried', 'With his fathers'],
        ['How he asked Joseph to promise', 'By an oath']])
    ], [
      q('How old was Jacob when he stood before Pharaoh?', '130', '147', '100', '180'),
      q('What did Jacob do when he met Pharaoh?', 'He blessed him', 'He bowed and left', 'He asked for silver', 'He argued with him'),
      q('What fraction of the harvest was to go to Pharaoh?', 'One fifth', 'One half', 'One tenth', 'One third'),
      q('How old was Jacob when he died?', '147', '130', '175', '110'),
      q('Where did Jacob ask to be buried?', 'With his fathers in Canaan', 'In a tomb made in Egypt', 'In the land of Goshen', 'At Bethel beneath the oak')
    ]),

    'Genesis-48': pack([
      m('Joseph’s sons', 'Match each detail.', [
        ['Joseph’s two sons', 'Manasseh and Ephraim'],
        ['Jacob’s eyes', 'Dim with age'],
        ['Jacob counted them as', 'His own sons'],
        ['Jacob said they would be his, like', 'Reuben and Simeon']]),
      m('The blessing', 'Match each detail.', [
        ['Jacob’s right hand on', 'Ephraim, the younger'],
        ['Jacob’s left hand on', 'Manasseh, the older'],
        ['Joseph’s reaction', 'He tried to move the hands'],
        ['How Jacob described God', 'The God who shepherded him']])
    ], [
      q('Which grandson did Jacob place his right hand on?', 'Ephraim', 'Manasseh', 'Benjamin', 'Reuben'),
      q('Which of the two was older?', 'Manasseh', 'Ephraim', 'They were twins', 'Neither is named'),
      q('What did Jacob say about Joseph’s two sons?', 'They would be counted as his own', 'They would live in Egypt only', 'They would serve Pharaoh', 'They would lead Judah'),
      q('How was Jacob’s eyesight?', 'Dim with age', 'Perfect', 'Gone', 'Fading only in one eye'),
      q('How did Jacob describe God?', 'The God who had been his shepherd all his life', 'The God of battles who gave him victory', 'The God of kings who set Pharaoh up', 'The God of Egypt who fed his family')
    ]),

    'Genesis-49': pack([
      m('Blessings for the sons', 'Match each son to the picture used.', [
        ['Judah', 'A lion’s cub'],
        ['Reuben', 'Unstable as water'],
        ['Issachar', 'A strong donkey'],
        ['Benjamin', 'A ravenous wolf']]),
      m('More pictures', 'Match each son to the picture used.', [
        ['Zebulun', 'A harbor for ships'],
        ['Naphtali', 'A doe let loose'],
        ['Joseph', 'A fruitful vine by a spring'],
        ['Dan', 'One who will judge his people']])
    ], [
      q('Which son was told, “The scepter shall not depart from you”?', 'Judah', 'Reuben', 'Joseph', 'Levi'),
      q('How did Jacob describe Reuben?', 'Unstable as water', 'A lion', 'A strong donkey', 'A wolf'),
      q('Which son was compared to a ravenous wolf?', 'Benjamin', 'Dan', 'Gad', 'Issachar'),
      q('Which son would live by the seashore and be a harbor for ships?', 'Zebulun', 'Asher', 'Naphtali', 'Gad'),
      q('Where did Jacob ask to be buried?', 'In the cave of Machpelah', 'In the land of Egypt', 'At Bethel under the oak', 'At Shechem by the well')
    ]),

    'Genesis-50': pack([
      m('Jacob’s funeral', 'Match each detail.', [
        ['Embalming', 'Forty days'],
        ['Egypt mourned', 'Seventy days'],
        ['Where Jacob was buried', 'The cave of Machpelah'],
        ['Who went along', 'Pharaoh’s officials and a great company']]),
      m('Joseph’s last words', 'Match each detail.', [
        ['Joseph’s age at death', '110'],
        ['“You meant evil…”', '“God meant it for good”'],
        ['His request', 'Carry my bones to Canaan'],
        ['His body was placed', 'In a coffin in Egypt']])
    ], [
      q('How long did Egypt mourn Jacob?', 'Seventy days', 'Forty days', 'Seven days', 'Thirty days'),
      q('Where was Jacob buried?', 'In the cave of Machpelah', 'In the land of Goshen', 'At Bethel under the oak', 'In Egypt beside the river'),
      q('What did Joseph say to his worried brothers?', '“You meant evil, but God meant it for good.”', '“You must leave Egypt and never return.”', '“You will be punished for what you did.”', '“I will forget what happened long ago.”'),
      q('How old was Joseph when he died?', '110', '147', '130', '100'),
      q('What did Joseph ask his family to do?', 'Carry his bones up out of Egypt', 'Build him a tomb in Egypt', 'Remember his dreams', 'Name a city for him')
    ])

  });
})();
