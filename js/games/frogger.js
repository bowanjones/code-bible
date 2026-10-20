// frogger.js — STUB. See _stub-template.js for how to fill this in for real.
// Wired to story-data.js beat 'jordan-crossing' (Walls of Jericho arc), so
// this card stays locked ("Continue reading to unlock") until Joshua 3 is read.

GameRegistry.register({
  id: 'frogger',
  title: 'Jordan Crossing',
  sub: 'Cross the Jordan safely',
  stub: true,
  mount(container) {
    return ArcadeUtil.stubScreen(container, {
      icon: '🌊',
      title: 'Jordan Crossing',
      note: "This game isn't built yet — check back after a future update."
    });
  }
});
