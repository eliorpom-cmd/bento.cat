import { Visitor } from './state.js';
import { bindTileEvents, tickClocks } from './tiles.js';
import { $$, Cat, Pop, Tip } from './util.js';

let started = false;

// Page-wide listeners for tiles, tooltips and the watching cat. Runs once in the browser.
export function initEngine() {
  if (started) return;
  started = true;
  Visitor.load();
  bindTileEvents();
  addEventListener('pointermove', e => Cat.track(e.clientX, e.clientY), { passive: true });
  addEventListener('scroll', () => Tip.hide(), { passive: true, capture: true });
  setInterval(tickClocks, 10000);
  Cat.blinkLoop();
}

// Tidy up floating bits when a page goes away.
export function leavePage() {
  Pop.close();
  Tip.hide();
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  $$('#layer > *').forEach(n => n.remove());
}
