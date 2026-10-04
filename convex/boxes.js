import { ConvexError, v } from 'convex/values';
import { internal } from './_generated/api';
import { internalMutation, mutation, query } from './_generated/server';
import {
  NEW_SUGGESTIONS, boxByHandle, boxOfUser, cleanProfile, currentUser, handleState, requireOwnBox, requireUser,
} from './lib';
import { syncReferences } from './files';
import { eraseUser } from './accounts';

// Everything a page needs to draw a box, with live counts and what this visitor already did.
async function present(ctx, box, visitorKey) {
  const counters = await ctx.db.query('counters').withIndex('by_box_tile', q => q.eq('boxId', box._id)).collect();
  const counts = Object.fromEntries(counters.map(c => [c.tileId, c.count]));

  const scribbles = {};
  const gbTiles = box.tiles.filter(t => t.type === 'guestbook');
  for (const t of gbTiles) {
    const rows = await ctx.db.query('scribbles').withIndex('by_box_tile', q => q.eq('boxId', box._id).eq('tileId', t.id)).order('desc').take(200);
    scribbles[t.id] = { total: rows.length, recent: rows.slice(0, 12).reverse().map(r => ({ d: r.d, name: r.name })) };
  }

  let purred = [], subscribed = [];
  if (visitorKey) {
    purred = (await ctx.db.query('purrs').withIndex('by_box_visitor', q => q.eq('boxId', box._id).eq('visitorKey', visitorKey)).collect()).map(p => p.tileId);
    subscribed = (await ctx.db.query('subscribers').withIndex('by_box_visitor', q => q.eq('boxId', box._id).eq('visitorKey', visitorKey)).collect()).map(s => s.tileId);
  }

  const user = await currentUser(ctx);
  const tiles = box.tiles.map(t => (t.type === 'purr' ? { ...t, count: counts[t.id] ?? t.count ?? 0 } : t));

  return {
    _id: box._id,
    handle: box.handle,
    demo: !!box.demo,
    name: box.name,
    bio: box.bio,
    avatar: box.avatar ?? null,
    avatarVideo: box.avatarVideo ?? null,
    avatarPos: box.avatarPos ?? '50% 40%',
    avatarShape: box.avatarShape ?? 'circle',
    footer: box.footer ?? null,
    tiles,
    mobile: box.mobile ?? null,
    scribbles,
    viewer: { purred, subscribed },
    isOwner: !!user && box.ownerId === user._id,
    updatedAt: box.updatedAt,
  };
}

export const get = query({
  args: { handle: v.string(), visitorKey: v.optional(v.string()) },
  handler: async (ctx, { handle, visitorKey }) => {
    const box = await boxByHandle(ctx, handle.toLowerCase());
    return box ? await present(ctx, box, visitorKey) : null;
  },
});

// The signed-in person's own box, in the shape the editor works with.
export const mine = query({
  args: {},
  handler: async ctx => {
    const user = await currentUser(ctx);
    if (!user) return null;
    const box = await boxOfUser(ctx, user._id);
    if (!box) return null;
    const view = await present(ctx, box, null);
    return {
      ...view,
      email: user.email ?? null,
      onboarding: !!box.onboarding,
      shared: !!box.shared,
      suggestions: box.suggestions ?? [],
      revision: box.revision ?? 0,
      lastSaveId: box.lastSaveId ?? null,
    };
  },
});

export const handleStatus = query({
  args: { handle: v.string() },
  handler: async (ctx, { handle }) => {
    const h = handle.trim().toLowerCase();
    const state = handleState(h);
    if (state === 'invalid') return { state: 'bad', msg: 'Letters, numbers, dots and dashes. 2 to 24 of them.' };
    if (state === 'blocked') return { state: 'bad', msg: 'That one’s reserved for the cats who run the place.' };
    const existing = await boxByHandle(ctx, h);
    if (!existing) return { state: 'free', msg: 'Empty box. It’s yours.' };
    const user = await currentUser(ctx);
    if (user && existing.ownerId === user._id) return { state: 'same', msg: 'That’s your address now.' };
    const base = h.replace(/[._-]+$/, '');
    for (const alt of [`${base}.ink`, `${base}cat`, `${base}-studio`, `hey${base}`]) {
      if (handleState(alt) === 'ok' && !(await boxByHandle(ctx, alt))) return { state: 'taken', msg: 'Someone’s napping here. Try', alt };
    }
    return { state: 'taken', msg: 'Someone’s napping here.' };
  },
});

export const claim = mutation({
  args: { handle: v.string() },
  handler: async (ctx, { handle }) => {
    const user = await requireUser(ctx);
    const h = handle.trim().toLowerCase();
    const mine = await boxOfUser(ctx, user._id);
    if (mine) return { handle: mine.handle, existing: true };
    if (handleState(h) !== 'ok') throw new ConvexError('That address can’t be used.');
    if (await boxByHandle(ctx, h)) throw new ConvexError('Someone just took that one.');
    await ctx.db.insert('boxes', {
      handle: h,
      ownerId: user._id,
      name: '',
      bio: '',
      avatar: null,
      avatarShape: 'circle',
      onboarding: true,
      shared: false,
      suggestions: NEW_SUGGESTIONS,
      tiles: [],
      updatedAt: Date.now(),
    });
    return { handle: h, existing: false };
  },
});

