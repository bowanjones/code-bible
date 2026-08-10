// data.js
// Static reference data: the 66-book canon with chapter counts,
// plus any pre-built game packs that ship with the app.
// New game packs get added here (or imported at runtime — see storage.js).

const BOOKS = [
  ["Genesis", 50], ["Exodus", 40], ["Leviticus", 27], ["Numbers", 36], ["Deuteronomy", 34],
  ["Joshua", 24], ["Judges", 21], ["Ruth", 4], ["1 Samuel", 31], ["2 Samuel", 24],
  ["1 Kings", 22], ["2 Kings", 25], ["1 Chronicles", 29], ["2 Chronicles", 36], ["Ezra", 10],
  ["Nehemiah", 13], ["Esther", 10], ["Job", 42], ["Psalms", 150], ["Proverbs", 31],
  ["Ecclesiastes", 12], ["Song of Solomon", 8], ["Isaiah", 66], ["Jeremiah", 52], ["Lamentations", 5],
  ["Ezekiel", 48], ["Daniel", 12], ["Hosea", 14], ["Joel", 3], ["Amos", 9],
  ["Obadiah", 1], ["Jonah", 4], ["Micah", 7], ["Nahum", 3], ["Habakkuk", 3],
  ["Zephaniah", 3], ["Haggai", 2], ["Zechariah", 14], ["Malachi", 4],
  ["Matthew", 28], ["Mark", 16], ["Luke", 24], ["John", 21], ["Acts", 28],
  ["Romans", 16], ["1 Corinthians", 16], ["2 Corinthians", 13], ["Galatians", 6], ["Ephesians", 6],
  ["Philippians", 4], ["Colossians", 4], ["1 Thessalonians", 5], ["2 Thessalonians", 3], ["1 Timothy", 6],
  ["2 Timothy", 4], ["Titus", 3], ["Philemon", 1], ["Hebrews", 13], ["James", 5],
  ["1 Peter", 5], ["2 Peter", 3], ["1 John", 5], ["2 John", 1], ["3 John", 1],
  ["Jude", 1], ["Revelation", 22]
];

const TOTAL_CHAPTERS = BOOKS.reduce((sum, b) => sum + b[1], 0);

// Seed game packs. Format documented in docs/GAME_PACK_FORMAT.md
const SEED_GAME = {
  "Genesis-1": {
    sections: [
      {
        heading: "Days 1 through 3: forming",
        matching: {
          prompt: "Match each day to what God formed.",
          pairs: [
            ["Day 1", "Light, separated from darkness"],
            ["Day 2", "Sky, separating the waters"],
            ["Day 3", "Land, seas, and plants"]
          ]
        }
      },
      {
        heading: "Days 4 through 6: filling",
        matching: {
          prompt: "Match each day to what God filled it with.",
          pairs: [
            ["Day 4", "Sun, moon, and stars"],
            ["Day 5", "Sea creatures and birds"],
            ["Day 6", "Land animals and humans"]
          ]
        }
      }
    ],
    quiz: [
      { q: "What Hebrew word is used for God's act of creating, and is only ever used with God as the subject?", options: ["Bara", "Tov", "Ruach", "Shalom"], answer: 0 },
      { q: "On which day were the sun, moon, and stars created?", options: ["Day 1", "Day 3", "Day 4", "Day 6"], answer: 2 },
      { q: "What does it mean that humans are made in God's \"image\"?", options: ["Humans look physically like God", "Humans represent God's rule on earth", "Only kings bear God's image", "It refers only to Adam"], answer: 1 },
      { q: "What is hovering over the waters in verse 2?", options: ["The Spirit of God", "The angels", "Light", "The land"], answer: 0 },
      { q: "How does Genesis 1 describe the completed creation, humanity included?", options: ["Good", "Finished", "Very good", "Perfect"], answer: 2 }
    ]
  }
};
