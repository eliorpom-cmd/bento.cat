/* A temporary interaction key and local state keep purrs and subscriptions
   responsive within this tab. They are never persisted for passive visitors.
   The one exception is the list of tiles this browser purred, written only after
   a successful tap: without it a reload brought the paw back and counted the purr again.
   It holds box handles and tile ids, no identifier, and never leaves the browser. */
const PURRED = 'bento.cat/purred.v1';
const PURRED_MAX = 500;
const PURRED_PREFIX = PURRED + '/';
const storedKey = key => PURRED_PREFIX + encodeURIComponent(key);

function storedPurrs() {
  const entries = new Map();
  // Read the old shared list as well, until the next confirmed purr migrates it.
  try {
    const old = JSON.parse(localStorage.getItem(PURRED) || '[]');
    if (Array.isArray(old)) for (const key of old) if (typeof key === 'string') entries.set(key, 0);
  } catch { /* Ignore a malformed old list. */ }
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(PURRED_PREFIX)) continue;
    try { entries.set(decodeURIComponent(key.slice(PURRED_PREFIX.length)), Number(localStorage.getItem(key)) || 0); }
    catch { /* Ignore a malformed entry. */ }
  }
  return entries;
}

function rememberPurr(key) {
  // Each tile owns its entry: another tab can never overwrite this tab's history.
  localStorage.setItem(storedKey(key), String(Date.now()));
  const entries = storedPurrs();
  for (const [tile, at] of entries) if (localStorage.getItem(storedKey(tile)) === null)
    localStorage.setItem(storedKey(tile), String(at));
  localStorage.removeItem(PURRED);
  const oldest = [...entries].sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]));
  for (const [tile] of oldest.slice(0, Math.max(0, entries.size - PURRED_MAX))) localStorage.removeItem(storedKey(tile));
}

export const Visitor = {
  d: {},
  key: '',
  load() {
    this.d = {};
    this.key = crypto.randomUUID().replace(/-/g, '');
    try {
      for (const key of storedPurrs().keys()) (this.d.purr ||= {})[key] = true;
    } catch { /* Storage may be blocked. */ }
    // Old automatically generated keys are never treated as consent.
    try {
      localStorage.removeItem('bento.cat/visitor-key');
      localStorage.removeItem('bento.cat/visitor.v2');
    } catch { /* Storage may be blocked. */ }
  },
  get(kind, key) {
    if (this.d[kind]?.[key]) return this.d[kind][key];
    // Notice confirmed purrs from another tab without waiting for a reload.
    try { if (kind === 'purr' && localStorage.getItem(storedKey(key)) !== null) return (this.d.purr ||= {})[key] = true; }
    catch { /* Storage may be blocked. */ }
    return this.d[kind]?.[key];
  },
  set(kind, key, v, { persist = true } = {}) {
    if (v) (this.d[kind] ||= {})[key] = v;
    else delete this.d[kind]?.[key];
    if (kind !== 'purr' || !v || !persist) return;
    try { rememberPurr(key); } catch { /* Storage may be blocked. */ }
  },
  // Take on what the server says this visitor already did on a box.
  absorb(box) {
    if (!box?.viewer) return;
    for (const id of box.viewer.purred || []) (this.d.purr ||= {})[box.handle + '/' + id] = true;
    for (const id of box.viewer.subscribed || []) (this.d.sub ||= {})[box.handle + '/' + id] = true;
  },
};
