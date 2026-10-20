// cloud.js
// Optional account sign-in + cloud backup, built on Supabase.
//
// The app still works fully offline and without an account: localStorage stays
// the source of truth on every device. When someone signs in, their whole
// Storage.state is mirrored to one row in Supabase (table: user_data) and
// merged back in on other devices.
//
// Safe to expose in the browser: the URL and the *publishable* key below.
// Row-level security (supabase/schema.sql) is what keeps each person's data
// private. NEVER put the secret / service_role key in this file.
//
// This file has two halves:
//   1. Pure helpers (canonical hashing + mergeStates) — unit-tested in Node.
//   2. The Cloud object — only created in a browser.

const CLOUD_URL = 'https://ewyndmpvqqhfnpwkucqf.supabase.co';
const CLOUD_KEY = 'sb_publishable_kUHTAuOP4wW9yVQ3IyMP9w_B5V4nQWA';
const SYNC_META_KEY = 'bible-companion-sync-v1';
const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;

// =====================================================================
// 1. PURE HELPERS
// =====================================================================

// JSON with sorted keys. Postgres' jsonb re-orders object keys, so comparing
// plain JSON.stringify output of "what I sent" vs "what came back" would
// always differ. Canonical form makes the comparison reliable.
function canonicalJSON(value) {
  if (Array.isArray(value)) return '[' + value.map(canonicalJSON).join(',') + ']';
  if (value && typeof value === 'object') {
    return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonicalJSON(value[k])).join(',') + '}';
  }
  return JSON.stringify(value === undefined ? null : value);
}

function stateHash(state) {
  const s = canonicalJSON(state || {});
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return h + ':' + s.length;
}

function mergeText(a, b) {
  a = a || ''; b = b || '';
  if (!a.trim()) return b;
  if (!b.trim()) return a;
  if (a === b || a.includes(b)) return a;
  if (b.includes(a)) return b;
  return a + '\n\n\u2014 merged from another device \u2014\n\n' + b;
}

function newerOf(a, b, field) {
  const ta = (a && (a[field] || a.createdAt)) || 0;
  const tb = (b && (b[field] || b.createdAt)) || 0;
  return tb > ta ? b : a;
}

// Combine two app states without losing anything either side has. Used the
// first time a device connects to an account and whenever two devices edited
// at the same time. Rules:
//   progress / completed story beats ... union
//   notes (per chapter text) ........... keep both if they differ
//   verse notes ......................... union by id, newest edit wins per id
//   devotionals ......................... newest edit wins per story stop
//   high scores ......................... highest wins
//   friends ............................. union by id
//   streak .............................. whichever side read most recently
//   settings ............................ from the side that already chose a version
function mergeStates(local, cloud) {
  local = local || {}; cloud = cloud || {};
  const out = Object.assign({}, cloud, local);

  out.progress = Object.assign({}, cloud.progress, local.progress);

  const lp = local.storyProgress || {}, cp = cloud.storyProgress || {};
  out.storyProgress = Object.assign({}, cp, lp, {
    completedBeats: Object.assign({}, cp.completedBeats, lp.completedBeats)
  });

  out.notes = {};
  new Set([...Object.keys(cloud.notes || {}), ...Object.keys(local.notes || {})]).forEach(k => {
    out.notes[k] = mergeText((local.notes || {})[k], (cloud.notes || {})[k]);
  });

  out.verseNotes = {};
  new Set([...Object.keys(cloud.verseNotes || {}), ...Object.keys(local.verseNotes || {})]).forEach(k => {
    const byId = {};
    ((cloud.verseNotes || {})[k] || []).concat((local.verseNotes || {})[k] || []).forEach(n => {
      byId[n.id] = byId[n.id] ? newerOf(byId[n.id], n, 'updatedAt') : n;
    });
    out.verseNotes[k] = Object.values(byId).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  });

  out.devotionals = {};
  new Set([...Object.keys(cloud.devotionals || {}), ...Object.keys(local.devotionals || {})]).forEach(k => {
    const l = (local.devotionals || {})[k], c = (cloud.devotionals || {})[k];
    out.devotionals[k] = l && c ? newerOf(l, c, 'updatedAt') : (l || c);
  });

  out.gameData = Object.assign({}, cloud.gameData, local.gameData);

  out.highScores = {};
  new Set([...Object.keys(cloud.highScores || {}), ...Object.keys(local.highScores || {})]).forEach(k => {
    out.highScores[k] = Math.max((local.highScores || {})[k] || 0, (cloud.highScores || {})[k] || 0);
  });

  const seen = new Set();
  out.friends = [];
  (local.friends || []).concat(cloud.friends || []).forEach(f => {
    if (f && !seen.has(f.id)) { seen.add(f.id); out.friends.push(f); }
  });

  const when = s => (s ? Date.parse(s) || 0 : 0);
  const lt = when(local.lastReadDate), ct = when(cloud.lastReadDate);
  if (ct > lt) { out.lastReadDate = cloud.lastReadDate; out.streak = cloud.streak || 0; }
  else if (lt > ct) { out.lastReadDate = local.lastReadDate; out.streak = local.streak || 0; }
  else { out.lastReadDate = local.lastReadDate || cloud.lastReadDate || null; out.streak = Math.max(local.streak || 0, cloud.streak || 0); }

  const prefer = (!local.versionChosen && cloud.versionChosen) ? cloud : local;
  ['theme', 'textSize', 'bibleVersion', 'versionChosen'].forEach(k => {
    if (prefer[k] !== undefined) out[k] = prefer[k];
  });

  return out;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { mergeStates, canonicalJSON, stateHash, mergeText };
}

