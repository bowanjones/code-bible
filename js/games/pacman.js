// pacman.js — STUB. See _stub-template.js for how to fill this in for real.
// Wired to story-data.js beats 'manna-maze-1' (Wilderness arc) and
// 'manna-maze-jericho' (Jericho arc, level 2), so this card stays locked
// ("Continue reading to unlock") until Exodus 16 is read.

GameRegistry.register({
  id: 'pacman',
  title: 'Manna Maze',
  sub: 'Gather manna in the wilderness',
  stub: true,
  mount(container) {
    return ArcadeUtil.stubScreen(container, {
      icon: '🍞',
      title: 'Manna Maze',
      note: "This game isn't built yet — check back after a future update."
    });
  }
});
