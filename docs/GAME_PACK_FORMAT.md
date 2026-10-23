# Game pack format

A "game pack" is the JSON blob that powers Game mode for one chapter.
It's the format Claude will hand you after you've worked through a chapter together,
which you paste into the app's Import box.

```json
{
  "sections": [
    {
      "heading": "Short label for this part of the chapter",
      "matching": {
        "prompt": "Instruction shown above the game",
        "pairs": [
          ["Left item", "Right item that matches it"],
          ["Left item 2", "Right item 2"]
        ]
      }
    }
  ],
  "quiz": [
    {
      "q": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": 0
    }
  ]
}
```

Notes:
- `sections` can have as many matching games as makes sense for the chapter (short chapters might only need one).
- `answer` is the zero-based index into `options`.
- Aim for 5 quiz questions per chapter to match the app's "quick quiz" framing, but this isn't enforced.
- Keep matching pairs short — the UI is a two-column tap layout, not built for long sentences.

## Built-in packs
Packs that ship with the app live in `js/packs/<book>.js` (today: `genesis.js`, chapters 2-50;
Genesis 1 is the starter pack in `data.js`). They are looked up with `Storage.getPack(key)`, never
copied into a reader's saved data, so new packs arrive with every deploy and cloud backups stay small.
A pack a reader imports for the same chapter takes priority over the built-in one.

`genesis.js` uses two small helpers so a pack is quick to write:

```js
'Genesis-31': pack([
  m('Leaving Laban', 'Match each detail.', [
    ['Rachel stole', 'Her father’s household idols'],
    ['Laban chased for', 'Seven days']
  ])
], [
  // q(question, CORRECT answer, wrong, wrong, wrong): the correct answer's position is
  // picked from the question text, so answers are spread across A-D automatically.
  q('How long had Jacob worked for Laban?', 'Twenty years', 'Seven years', 'Fourteen years', 'Forty years')
])
```

To add a book: create `js/packs/<book>.js` (copy the top of `genesis.js`), then load it in
`index.html` and `sw.js` right after `js/packs/genesis.js`, and add it to `tests/unit/helpers/load.js`.
`tests/unit/packs.test.js` then checks the shape, spread of answers, and that the right answer
isn't simply the longest option.

Writing good packs: 3-4 pairs per matching game, 5 questions, wrong options as specific and plausible
as the right one (similar length and style), and check names against the chapter's own text.

## Roadmap ideas
- ~~Move game packs into committed files~~ (done for Genesis, see "Built-in packs"). Next: Exodus onward.
- A small build step (or just fetch) to load packs from `/data/packs/` instead of only accepting manual paste.
- Real sync (Supabase/Firebase) so progress and notes follow you across devices.
- Bible text mode: pull chapter text from a public-domain API (e.g. bible-api.com for KJV) and render it in-app instead of linking out, which would also allow mid-chapter game breaks.
- Other translations, audio, etc.