// =====================================================================
// 2. CLOUD (browser only)
// =====================================================================

const Cloud = (typeof window === 'undefined') ? null : {
  client: null,
  session: null,
  profile: null,
  status: 'signed-out',     // signed-out | syncing | synced | offline | error
  statusDetail: '',
  lastSyncedAt: null,
  stage: 'email',           // sign-in form: 'email' | 'code'
  pendingEmail: '',
  message: null,            // { text, kind: 'ok' | 'bad' }
  onStateChanged: null,     // app.js hooks this to refresh the visible screen

  _syncing: false,
  _rerun: false,
  _timer: null,
  _rawSave: null,
  _lastVisibleSync: 0,

  isSignedIn() { return !!this.session; },

  // ---------- setup ----------

  init() {
    if (this.client) return;
    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
      // Offline, or the library didn't load. The app keeps working locally.
      this.renderAccount();
      return;
    }
    this.client = window.supabase.createClient(CLOUD_URL, CLOUD_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'implicit' }
    });

    // Every Storage.save() also schedules a cloud push (debounced).
    this._rawSave = Storage.save.bind(Storage);
    Storage.save = () => { this._rawSave(); this._markDirty(); };

    this.client.auth.onAuthStateChange((event, session) => {
      // Never await Supabase calls inside this callback — hop out first.
      setTimeout(() => this._onAuth(event, session), 0);
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') { this._flushNow(); return; }
      if (this.session && Date.now() - this._lastVisibleSync > 20000) this.sync();
    });
    window.addEventListener('online', () => { if (this.session) this.sync(); });
    this.renderAccount();
  },

  async _onAuth(event, session) {
    if (!session) {
      this.session = null;
      this.profile = null;
      this._setStatus('signed-out');
      return;
    }
    const sameUser = this.session && this.session.user.id === session.user.id;
    this.session = session;
    if (sameUser) return;           // token refresh / tab refocus — nothing to redo

    const meta = this._loadMeta();
    if (meta && meta.userId && meta.userId !== session.user.id) {
      // This device still holds a DIFFERENT account's data. Never mix it into
      // this account: wipe it and start clean from the cloud copy.
      try { localStorage.removeItem(STORE_KEY); } catch (e) { /* ignore */ }
      this._saveMeta(null);
      location.reload();
      return;
    }
    this.stage = 'email';
    this.message = null;
    await this._loadProfile();
    await this.sync();
  },

  // ---------- local sync bookkeeping ----------

  _loadMeta() {
    try { return JSON.parse(localStorage.getItem(SYNC_META_KEY) || 'null'); } catch (e) { return null; }
  },
  _saveMeta(meta) {
    try {
      if (meta) localStorage.setItem(SYNC_META_KEY, JSON.stringify(meta));
      else localStorage.removeItem(SYNC_META_KEY);
    } catch (e) { /* ignore */ }
  },

  _markDirty() {
    if (!this.session) return;
    clearTimeout(this._timer);
    this._timer = setTimeout(() => this._flushNow(), 2500);
  },

  _flushNow() {
    clearTimeout(this._timer);
    if (!this.session) return;
    const meta = this._loadMeta();
    if (meta && meta.userId === this.session.user.id && stateHash(Storage.state) === meta.pushedHash) return;
    this.sync();
  },

  _setStatus(status, detail) {
    this.status = status;
    this.statusDetail = detail || '';
    this.renderAccount();
  },

  // ---------- the sync itself ----------

  // Bring this device and the cloud copy into agreement. Safe to call any time.
  // Uses optimistic concurrency: a push only succeeds if nobody else has
  // written since we last looked; otherwise we re-read, merge, and retry.
  async sync() {
    if (!this.client || !this.session) return false;
    if (this._syncing) { this._rerun = true; return false; }
    this._syncing = true;
    this._lastVisibleSync = Date.now();
    this._setStatus('syncing');
    let ok = false, changedLocal = false;
    try {
      const uid = this.session.user.id;
      let meta = this._loadMeta();
      if (!meta || meta.userId !== uid) meta = { userId: uid, lastSeenCloudAt: null, pushedHash: null };

      for (let attempt = 0; attempt < 4; attempt++) {
        const { data: row, error } = await this.client.from('user_data')
          .select('state, updated_at').eq('user_id', uid).maybeSingle();
        if (error) throw error;

        if (!row) {
          const snap = JSON.parse(JSON.stringify(Storage.state));
          const { data, error: e2 } = await this.client.from('user_data')
            .insert({ user_id: uid, state: snap }).select('updated_at').single();
          if (e2) { if (e2.code === '23505') continue; throw e2; }
          meta.lastSeenCloudAt = data.updated_at;
          meta.pushedHash = stateHash(snap);
          this._saveMeta(meta);
          ok = true; break;
        }

        const cloudChanged = row.updated_at !== meta.lastSeenCloudAt;
        const localDirty = stateHash(Storage.state) !== meta.pushedHash;

        if (cloudChanged) {
          const firstTime = !meta.lastSeenCloudAt;
          // Nothing awaited between reading Storage.state and replacing it,
          // so a keystroke can't be lost in the gap.
          const next = (firstTime || localDirty)
            ? mergeStates(Storage.state, row.state)
            : Object.assign({}, Storage.state, row.state);
          Storage.state = next;
          this._rawSave();
          changedLocal = true;
          meta.lastSeenCloudAt = row.updated_at;
          if (stateHash(next) === stateHash(row.state)) {
            meta.pushedHash = stateHash(next);
            this._saveMeta(meta);
            ok = true; break;
          }
          this._saveMeta(meta);   // merged result differs from cloud -> push it below
        } else if (!localDirty) {
          this._saveMeta(meta);
          ok = true; break;
        }

        const snap = JSON.parse(JSON.stringify(Storage.state));
        const { data: upd, error: e3 } = await this.client.from('user_data')
          .update({ state: snap }).eq('user_id', uid).eq('updated_at', meta.lastSeenCloudAt).select('updated_at');
        if (e3) throw e3;
        if (!upd || !upd.length) continue;      // someone else wrote first: re-read and merge
        meta.lastSeenCloudAt = upd[0].updated_at;
        meta.pushedHash = stateHash(snap);
        this._saveMeta(meta);
        ok = true; break;
      }
      if (!ok) throw new Error('Too many conflicting changes — will retry shortly.');
      this.lastSyncedAt = Date.now();
      this._setStatus('synced');
    } catch (e) {
      const offline = (typeof navigator !== 'undefined' && navigator.onLine === false) || (e && /fetch|network/i.test(String(e.message || e)));
      this._setStatus(offline ? 'offline' : 'error', offline ? '' : (e && e.message) || 'Unknown error');
    } finally {
      this._syncing = false;
      if (changedLocal && typeof this.onStateChanged === 'function') this.onStateChanged();
      if (this._rerun) { this._rerun = false; setTimeout(() => this.sync(), 0); }
    }
    return ok;
  },

  // ---------- profile / username ----------

  async _loadProfile() {
    try {
      const { data } = await this.client.from('profiles')
        .select('username').eq('user_id', this.session.user.id).maybeSingle();
      this.profile = data || null;
    } catch (e) { /* offline: keep whatever we had */ }
  },

  async saveUsername(raw) {
    const name = (raw || '').trim();
    if (!USERNAME_RE.test(name)) throw new Error('Usernames are 3\u201320 characters: letters, numbers, and underscores only.');
    const { error } = await this.client.from('profiles')
      .upsert({ user_id: this.session.user.id, username: name }, { onConflict: 'user_id' });
    if (error) {
      if (error.code === '23505') throw new Error('That username is already taken. Try another.');
      throw error;
    }
    this.profile = { username: name };
  },

  // ---------- sign in / out ----------

  _friendlyAuthError(e) {
    const msg = String((e && e.message) || e || '');
    if (/rate limit|too many|seconds/i.test(msg) || (e && e.status === 429)) {
      return 'Too many sign-in emails were requested. Please wait a minute and try again.';
    }
    if (/not authorized|not allowed/i.test(msg)) {
      return 'This email address can\u2019t receive sign-in emails yet. The site owner needs to finish email setup.';
    }
    if (/expired|invalid/i.test(msg)) return 'That code didn\u2019t work or has expired. Request a new email and try again.';
    if (/fetch|network/i.test(msg)) return 'Couldn\u2019t reach the sign-in service. Check your connection and try again.';
    return msg || 'Something went wrong. Please try again.';
  },

  async sendSignInEmail(email) {
    const { error } = await this.client.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: location.origin + location.pathname, shouldCreateUser: true }
    });
    if (error) throw error;
    this.pendingEmail = email;
    this.stage = 'code';
  },

  async verifyCode(email, token) {
    const { error } = await this.client.auth.verifyOtp({ email, token: token.trim(), type: 'email' });
    if (error) throw error;
  },

  async signOut() {
    if (this.session) {
      const meta = this._loadMeta();
      if (!meta || stateHash(Storage.state) !== meta.pushedHash) await this.sync();
      const after = this._loadMeta();
      if (!after || stateHash(Storage.state) !== after.pushedHash) {
        if (!confirm('Your latest changes couldn\u2019t be saved to your account. Sign out anyway? Those changes will be lost from this device.')) return false;
      }
    }
    try { await this.client.auth.signOut(); } catch (e) { /* ignore */ }
    this._wipeLocalAndReload();
    return true;
  },

  _wipeLocalAndReload() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) { /* ignore */ }
    this._saveMeta(null);
    location.reload();
  },

  // Remove the cloud copy of this account's data (used by "Reset all progress").
  async clearCloudData() {
    if (!this.session) return true;
    const { error } = await this.client.from('user_data').delete().eq('user_id', this.session.user.id);
    if (error) return false;
    this._saveMeta(null);
    return true;
  },

  forgetSyncState() { this._saveMeta(null); },

  async deleteAccount() {
    const { error } = await this.client.rpc('delete_my_account');
    if (error) throw error;
    try { await this.client.auth.signOut({ scope: 'local' }); } catch (e) { /* ignore */ }
    this._wipeLocalAndReload();
  },

  // ---------- Account section in Settings ----------

  _el(tag, props, ...kids) {
    const node = document.createElement(tag);
    Object.entries(props || {}).forEach(([k, v]) => {
      if (k === 'text') node.textContent = v;
      else if (k === 'style') node.style.cssText = v;
      else if (k.startsWith('on')) node[k] = v;
      else node.setAttribute(k, v);
    });
    kids.forEach(kid => { if (kid) node.appendChild(typeof kid === 'string' ? document.createTextNode(kid) : kid); });
    return node;
  },

  _statusLine() {
    if (this.status === 'syncing') return 'Syncing\u2026';
    if (this.status === 'offline') return 'Offline \u2014 your changes are safe on this device and will sync when you\u2019re back online.';
    if (this.status === 'error') return 'Couldn\u2019t sync: ' + (this.statusDetail || 'unknown error');
    if (this.status === 'synced' && this.lastSyncedAt) {
      const mins = Math.floor((Date.now() - this.lastSyncedAt) / 60000);
      return mins < 1 ? 'Synced just now.' : `Synced ${mins} min ago.`;
    }
    return '';
  },

  renderAccount() {
    const body = document.getElementById('accountBody');
    if (!body) return;
    // Don't wipe what someone is typing just because a background sync finished.
    const active = document.activeElement;
    if (active && body.contains(active) && (active.tagName === 'INPUT') && this.session) return;

    const e = this._el.bind(this);
    body.innerHTML = '';

    if (!this.client) {
      body.appendChild(e('p', { class: 'hint', text: 'Account sign-in isn\u2019t available right now (it needs an internet connection to load). Everything you do is still saved on this device.' }));
      return;
    }

    const message = () => this.message
      ? e('p', { class: 'hint', style: `color:${this.message.kind === 'bad' ? 'var(--bad)' : 'var(--good)'};`, text: this.message.text })
      : null;
    const setMsg = (text, kind) => { this.message = text ? { text, kind: kind || 'ok' } : null; this.renderAccount(); };
    const busy = (btn, fn) => async () => {
      btn.disabled = true;
      try { await fn(); } finally { btn.disabled = false; }
    };

    // ---- signed out ----
    if (!this.session) {
      if (this.stage === 'code') {
        const code = e('input', { type: 'text', id: 'authCode', inputmode: 'numeric', autocomplete: 'one-time-code', placeholder: 'Code from the email (if it has one)' });
        const verify = e('button', { class: 'primary-btn', type: 'button', id: 'authVerifyBtn', text: 'Sign in with code' });
        verify.onclick = busy(verify, async () => {
          if (!code.value.trim()) { setMsg('Enter the code from the email, or just tap the link in it.', 'bad'); return; }
          try { await this.verifyCode(this.pendingEmail, code.value); }
          catch (err) { setMsg(this._friendlyAuthError(err), 'bad'); }
        });
        const back = e('button', { class: 'secondary-btn', type: 'button', id: 'authBackBtn', text: 'Use a different email', style: 'width:auto; padding:10px 16px;' });
        back.onclick = () => { this.stage = 'email'; this.message = null; this.renderAccount(); };
        body.append(
          e('p', { class: 'hint', style: 'margin-top:0;' }, 'We emailed a sign-in link to ', e('strong', { text: this.pendingEmail }), '. Open it on this device to sign in. If the email shows a code, you can type it here instead.'),
          code, verify, message(), back
        );
        return;
      }
      const email = e('input', { type: 'email', id: 'authEmail', autocomplete: 'email', placeholder: 'you@example.com', value: this.pendingEmail || '' });
      const send = e('button', { class: 'primary-btn', type: 'button', id: 'authSendBtn', text: 'Email me a sign-in link' });
      send.onclick = busy(send, async () => {
        const val = email.value.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) { setMsg('Enter a valid email address.', 'bad'); return; }
        try { await this.sendSignInEmail(val); this.message = null; this.renderAccount(); }
        catch (err) { setMsg(this._friendlyAuthError(err), 'bad'); }
      });
      body.append(
        e('p', { class: 'hint', style: 'margin-top:0;' }, 'Sign in to back up your progress and notes and keep them in sync across your devices. No password \u2014 we email you a sign-in link. You can skip this and keep using the app on this device.'),
        email, send, message()
      );
      return;
    }

    // ---- signed in ----
    const user = this.session.user;
    const uname = e('input', { type: 'text', id: 'authUsername', maxlength: '20', autocomplete: 'username', placeholder: 'Choose a username', value: (this.profile && this.profile.username) || '' });
    const saveName = e('button', { class: 'secondary-btn', type: 'button', id: 'authSaveUsernameBtn', text: this.profile ? 'Update username' : 'Save username', style: 'width:auto; padding:10px 16px;' });
    saveName.onclick = busy(saveName, async () => {
      try { await this.saveUsername(uname.value); setMsg('Username saved.', 'ok'); }
      catch (err) { setMsg(err.message || 'Couldn\u2019t save that username.', 'bad'); }
    });

    const syncBtn = e('button', { class: 'secondary-btn', type: 'button', id: 'authSyncBtn', text: 'Sync now', style: 'width:auto; padding:10px 16px; margin-right:8px;' });
    syncBtn.onclick = busy(syncBtn, () => this.sync());
    const outBtn = e('button', { class: 'secondary-btn', type: 'button', id: 'authSignOutBtn', text: 'Sign out', style: 'width:auto; padding:10px 16px;' });
    outBtn.onclick = busy(outBtn, async () => {
      if (!confirm('Sign out? Your data stays safe in your account and is removed from this device. Sign back in to restore it.')) return;
      await this.signOut();
    });
    const delBtn = e('button', { class: 'secondary-btn', type: 'button', id: 'authDeleteBtn', text: 'Delete my account and data', style: 'width:auto; padding:10px 16px; color:var(--bad); border-color:var(--bad);' });
    delBtn.onclick = busy(delBtn, async () => {
      if (!confirm('Permanently delete your account and everything saved in it (progress, notes, devotionals, scores)? This can\u2019t be undone.')) return;
      try { await this.deleteAccount(); }
      catch (err) { setMsg('Couldn\u2019t delete the account: ' + (err.message || 'unknown error'), 'bad'); }
    });

    body.append(
      e('div', { class: 'settings-row' }, e('span', { text: 'Signed in as' }), e('strong', { id: 'authEmailShown', text: user.email || '' })),
      e('label', { class: 'field-label', style: 'margin-top:14px;', text: 'Username' }),
      uname, saveName,
      message(),
      e('p', { class: 'hint', id: 'authStatusLine', text: this._statusLine() }),
      syncBtn, outBtn,
      e('p', { class: 'hint', style: 'margin-top:16px;', text: 'Your reading progress, notes, devotional responses, scores, friends list, and settings are saved to your account and are private to you. Nobody else can read them.' }),
      delBtn
    );
  }
};
