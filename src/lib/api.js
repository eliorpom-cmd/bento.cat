import { ConvexClient, ConvexHttpClient } from 'convex/browser';
import { anyApi } from 'convex/server';
import { PUBLIC_CONVEX_URL, PUBLIC_CONVEX_SITE_URL, VITE_CLERK_PUBLISHABLE_KEY } from '$app/env/public';
import { uploadError } from '../../convex/mediaPolicy.js';

// Function references by name, e.g. fn('boxes:get') → api.boxes.get.
const fn = name => {
  const [mod, f] = name.split(':');
  return anyApi[mod][f];
};

let client = null;
let clerkPromise = null;

export function convex() {
  client ||= new ConvexClient(PUBLIC_CONVEX_URL);
  return client;
}

// One-off reads that work on the server too (page metadata during SSR).
// Pass a load function's `fetch` so SvelteKit can reuse the response when hydrating.
export function httpQuery(name, args = {}, fetch) {
  return new ConvexHttpClient(PUBLIC_CONVEX_URL, fetch ? { fetch } : undefined).query(fn(name), args);
}

export function clerk() {
  clerkPromise ||= (async () => {
    const { Clerk } = await import('@clerk/clerk-js');
    const c = new Clerk(VITE_CLERK_PUBLISHABLE_KEY);
    await c.load();
    return c;
  })().catch(error => { clerkPromise = null; throw error; });
  return clerkPromise;
}

// Hand Convex a fresh Clerk token whenever it asks; resolves once auth has settled.
let authReady = null;
export function initAuth(onChange) {
  if (authReady) return authReady;
  authReady = (async () => {
    const c = await clerk();
    let resolve;
    const settled = new Promise(r => (resolve = r));
    const apply = () =>
      convex().setAuth(
        async ({ forceRefreshToken } = {}) => {
          if (!c.session) return null;
          try { return (await c.session.getToken({ template: 'convex', skipCache: forceRefreshToken })) ?? null; } catch { return null; }
        },
        isAuthed => { onChange?.(isAuthed); resolve(); },
      );
    apply();
    let last = c.session?.id ?? null;
    c.addListener(({ session }) => {
      const id = session?.id ?? null;
      if (id === last) return;
      last = id;
      apply();
    });
    await Promise.race([settled, new Promise(r => setTimeout(r, 4000))]);
    return c;
  })().catch(error => { authReady = null; throw error; });
  return authReady;
}

export const query = (name, args = {}) => convex().query(fn(name), args);
export const mutation = (name, args = {}) => convex().mutation(fn(name), args);
export const action = (name, args = {}) => convex().action(fn(name), args);
// Live query: calls back on every change, returns an unsubscribe function.
export const watch = (name, args, cb, onError) => convex().onUpdate(fn(name), args, cb, onError);

// The message to show a person when a mutation refuses.
export const reason = err => (typeof err?.data === 'string' ? err.data : err?.data?.message) || String(err?.message || err).replace(/^.*Uncaught ConvexError: /s, '').split('\n')[0];

// Shrink photos before they leave the browser, then store them in Convex.
async function shrink(file, max = 1600) {
  if (!file.type.startsWith('image/') || file.type === 'image/gif' || await animated(file)) return { blob: file, ar: null };
  const bmp = await createImageBitmap(file).catch(() => null);
  if (!bmp) return { blob: file, ar: null };
  const ar = bmp.width / bmp.height;
  const s = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * s);
  canvas.height = Math.round(bmp.height * s);
  canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.86));
  return { blob: blob || file, ar };
}

// A canvas keeps only the first frame, so animated WebP and PNG go up untouched.
async function animated(file) {
  if (file.type !== 'image/webp' && file.type !== 'image/png') return false;
  const b = new Uint8Array(await file.slice(0, 64 * 1024).arrayBuffer());
  const tag = i => String.fromCharCode(b[i], b[i + 1], b[i + 2], b[i + 3]);
  if (file.type === 'image/webp') return tag(12) === 'VP8X' && (b[20] & 2) !== 0;
  // APNG announces itself with an acTL chunk somewhere before the first IDAT.
  for (let i = 8; i + 8 <= b.length;) {
    const type = tag(i + 4);
    if (type === 'acTL') return true;
    if (type === 'IDAT') return false;
    i += 12 + ((b[i] << 24 | b[i + 1] << 16 | b[i + 2] << 8 | b[i + 3]) >>> 0);
  }
  return false;
}

// A still from the start of a clip, for the places that only show images.
export function posterOf(file) {
  return new Promise((resolve, reject) => {
    const v = document.createElement('video');
    const url = URL.createObjectURL(file);
    const done = (fn, x) => { URL.revokeObjectURL(url); fn(x); };
    v.muted = true;
    v.playsInline = true;
    v.preload = 'auto';
    v.onloadeddata = () => { v.currentTime = Math.min(0.1, (v.duration || 1) / 2); };
    v.onseeked = () => {
      const c = document.createElement('canvas');
      c.width = v.videoWidth;
      c.height = v.videoHeight;
      c.getContext('2d').drawImage(v, 0, 0);
      c.toBlob(b => (b ? done(resolve, new File([b], 'poster.jpg', { type: 'image/jpeg' })) : done(reject, new Error('That video wouldn’t upload.'))), 'image/jpeg', 0.86);
    };
    v.onerror = () => done(reject, new Error('That video won’t play here.'));
    v.src = url;
  });
}

export async function upload(file, opts = {}) {
  const { blob, ar } = await shrink(file, opts.max);
  const error = uploadError(blob.size, blob.type || file.type);
  if (error) throw new Error(error);
  const c = await clerk();
  const token = await c.session?.getToken({ template: 'convex' });
  if (!token) throw new Error('Sign in first.');
  const site = PUBLIC_CONVEX_SITE_URL || PUBLIC_CONVEX_URL.replace(/\.convex\.cloud\/?$/, '.convex.site');
  const res = await fetch(`${site.replace(/\/$/, '')}/upload`, {
    method: 'POST', headers: { 'Content-Type': blob.type || file.type, Authorization: `Bearer ${token}` }, body: blob,
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error || 'Upload failed');
  const { src } = result;
  let ratio = ar;
  if (ratio == null && file.type.startsWith('image/')) {
    ratio = await new Promise(r => { const i = new Image(); i.onload = () => r(i.width / i.height); i.onerror = () => r(1); i.src = src; });
  }
  return { src, ar: ratio ?? 1.6 };
}