// The editor sends the whole profile and layout; only the owner may write it.
export const save = mutation({
  args: { data: v.any(), expectedRevision: v.number(), saveId: v.string() },
  handler: async (ctx, { data, expectedRevision, saveId }) => {
    const { user, box } = await requireOwnBox(ctx);
    if (!saveId || saveId.length > 80 || !Number.isSafeInteger(expectedRevision) || expectedRevision < 0)
      throw new ConvexError('Invalid save request. Refresh your editor.');
    // Retry of a save whose response was lost must not advance the revision twice.
    if (box.lastSaveId === saveId) return { revision: box.revision ?? 0, updatedAt: box.updatedAt };
    if ((box.revision ?? 0) !== expectedRevision)
      throw new ConvexError({ code: 'SAVE_CONFLICT', message: 'Your box changed in another tab. Your edits are kept in this browser.' });
    if (!data || typeof data !== 'object' || Array.isArray(data) || JSON.stringify(data).length > 250_000)
      throw new ConvexError('That box is too large to save.');
    const patch = cleanProfile(data ?? {});
    const revision = expectedRevision + 1, updatedAt = Date.now();
    await syncReferences(ctx, user._id, { ...box, ...patch });
    await ctx.db.patch(box._id, { ...patch, revision, lastSaveId: saveId, updatedAt });
    // Seed counters for new purr tiles so visitor purrs have something to add to.
    for (const t of patch.tiles ?? []) {
      if (t.type !== 'purr') continue;
      const c = await ctx.db.query('counters').withIndex('by_box_tile', q => q.eq('boxId', box._id).eq('tileId', t.id)).unique();
      if (!c) await ctx.db.insert('counters', { boxId: box._id, tileId: t.id, count: Number(t.count) || 0 });
    }
    return { revision, updatedAt };
  },
});

export const rename = mutation({
  args: { to: v.string() },
  handler: async (ctx, { to }) => {
    const { box } = await requireOwnBox(ctx);
    const h = to.trim().toLowerCase();
    if (h === box.handle) return { handle: h };
    if (handleState(h) !== 'ok') throw new ConvexError('That address can’t be used.');
    if (await boxByHandle(ctx, h)) throw new ConvexError('Someone’s napping there already.');
    await ctx.db.patch(box._id, { handle: h, updatedAt: Date.now() });
    return { handle: h };
  },
});

const EXPLORE = 9;

// The most visited boxes with something in them, topped up with recent ones while visits are thin.
export const explore = query({
  args: {},
  handler: async ctx => {
    const picked = new Map();
    const add = b => b && b.tiles.length > 0 && picked.size < EXPLORE && picked.set(b._id, b);
    for (const row of await ctx.db.query('views').withIndex('by_count').order('desc').take(EXPLORE * 3)) add(await ctx.db.get(row.boxId));
    if (picked.size < EXPLORE) {
      for (const b of await ctx.db.query('boxes').withIndex('by_updated').order('desc').take(60)) if (!picked.has(b._id)) add(b);
    }
    return await Promise.all([...picked.values()].map(b => present(ctx, b, null)));
  },
});

// One-off: builds `views` from the visits recorded before it existed. Safe to run twice.
export const backfillViews = internalMutation({
  args: {},
  handler: async ctx => {
    const totals = new Map();
    for await (const r of ctx.db.query('visits')) totals.set(r.boxId, (totals.get(r.boxId) ?? 0) + 1);
    for (const [boxId, count] of totals) {
      const row = await ctx.db.query('views').withIndex('by_box', q => q.eq('boxId', boxId)).unique();
      if (row) await ctx.db.patch(row._id, { count });
      else await ctx.db.insert('views', { boxId, count });
    }
    return totals.size;
  },
});

// Delete the signed-in person's box and everything visitors left on it.
export const remove = mutation({
  args: {},
  handler: async ctx => {
    const { user } = await requireOwnBox(ctx);
    if (!process.env.CLERK_SECRET_KEY) throw new ConvexError('Account deletion is not configured. Please contact hello@bento.cat.');
    const identity = await ctx.auth.getUserIdentity();
    const id = await ctx.db.insert('deletedUsers', {
      tokenIdentifier: identity.tokenIdentifier, clerkId: identity.subject, clerkDeleted: false, attempts: 0, requestedAt: Date.now(),
    });
    await eraseUser(ctx, user);
    await ctx.scheduler.runAfter(0, internal.accounts.processDeletion, { id });
    return { deletionId: id };
  },
});

const PURGE = [
  ['counters', 'by_box_tile'],
  ['purrs', 'by_box_visitor'],
  ['scribbles', 'by_box_tile'],
  ['subscribers', 'by_box_tile_email'],
  ['visits', 'by_box_at'],
  ['views', 'by_box'],
];

// Clears related rows a batch at a time, then calls itself until nothing is left.
export const purge = internalMutation({
  args: { boxId: v.id('boxes') },
  handler: async (ctx, { boxId }) => {
    let left = false;
    for (const [table, index] of PURGE) {
      const rows = await ctx.db.query(table).withIndex(index, q => q.eq('boxId', boxId)).take(400);
      for (const r of rows) await ctx.db.delete(r._id);
      if (rows.length === 400) left = true;
    }
    if (left) await ctx.scheduler.runAfter(0, internal.boxes.purge, { boxId });
  },
});
