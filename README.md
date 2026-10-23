# Code Bible

A daily Bible reading companion built around a guided **Story mode** — a campaign that
walks through the Bible's narrative arcs, alternating scripture readings with matching
games, quizzes, word puzzles, and (in progress) arcade-style games themed to each story.
Free-play browsing, notes, and settings live alongside it.

No build step, no dependencies — plain HTML/CSS/JS. Open `index.html` in a browser, or serve
the folder with any static file server.

## Navigation

Five bottom-nav tabs:

- **Bible** (📖) — browse all 66 books/1,189 chapters, read scripture, take notes, and play
  that chapter's matching/quiz game pack. This is also where reading progress is tracked.
- **Library** (📁) — free play: every game and puzzle (chapter games, word/puzzle games,
  arcade games), plus a list of all your saved notes.
- **Story** (⭐, the big center button) — the home screen. Shows the next thing to do in the
  campaign and lets you drill into any unlocked arc to see/play its beats in order.
- **Friends** (👥) — placeholder for now.
- **Settings** (⚙️) — Bible translation and other preferences.

## Project structure

```
index.html                entry point, all 5 tab views + chapter detail view
css/style.css              all styling
js/data.js                  book/chapter list + seed game content
js/storage.js               localStorage persistence layer (progress, notes, game
                              packs, and story-beat completion)
js/games.js                  matching-game + quiz rendering engine (per-chapter games)
js/games/registry.js          GameRegistry — every word/puzzle/arcade game registers here
js/games/arcade-engine.js     shared canvas/input/HUD toolkit for arcade games
js/games/wordgames.js         fill-in-the-blank, word search, unscramble, memory match
js/arcs/genesis-10-50.js       Story arcs for Genesis 10-50 (added to STORY_ARCS)
js/story-data.js               STORY_ARCS (the campaign spine) + StoryEngine (unlock/
                                progress logic)
js/story.js                    rendering for the Story tab and arc-detail view
js/app.js                       top-level tab navigation, chapter detail rendering,
                                  and the bridge that lets a Story beat open a game or
                                  chapter and mark itself complete when you're done
js/packs/genesis.js           built-in game packs for Genesis 2-50 (matching + quiz per chapter)
js/cloud.js                    optional account sign-in + cloud backup/sync (Supabase)
docs/GAME_PACK_FORMAT.md  spec for the per-chapter game-pack JSON, plus roadmap notes
docs/SUPABASE_SETUP.md    one-time database + sign-in setup
docs/TESTING.md           how to run and extend the tests, and how deploys work
supabase/schema.sql       database tables and security rules
tests/unit, tests/e2e     unit tests (Node) and full-app browser tests (Playwright)
scripts/build-site.js     builds the folder that gets published to GitHub Pages
.github/workflows/        deploy.yml (test, then publish) and supabase-keepalive.yml
```

## Extending Story mode

Genesis is complete: 15 arcs covering chapters 1-50 (`js/story-data.js` has the first three,
`js/arcs/genesis-10-50.js` the rest). To add the next book, copy the shape of
`js/arcs/genesis-10-50.js`, load it in `index.html` and `sw.js` right after it, and add it to
`tests/unit/helpers/load.js`; `tests/unit/arcs.test.js` and `tests/e2e/arcs.spec.js` then check it
automatically.

Add or edit arcs/beats in those files. Each arc is a title + chapter range + an
ordered list of beats. A beat is either:

- `{ type: 'read', chapters: [[book, chapter]], label }` — completes automatically the
  moment that chapter is marked read from the Bible tab (or via "Mark read" from Story).
- `{ type: 'game', gameId, label, chapters? }` — completes when the player finishes that
  game and taps "Mark complete & return to Story". `gameId` of `'matching'` or `'quiz'`
  opens that chapter's game pack (needs `chapters` set); any other `gameId` opens the
  matching entry in `GameRegistry`.

Arcs unlock in order; beats within an arc unlock in order. Nothing else needs to change —
the Story tab and arc-detail view read `STORY_ARCS` directly.

## Extending the games

Add a new word/puzzle or arcade game by registering it with `GameRegistry.register({...})`
in a new file under `js/games/`, then add a `<script>` tag for it in `index.html` (before
`app.js`) and a `<button class="game-card" data-game="yourId">` to the Library tab's games
grid. `js/games/arcade-engine.js` (`ArcadeUtil`) has canvas setup, a delta-time game loop,
pointer/keyboard input, a D-pad, and a HUD bar so canvas games don't have to build those
from scratch.

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
- New per-chapter game packs are added chapter by chapter: ask Claude to build one in the
  format described in `docs/GAME_PACK_FORMAT.md`, paste the JSON into the Import box on
  that chapter's Game tab.
- Word/puzzle games (fill-in-the-blank, word search, unscramble, memory match) are fully
  built. Arcade games (David's Slingshot, Flappy Dove, Exodus Escape, Jordan Crossing,
  Manna Maze, Armor of God, Jericho Defense) are stubbed as "coming soon" in the registry
  but not yet implemented.
- Story mode now covers all of Genesis (Creation through Joseph in Egypt, 15 arcs). Next up:
  Exodus onward, using the same arc shape.
- Progress, notes, game packs, and story-beat completion are always saved in
  `localStorage` on the device. Signing in (Settings > Account) also backs them up to a
  private account and keeps your devices in sync.

## Roadmap

See the bottom of `docs/GAME_PACK_FORMAT.md`. Short version: build out the remaining
arcade games, move game packs into committed JSON files instead of paste-to-import, pull
real scripture text via API for in-app reading, and build real Friends features on top of the
new accounts (shared progress, linked friends).

## Tests and deploying

```
npm install                  once, then:   npx playwright install chromium
npm test                     everything (unit + browser tests)
npm run test:unit            fast checks, no browser
npm run test:e2e             the whole app in a real browser
npm run build                builds the publishable site into _site/
```

Pushing to GitHub runs all of this automatically; a push to `main` is published to
GitHub Pages only if every test passes. Details in `docs/TESTING.md`.
