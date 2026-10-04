// towerdefense.js — STUB. See _stub-template.js for how to fill this in for real.
// Not tied to a story beat yet — free-play from the Library. The Jericho arc
// (Joshua 3–6) would be a natural fit if you want it to unlock at a specific
// point in the reading instead.

GameRegistry.register({
  id: 'towerdefense',
  title: 'Jericho Defense',
  sub: 'Hold the march around Jericho',
  stub: true,
  mount(container) {
    return ArcadeUtil.stubScreen(container, {
      icon: '🏰',
      title: 'Jericho Defense',
      note: "This game isn't built yet — check back after a future update."
    });
  }
});
