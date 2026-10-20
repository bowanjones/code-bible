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

## Roadmap ideas
- Move game packs out of localStorage and into `/data/packs/<book>-<chapter>.json` files committed to the repo, so packs are shared across devices instead of stuck on one phone.
- A small build step (or just fetch) to load packs from `/data/packs/` instead of only accepting manual paste.
- Real sync (Supabase/Firebase) so progress and notes follow you across devices.
- Bible text mode: pull chapter text from a public-domain API (e.g. bible-api.com for KJV) and render it in-app instead of linking out, which would also allow mid-chapter game breaks.
- Other translations, audio, etc.
