// flappy.js — STUB. See _stub-template.js for how to fill this in for real.
// Not tied to a story beat yet — free-play from the Library. Add a
// `gameId: 'flappy'` beat in story-data.js (Noah/flood arc would fit) if you
// want it to unlock at a specific point in the reading instead.

GameRegistry.register({
  id: 'flappy',
  title: 'Flappy Dove',
  sub: 'Guide the dove home',
  stub: true,
  mount(container) {
    return ArcadeUtil.stubScreen(container, {
      icon: '🕊️',
      title: 'Flappy Dove',
      note: "This game isn't built yet — check back after a future update."
    });
  }
});
