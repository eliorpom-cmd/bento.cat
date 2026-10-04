// Visits used to be recorded only after a visitor opted in, under a random key kept in
// local storage. That system is gone: anonymous page views need no choice, and signed-in
// people manage visit sharing in their page settings. Browsers that opted in still hold
// the key, so erase what was recorded under it, then forget the choice and the key.
const CHOICE = 'bento.cat/visit-consent.v1';
const VISIT_KEY = 'bento.cat/statistics-key.v1';

export async function clearOptInLeftovers(forget) {
  let key = null;
  try {
    key = localStorage.getItem(VISIT_KEY);
    if (!key && !localStorage.getItem(CHOICE)) return;
  } catch { return; }
  if (/^[a-f0-9]{32}$/.test(key || '')) {
    // Keep the key until the erase went through, so a failure retries on the next page.
    try { await forget(key); } catch { return; }
  }
  try { localStorage.removeItem(VISIT_KEY); localStorage.removeItem(CHOICE); } catch { /* Best effort. */ }
}
