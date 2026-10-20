// galaga.js — STUB. See _stub-template.js for how to fill this in for real.
// Not tied to a story beat yet — free-play from the Library. Ephesians 6
// (the armor of God) would be a natural reading beat to gate this behind,
// if/when that arc gets added to story-data.js.

GameRegistry.register({
  id: 'galaga',
  title: 'Armor of God',
  sub: 'Suit up in the full armor',
  stub: true,
  mount(container) {
    return ArcadeUtil.stubScreen(container, {
      icon: '🛡️',
      title: 'Armor of God',
      note: "This game isn't built yet — check back after a future update."
    });
  }
});
