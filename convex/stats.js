import { query } from './_generated/server';
import { boxOfUser, currentUser } from './lib';
import { VISIT_RETENTION } from './retention';

// Raw visit times for the last 30 days. The browser buckets them into its own time zone.
export const visits = query({
  args: {},
  handler: async ctx => {
    const user = await currentUser(ctx);
    if (!user) return null;
    const box = await boxOfUser(ctx, user._id);
    if (!box) return null;
    const since = Date.now() - VISIT_RETENTION;
    const rows = await ctx.db.query('visits').withIndex('by_box_at', q => q.eq('boxId', box._id).gt('at', since)).order('desc').take(10000);

    // People who were signed in when they came by, newest first.
    const seen = new Set(), viewers = [];
    for (const r of rows) {
      if (!r.viewerBoxId || seen.has(r.viewerBoxId) || viewers.length >= 6) continue;
      seen.add(r.viewerBoxId);
      const vb = await ctx.db.get(r.viewerBoxId);
      if (vb) viewers.push({ handle: vb.handle, name: vb.name || vb.handle, avatar: vb.avatar ?? null, avatarShape: vb.avatarShape ?? 'circle' });
    }
    return { times: rows.map(r => r.at), viewers, signedInCount: rows.filter(r => r.viewerBoxId).length };
  },
});

// The newest visit, so the editor's cat can look up when someone arrives.
export const latestVisit = query({
  args: {},
  handler: async ctx => {
    const user = await currentUser(ctx);
    if (!user) return null;
    const box = await boxOfUser(ctx, user._id);
    if (!box) return null;
    const last = await ctx.db.query('visits').withIndex('by_box_at', q => q.eq('boxId', box._id)).order('desc').first();
    return last ? last.at : 0;
  },
});

export const subscribers = query({
  args: {},
  handler: async ctx => {
    const user = await currentUser(ctx);
    if (!user) return [];
    const box = await boxOfUser(ctx, user._id);
    if (!box) return [];
    const rows = [];
    for (const t of box.tiles.filter(t => t.type === 'subscribe')) {
      const list = await ctx.db.query('subscribers').withIndex('by_box_tile_email', q => q.eq('boxId', box._id).eq('tileId', t.id)).collect();
      rows.push({ tileId: t.id, title: t.title, emails: list.map(s => s.email) });
    }
    return rows;
  },
});
