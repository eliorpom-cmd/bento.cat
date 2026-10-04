import { ConvexError, v } from 'convex/values';
import { internal } from './_generated/api';
import { internalMutation, mutation } from './_generated/server';
import { boxOfUser, currentUser } from './lib';
import { limit } from './limits';
import { GH_STALE } from './links';
import { VISIT_RETENTION } from './retention';

const MIN = 60 * 1000;

const VISIT_GAP = 30 * 60 * 1000;

async function tileOf(ctx, boxId, tileId, type) {
  const box = await ctx.db.get(boxId);
  const tile = box?.tiles.find(t => t.id === tileId && t.type === type);
  if (!box || !tile) throw new ConvexError('That tile isn’t here any more.');
  return { box, tile };
}

const key = s => {
  if (typeof s !== 'string' || s.length < 8 || s.length > 64) throw new ConvexError('Bad visitor key.');
  return s;
};

// One purr per visitor per tile. Repeat taps still feel good, they just don't count twice.
export const purr = mutation({
  args: { boxId: v.id('boxes'), tileId: v.string(), visitorKey: v.string() },
  handler: async (ctx, { boxId, tileId, visitorKey }) => {
    const { tile } = await tileOf(ctx, boxId, tileId, 'purr');
    await limit(ctx, `purr:${boxId}`, 300, 10 * MIN);
    const done = await ctx.db.query('purrs').withIndex('by_box_visitor', q => q.eq('boxId', boxId).eq('visitorKey', key(visitorKey)).eq('tileId', tileId)).unique();
    const counter = await ctx.db.query('counters').withIndex('by_box_tile', q => q.eq('boxId', boxId).eq('tileId', tileId)).unique();
    if (done) return { count: counter?.count ?? (Number(tile.count) || 0), counted: false };
    await ctx.db.insert('purrs', { boxId, tileId, visitorKey });
    const count = (counter?.count ?? (Number(tile.count) || 0)) + 1;
    if (counter) await ctx.db.patch(counter._id, { count });
    else await ctx.db.insert('counters', { boxId, tileId, count });
    return { count, counted: true };
  },
});

export const scribble = mutation({
  args: { boxId: v.id('boxes'), tileId: v.string(), d: v.string(), name: v.string(), visitorKey: v.optional(v.string()) },
  handler: async (ctx, { boxId, tileId, d, name, visitorKey }) => {
    await tileOf(ctx, boxId, tileId, 'guestbook');
    if (!d.trim() || d.length > 20000 || !/^[MLml0-9.\s-]+$/.test(d)) throw new ConvexError('That drawing didn’t come through.');
    const vk = visitorKey ? key(visitorKey) : 'anon';
    await limit(ctx, `scribble:${boxId}:${vk}`, 5, 60 * MIN, 'You’ve pinned a few already. Come back in an hour.');
    await limit(ctx, `scribble:${boxId}`, 40, 10 * MIN, 'The guestbook is busy. Try again in a few minutes.');
    await ctx.db.insert('scribbles', { boxId, tileId, d, name: name.trim().slice(0, 24) || 'A visitor', visitorKey: vk });
  },
});

export const subscribe = mutation({
  args: { boxId: v.id('boxes'), tileId: v.string(), email: v.string(), visitorKey: v.string() },
  handler: async (ctx, { boxId, tileId, email, visitorKey }) => {
    await tileOf(ctx, boxId, tileId, 'subscribe');
    const e = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) || e.length > 200) throw new ConvexError('That email doesn’t look right.');
    await limit(ctx, `subscribe:${boxId}:${key(visitorKey)}`, 3, 60 * MIN);
    await limit(ctx, `subscribe:${boxId}`, 60, 10 * MIN);
    const existing = await ctx.db.query('subscribers').withIndex('by_box_tile_email', q => q.eq('boxId', boxId).eq('tileId', tileId).eq('email', e)).unique();
    if (!existing) await ctx.db.insert('subscribers', { boxId, tileId, email: e, visitorKey: key(visitorKey) });
  },
});

// Refresh public content without recording an identifier or a visit.
export const refreshBox = mutation({
  args: { boxId: v.id('boxes') },
  handler: async (ctx, { boxId }) => {
    const box = await ctx.db.get(boxId);
    if (!box) return;
    const now = Date.now();
    // Someone's looking: a good moment to bring old GitHub graphs up to date.
    const stale = box.tiles.some(t => t.type === 'github' && t.user && !t.demo && now - (t.fetchedAt || 0) > GH_STALE);
    if (stale && now - (box.ghCheckedAt || 0) > 60 * MIN) {
      await ctx.db.patch(boxId, { ghCheckedAt: now });
      await ctx.scheduler.runAfter(0, internal.links.refreshGithub, { boxId });
    }
  },
});

// Explicit consent is required even for callers using an older frontend.
// Counted at most once per key every half hour; owners don't count.
export const visit = mutation({
  args: { boxId: v.id('boxes'), visitorKey: v.string(), consent: v.literal(true) },
  handler: async (ctx, { boxId, visitorKey }) => {
    key(visitorKey);
    if (await ctx.db.query('revokedVisitKeys').withIndex('by_key', q => q.eq('visitorKey', visitorKey)).first()) return;
    const box = await ctx.db.get(boxId);
    if (!box) return;
    const now = Date.now();
    const user = await currentUser(ctx);
    if (user && box.ownerId === user._id) return;
    const recent = await ctx.db.query('visits').withIndex('by_box_visitor', q => q.eq('boxId', boxId).eq('visitorKey', key(visitorKey)).gt('at', now - VISIT_GAP)).first();
    if (recent) return;
    await limit(ctx, `visit:${boxId}`, 1000, 10 * MIN);
    const viewerBox = user ? await boxOfUser(ctx, user._id) : null;
    await ctx.db.insert('visits', { boxId, visitorKey, viewerBoxId: viewerBox?._id, at: now });
    const views = await ctx.db.query('views').withIndex('by_box', q => q.eq('boxId', boxId)).unique();
    if (views) await ctx.db.patch(views._id, { count: views.count + 1 });
    else await ctx.db.insert('views', { boxId, count: 1 });
  },
});

async function eraseVisits(ctx, visitorKey) {
  const rows = await ctx.db.query('visits').withIndex('by_visitor', q => q.eq('visitorKey', key(visitorKey))).take(400);
  for (const row of rows) await ctx.db.delete(row._id);
  if (rows.length === 400) await ctx.scheduler.runAfter(0, internal.interactions.purgeVisitor, { visitorKey });
}

// Knowing the random key permits removal of only those visits, with no data returned.
export const forgetVisits = mutation({
  args: { visitorKey: v.string() },
  handler: async (ctx, { visitorKey }) => {
    key(visitorKey);
    const row = await ctx.db.query('revokedVisitKeys').withIndex('by_key', q => q.eq('visitorKey', visitorKey)).first();
    if (!row) await ctx.db.insert('revokedVisitKeys', { visitorKey, expiresAt: Date.now() + VISIT_RETENTION });
    await eraseVisits(ctx, visitorKey);
  },
});

export const purgeVisitor = internalMutation({
  args: { visitorKey: v.string() },
  handler: async (ctx, { visitorKey }) => await eraseVisits(ctx, visitorKey),
});
