// An in-memory stand-in for Supabase, so browser tests can exercise sign-in and
// cloud sync with NO network and NO real project. One FakeSupabase instance is a
// whole fake backend; give it to several browser contexts to simulate several
// devices signed in to the same account.
//
// It mimics what matters: per-user rows (like row-level security), the
// "updated_at" stamp the database sets on every write (used for conflict
// detection), unique usernames ignoring capitalisation, and delete-my-account.
//
// Sign-in always "emails" the code 123456.

class FakeSupabase {
  constructor() {
    this.users = {};                         // email -> uid
    this.tables = { user_data: {}, profiles: {} };
    this.emailsSent = [];
    this.offline = false;                    // set true to simulate no connection
    this._tick = 0;
  }

  _stamp() { return `2026-10-19T12:00:${String(++this._tick).padStart(6, '0')}+00:00`; }
  registerUser(email) { return (this.users[email] = this.users[email] || 'uid-' + email.split('@')[0]); }

  // --- helpers for assertions in tests ---
  cloudState(email) { const r = this.tables.user_data[this.users[email]]; return r ? r.state : null; }
  profile(email) { return this.tables.profiles[this.users[email]] || null; }
  hasAccount(email) { return !!this.users[email]; }

  // --- the fake "server" ---
  handle(op) {
    if (this.offline) return { data: null, error: { message: 'TypeError: Failed to fetch' } };
    if (op.kind === 'otp') { this.registerUser(op.email); this.emailsSent.push(op.email); return { error: null }; }
    if (op.kind === 'verify') {
      if (op.token !== '123456') return { error: { message: 'Token has expired or is invalid' } };
      return { error: null, uid: this.users[op.email] };
    }
    const uid = op.uid;
    if (!uid) return { data: null, error: { message: 'not signed in', code: '42501' } };

    if (op.kind === 'rpc' && op.fn === 'delete_my_account') {
      delete this.tables.user_data[uid]; delete this.tables.profiles[uid];
      Object.keys(this.users).forEach(e => { if (this.users[e] === uid) delete this.users[e]; });
      return { data: null, error: null };
    }

    const table = this.tables[op.table], f = op.filters || {};
    if (f.user_id !== undefined && f.user_id !== uid) return { data: [], error: null };   // row-level security
    switch (op.action) {
      case 'select': { const r = table[uid]; return { data: r ? [{ ...r }] : [], error: null }; }
      case 'insert': {
        if (table[uid]) return { data: null, error: { code: '23505', message: 'duplicate key' } };
        const row = { ...op.values }; if (op.table === 'user_data') row.updated_at = this._stamp();
        table[uid] = row; return { data: [{ ...row }], error: null };
      }
      case 'update': {
        const r = table[uid];
        if (!r || (f.updated_at !== undefined && r.updated_at !== f.updated_at)) return { data: [], error: null };
        Object.assign(r, op.values); r.updated_at = this._stamp(); return { data: [{ ...r }], error: null };
      }
      case 'upsert': {
        const name = op.values.username.toLowerCase();
        for (const [u, r] of Object.entries(table)) if (u !== uid && r.username.toLowerCase() === name) return { data: null, error: { code: '23505', message: 'duplicate username' } };
        table[uid] = { ...op.values }; return { data: [{ ...op.values }], error: null };
      }
      case 'delete': delete table[uid]; return { data: [], error: null };
      default: return { data: null, error: { message: 'unsupported operation' } };
    }
  }

  async install(context) {
    await context.exposeFunction('__fakeSupabase', s => JSON.stringify(this.handle(JSON.parse(s))));
    await context.addInitScript(CLIENT_JS);
  }
}

// Runs inside the page: a tiny supabase-js look-alike that forwards to FakeSupabase.
const CLIENT_JS = `(() => {
  const call = op => window.__fakeSupabase(JSON.stringify(op)).then(JSON.parse);
  const KEY = 'fake-supabase-session';
  window.supabase = { createClient() {
    let session = JSON.parse(localStorage.getItem(KEY) || 'null');
    const listeners = [];
    const emit = (e, s) => listeners.forEach(l => l(e, s));
    const uid = () => session && session.user.id;
    const auth = {
      onAuthStateChange(cb) { listeners.push(cb); setTimeout(() => cb('INITIAL_SESSION', session), 0); return { data: { subscription: { unsubscribe() {} } } }; },
      async signInWithOtp({ email, options }) { window.__lastRedirect = options && options.emailRedirectTo; return call({ kind: 'otp', email }); },
      async verifyOtp({ email, token }) {
        const r = await call({ kind: 'verify', email, token }); if (r.error) return r;
        session = { user: { id: r.uid, email } }; localStorage.setItem(KEY, JSON.stringify(session));
        emit('SIGNED_IN', session); return { data: { session }, error: null };
      },
      async signOut() { session = null; localStorage.removeItem(KEY); emit('SIGNED_OUT', null); return { error: null }; }
    };
    class Query {
      constructor(t) { this.op = { kind: 'q', table: t, filters: {}, uid: null }; }
      select() { if (!this.op.action) this.op.action = 'select'; return this; }
      insert(v) { this.op.action = 'insert'; this.op.values = v; return this; }
      update(v) { this.op.action = 'update'; this.op.values = v; return this; }
      upsert(v) { this.op.action = 'upsert'; this.op.values = v; return this; }
      delete() { this.op.action = 'delete'; return this; }
      eq(c, v) { this.op.filters[c] = v; return this; }
      maybeSingle() { this.mode = 'maybe'; return this; }
      single() { this.mode = 'one'; return this; }
      then(resolve, reject) {
        this.op.uid = uid();
        return call(this.op).then(r => {
          if (r.error) return r;
          let d = r.data; if (this.mode === 'maybe') d = (d && d[0]) || null; if (this.mode === 'one') d = d && d[0];
          return { data: d, error: null };
        }).then(resolve, reject);
      }
    }
    return { auth, from: t => new Query(t), rpc: fn => call({ kind: 'rpc', fn, uid: uid() }) };
  } };
})();`;

module.exports = { FakeSupabase };
