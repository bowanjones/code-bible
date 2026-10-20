// slingshot.js — STUB. See _stub-template.js for how to fill this in for real.
// Wired to story-data.js beat 'slingshot-1' (David & Goliath arc), so this
// card stays locked ("Continue reading to unlock") until 1 Samuel 17 is read.

GameRegistry.register({
  id: 'slingshot',
  title: "David's Slingshot",
  sub: 'Aim for Goliath',
  stub: true,
  mount(container) {
    return ArcadeUtil.stubScreen(container, {
      icon: '🪨',
      title: "David's Slingshot",
      note: "This game isn't built yet — check back after a future update."
    });
  }
});
