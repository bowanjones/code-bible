// sudoku.js — STUB. See _stub-template.js for how to fill this in for real.

GameRegistry.register({
  id: 'sudoku',
  title: 'Sudoku',
  sub: 'Numbers, Bible-themed',
  stub: true,
  mount(container) {
    return ArcadeUtil.stubScreen(container, {
      icon: '🔢',
      title: 'Sudoku',
      note: "This game isn't built yet — check back after a future update."
    });
  }
});
