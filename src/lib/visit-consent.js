const newKey = () => crypto.randomUUID().replace(/-/g, '');
const CHOICE = 'bento.cat/visit-consent.v1';
const VISIT_KEY = 'bento.cat/statistics-key.v1';
const CHOICE_TTL = 180 * 24 * 60 * 60 * 1000;
const listeners = new Set();

const storage = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch { /* Memory works when storage is blocked. */ } },
  remove(key) { try { localStorage.removeItem(key); } catch { /* Best effort. */ } },
};

// Optional statistics have their own key, separate from requested interactions.
export const VisitConsent = {
  choice: null,
  key: '',
  expiresAt: 0,
  editing: false,
  load() {
    let saved;
    try { saved = JSON.parse(storage.get(CHOICE)); } catch { /* An invalid choice is not consent. */ }
    const valid = saved && typeof saved.allowed === 'boolean' && Number.isFinite(saved.expiresAt) && saved.expiresAt > Date.now();
    this.choice = valid ? saved.allowed : null;
    this.expiresAt = valid ? saved.expiresAt : 0;
    this.key = '';
    if (this.choice === true) {
      const key = storage.get(VISIT_KEY);
      this.key = /^[a-f0-9]{32}$/.test(key || '') ? key : newKey();
      storage.set(VISIT_KEY, this.key);
    } else {
      storage.remove(VISIT_KEY);
      if (!valid) storage.remove(CHOICE);
    }
    this.notify();
  },
  choose(allowed) {
    const previousKey = this.key;
    this.editing = false;
    this.choice = !!allowed;
    this.expiresAt = Date.now() + CHOICE_TTL;
    this.key = allowed ? this.key || newKey() : '';
    storage.set(CHOICE, JSON.stringify({ allowed: this.choice, expiresAt: this.expiresAt }));
    if (allowed) storage.set(VISIT_KEY, this.key);
    else storage.remove(VISIT_KEY);
    this.notify();
    return !allowed ? previousKey : '';
  },
  // Reopens the choice from a footer or menu link.
  edit() { this.editing = true; this.notify(); },
  checkExpiry() {
    if (this.choice !== null && this.expiresAt <= Date.now()) {
      this.choice = null;
      this.key = '';
      storage.remove(CHOICE);
      storage.remove(VISIT_KEY);
      this.notify();
    }
  },
  subscribe(fn) { listeners.add(fn); fn(this); return () => listeners.delete(fn); },
  notify() { for (const fn of listeners) fn(this); },
};
