# Code Bible

A daily Bible reading companion with three modes: **Read** (your own notes/commentary),
**Bible** (links out to the actual scripture text), and **Game** (matching games + quizzes
per chapter, Duolingo-style).

No build step, no dependencies — plain HTML/CSS/JS. Open `index.html` in a browser, or serve
the folder with any static file server.

## Project structure

```
index.html          entry point
css/style.css        all styling
js/data.js            book/chapter list + seed game content
js/storage.js         localStorage persistence layer
js/games.js            matching-game + quiz rendering engine
js/app.js               navigation and view rendering
docs/GAME_PACK_FORMAT.md  spec for the game-pack JSON, plus roadmap notes
```

## Running it locally

Just open `index.html` in a browser. For a closer-to-production feel (some browsers restrict
things like localStorage on `file://` URLs), serve it instead:

```bash
# Python
python -m http.server 8000

# Node
npx serve .
```

Then visit `http://localhost:8000`.

## Current state

- All 66 books / 1,189 chapters are structured and trackable.
- Genesis 1 has a full working game pack (see `js/data.js`) as a reference example.
- New game packs are added chapter by chapter: ask Claude to build one in the format
  described in `docs/GAME_PACK_FORMAT.md`, paste the JSON into the Import box in Game mode.
- Progress, notes, and game packs are stored in `localStorage` — local to one browser/device.

## Roadmap

See the bottom of `docs/GAME_PACK_FORMAT.md`. Short version: move game packs into
committed JSON files instead of paste-to-import, pull real scripture text via API for
in-app reading and mid-chapter game breaks, and eventually add real cross-device sync.
