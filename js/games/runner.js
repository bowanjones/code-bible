// runner.js — STUB. See _stub-template.js for how to fill this in for real.
// Wired to story-data.js beats 'ex-escape-1/2/3' (The Exodus arc, 3 levels),
// so this card stays locked ("Continue reading to unlock") until Exodus 12
// is read. `opts.level` (1–3) is passed in from whichever beat opened it.

GameRegistry.register({
  id: 'runner',
  title: 'Exodus Escape',
  sub: "Outrun Pharaoh's chariots",
  stub: true,
  mount(container) {
    return ArcadeUtil.stubScreen(container, {
      icon: '🏃',
      title: 'Exodus Escape',
      note: "This game isn't built yet — check back after a future update."
    });
  }
});
