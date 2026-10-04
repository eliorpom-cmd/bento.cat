import { initAuth, mutation, watch } from './api.js';

// Who is signed in, and whether they have a box. Shared by every page.
export const auth = $state({ loaded: false, signedIn: false, me: null });

let started = false;
let waiters = [];

const settled = me => me && (!me.signedIn || me.ready);
const finish = me => {
  auth.loaded = true;
  waiters.forEach(w => w(me));
  waiters = [];
};

export function startAuth() {
  if (started) return;
  started = true;
  const timeout = setTimeout(() => finish(null), 15_000);
  let retrying = false;
  async function store() {
    if (retrying) return;
    retrying = true;
    try {
      for (let n = 0; n < 3; n++) {
        try { await mutation('users:store'); return; }
        catch { if (n < 2) await new Promise(r => setTimeout(r, 500 * (n + 1))); }
      }
      finish(null);
    } finally { retrying = false; }
  }
  initAuth(isAuthed => {
    if (isAuthed) void store();
  }).then(() => {
    watch('users:me', {}, me => {
      auth.me = me;
      auth.signedIn = !!me?.signedIn;
      if (settled(me)) {
        clearTimeout(timeout);
        finish(me);
      } else { auth.loaded = false; void store(); }
    }, () => {
      clearTimeout(timeout);
      finish(null);
    });
  }).catch(() => { clearTimeout(timeout); started = false; finish(null); });
}

// Resolves with the settled `users:me` result.
export function whenAuthed() {
  startAuth();
  if (auth.loaded) return Promise.resolve(settled(auth.me) ? auth.me : null);
  return new Promise(r => waiters.push(r));
}
