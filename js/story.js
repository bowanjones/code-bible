// story.js
// Rendering for view-story (home tab) and view-arc (one arc's beat list).
// Reads progress via StoryEngine, navigates using helpers exposed by app.js
// (goToChapterTab, openArcadeGame) and mutates progress via Storage.

function beatActionLabel(beat) {
  if (beat.type === 'read') return 'Read now';
  if (beat.type === 'summary') return 'View summary';
  if (beat.gameId === 'matching' || beat.gameId === 'quiz') return 'Play now';
  return 'Play now';
}

function runBeatAction(beat) {
  if (beat.type === 'read') {
    const [book, chapter] = beat.chapters[0];
    openStoryRead(book, chapter, beat);
    return;
  }
  if (beat.type === 'summary') {
    openStoryRead(null, null, beat);
    return;
  }
  if (beat.gameId === 'matching' || beat.gameId === 'quiz') {
    const [book, chapter] = beat.chapters[0];
    goToChapterTab(book, chapter, 'game', beat);
    return;
  }
  openArcadeGame(beat.gameId, { returnTab: 'story', beat });
}

// Finds { arc, arcIndex, beat, beatIndex } for a given beat id, searching every arc.
function findBeatLocation(beatId) {
  for (let ai = 0; ai < STORY_ARCS.length; ai++) {
    const arc = STORY_ARCS[ai];
    for (let bi = 0; bi < arc.beats.length; bi++) {
      if (arc.beats[bi].id === beatId) return { arc, arcIndex: ai, beat: arc.beats[bi], beatIndex: bi };
    }
  }
  return null;
}

// The beat that comes immediately after the given one, walking into the next
// arc if this beat was the last in its own arc. Used by the Story reading
// screen's "review" flow: when you've gone back to revisit a chapter, "Next"
// should walk forward from THAT chapter, not jump to wherever you actually
// left off (that's what the separate "Catch up" button is for).
function beatImmediatelyAfter(beatId) {
  const loc = findBeatLocation(beatId);
  if (!loc) return null;
  if (loc.beatIndex + 1 < loc.arc.beats.length) {
    return { arc: loc.arc, beat: loc.arc.beats[loc.beatIndex + 1] };
  }
  if (loc.arcIndex + 1 < STORY_ARCS.length) {
    const nextArc = STORY_ARCS[loc.arcIndex + 1];
    if (nextArc.beats.length) return { arc: nextArc, beat: nextArc.beats[0] };
  }
  return null;
}

function renderStoryHome() {
  const doneCount = Object.keys(Storage.state.progress).filter(k => Storage.state.progress[k]).length;
  document.getElementById('storyStatDone').textContent = `${doneCount} / ${TOTAL_CHAPTERS}`;
  document.getElementById('storyStatStreak').textContent = Storage.state.streak;

  const upNext = document.getElementById('storyUpNext');
  const next = StoryEngine.nextUp();
  if (!next) {
    upNext.innerHTML = `<div class="up-next-card"><p class="section-heading" style="margin-top:0;">Campaign complete!</p><p class="hint">You've finished every beat currently in the story. More arcs are on the way — meanwhile, explore free play in the Library.</p></div>`;
  } else {
    upNext.innerHTML = `
      <div class="up-next-card">
        <p class="eyebrow" style="margin:0 0 4px;">Up next &middot; ${next.arc.title}</p>
        <p class="up-next-label">${next.beat.label}</p>
        <button class="primary-btn" id="storyContinueBtn">${beatActionLabel(next.beat)} &rarr;</button>
      </div>`;
    document.getElementById('storyContinueBtn').onclick = () => runBeatAction(next.beat);
  }

  const list = document.getElementById('storyArcList');
  list.innerHTML = '';
  STORY_ARCS.forEach((arc, ai) => {
    const unlocked = StoryEngine.isArcUnlocked(ai);
    const p = StoryEngine.arcProgress(arc);
    const complete = p.done === p.total;
    const row = document.createElement('div');
    row.className = 'row arc-row' + (unlocked ? '' : ' locked');
    row.onclick = () => { if (unlocked) openArc(ai); };
    row.innerHTML = `
      <div class="chk${complete ? ' done' : ''}">${complete ? '&#10003;' : unlocked ? '' : '&#128274;'}</div>
      <div style="flex:1;">
        <div class="row-title">${arc.title}</div>
        <div class="row-sub">${arc.range} &middot; ${p.done} / ${p.total} beats</div>
      </div>
      <div class="row-arrow">&rsaquo;</div>`;
    list.appendChild(row);
  });
}

let currentArcIndex = null;

function openArc(ai) {
  currentArcIndex = ai;
  const arc = STORY_ARCS[ai];
  document.getElementById('arcTitle').textContent = arc.title;
  document.getElementById('arcRange').textContent = arc.range;
  renderArcBeats();
  showView('view-arc');
}

function renderArcBeats() {
  const arc = STORY_ARCS[currentArcIndex];
  const list = document.getElementById('arcBeatList');
  list.innerHTML = '';
  arc.beats.forEach((beat, bi) => {
    const unlocked = StoryEngine.isBeatUnlocked(arc, bi);
    const complete = StoryEngine.isBeatComplete(beat);
    const row = document.createElement('div');
    row.className = 'beat-row' + (complete ? ' done' : '') + (unlocked ? '' : ' locked');
    const canAct = unlocked && !complete;
    row.className += unlocked ? ' clickable' : '';
    row.onclick = () => { if (unlocked) runBeatAction(beat); };
    row.innerHTML = `
      <div class="chk${complete ? ' done' : ''}">${complete ? '&#10003;' : unlocked ? (bi + 1) : '&#128274;'}</div>
      <div style="flex:1;">
        <div class="row-title">${beat.label}</div>
      </div>
      ${canAct ? `<button class="secondary-btn beat-action" data-bi="${bi}" style="margin:0; width:auto; padding:8px 12px;">${beatActionLabel(beat)}</button>` : ''}`;
    list.appendChild(row);
  });
  list.querySelectorAll('.beat-action').forEach(btn => {
    btn.onclick = e => {
      e.stopPropagation();
      runBeatAction(arc.beats[parseInt(btn.dataset.bi, 10)]);
    };
  });
}