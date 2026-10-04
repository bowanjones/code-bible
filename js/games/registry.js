// registry.js
// Central place every new game (word puzzle or arcade) registers itself into.
// A "game" is just: { id, title, sub, mount(container) }
//   - id: matches the data-game attribute on its .game-card button in index.html
//   - title/sub: shown in the arcade view header when the game is opened
//   - mount(container): builds the game's DOM/canvas inside `container` and
//     returns { unmount() } to clean up (stop loops, remove listeners) when
//     the player backs out. Returning nothing is fine if there's nothing to clean up.
//
// To add a new game: drop a <script> for it in index.html (before app.js),
// call GameRegistry.register({...}) at the top of the file, then add a
// <button class="game-card" data-game="yourId"> to the games grid.

const GameRegistry = (function () {
  const games = {};
  return {
    register(game) {
      if (!game || !game.id) throw new Error('GameRegistry.register requires an id');
      games[game.id] = game;
    },
    get(id) {
      return games[id];
    },
    all() {
      return Object.values(games);
    }
  };
})();
