// _stub-template.js — NOT loaded by index.html, just a reference copy.
// Copy this pattern into a real game file (see sudoku.js, crossword.js, etc.
// for filled-in examples) when you're ready to build one for real.
//
// Steps to turn a stub into a real game:
//   1. Open js/games/<yourGame>.js — it already registers itself below.
//   2. Replace the mount() body with your actual game logic. `container` is
//      an empty <div> you fully own; build DOM into it (or drop in a canvas —
//      see arcade-engine.js's ArcadeUtil.makeCanvas/loop/bindPointer/bindKeys
//      helpers for canvas-based games) and return { unmount() {...} } to stop
//      any timers/loops/listeners when the player backs out.
//   3. Delete the `stub: true` line. That's the ONLY thing that controls
//      whether the Library shows "In the works" vs the real description —
//      story-based locking ("Continue reading to unlock") is separate and
//      keeps working automatically either way, driven by story-data.js.
//   4. If this game should only unlock once the reader reaches a certain
//      point, make sure some beat in story-data.js has a matching
//      `gameId: '<yourGame>'` — that's the only wiring StoryEngine needs.
//      No matching beat = always unlocked, free-play from the Library.
//
// GameRegistry.register({
//   id: 'yourGame',            // must match the data-game on its card in index.html
//   title: 'Your Game Title',  // shown in the arcade view header
//   sub: 'One-line description',
//   stub: true,                // remove this line once it's real
//   mount(container) {
//     return ArcadeUtil.stubScreen(container, {
//       icon: '🎮',
//       title: 'Your Game Title',
//       note: "This game isn't built yet — check back after a future update."
//     });
//   }
// });
