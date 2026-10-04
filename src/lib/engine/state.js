/* A temporary interaction key and local state keep purrs and subscriptions
   responsive within this tab. They are never persisted for passive visitors.
   The one exception is the list of tiles this browser purred, written only after
   a tap: without it a reload brought the paw back and counted the purr again.
   It holds box handles and tile ids, no identifier, and never leaves the browser. */
const PURRED = 'bento.cat/purred.v1';
const PURRED_MAX = 500;

export const Visitor = {
  d: {},
  key: '',
  load() {
    this.d = {};
    this.key = crypto.randomUUID().replace(/-/g, '');
    try {
      const purred = JSON.parse(localStorage.getItem(PURRED) || '[]');
      if (Array.isArray(purred)) for (const k of purred) if (typeof k === 'string') (this.d.purr ||= {})[k] = true;
    } catch { /* Storage may be blocked. */ }
    // Old automatically generated keys are never treated as consent.
    try {
      localStorage.removeItem('bento.cat/visitor-key');
      localStorage.removeItem('bento.cat/visitor.v2');
    } catch { /* Storage may be blocked. */ }
  },
  get(kind, key) { return this.d[kind]?.[key]; },
  set(kind, key, v) {
    (this.d[kind] ||= {})[key] = v;
    if (kind !== 'purr') return;
    try { localStorage.setItem(PURRED, JSON.stringify(Object.keys(this.d.purr).slice(-PURRED_MAX))); } catch { /* Storage may be blocked. */ }
  },
  // Take on what the server says this visitor already did on a box.
  absorb(box) {
    if (!box?.viewer) return;
    for (const id of box.viewer.purred || []) (this.d.purr ||= {})[box.handle + '/' + id] = true;
    for (const id of box.viewer.subscribed || []) (this.d.sub ||= {})[box.handle + '/' + id] = true;
  },
};
