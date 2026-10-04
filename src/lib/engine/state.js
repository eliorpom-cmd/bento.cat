/* A temporary interaction key and local state keep purrs and subscriptions
   responsive within this tab. They are never persisted for passive visitors. */
export const Visitor = {
  d: {},
  key: '',
  load() {
    this.d = {};
    this.key = crypto.randomUUID().replace(/-/g, '');
    // Old automatically generated keys are never treated as consent.
    try {
      localStorage.removeItem('bento.cat/visitor-key');
      localStorage.removeItem('bento.cat/visitor.v2');
    } catch { /* Storage may be blocked. */ }
  },
  get(kind, key) { return this.d[kind]?.[key]; },
  set(kind, key, v) {
    (this.d[kind] ||= {})[key] = v;
  },
  // Take on what the server says this visitor already did on a box.
  absorb(box) {
    if (!box?.viewer) return;
    for (const id of box.viewer.purred || []) (this.d.purr ||= {})[box.handle + '/' + id] = true;
    for (const id of box.viewer.subscribed || []) (this.d.sub ||= {})[box.handle + '/' + id] = true;
  },
};
