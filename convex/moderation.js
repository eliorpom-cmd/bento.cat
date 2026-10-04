import { paginationOptsValidator } from 'convex/server';
import { ConvexError, v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireOwnBox } from './lib';

export const scribbles = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, { paginationOpts }) => {
    const { box } = await requireOwnBox(ctx);
    return await ctx.db.query('scribbles').withIndex('by_box_tile', q => q.eq('boxId', box._id)).order('desc').paginate(paginationOpts);
  },
});
export const subscribers = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, { paginationOpts }) => {
    const { box } = await requireOwnBox(ctx);
    return await ctx.db.query('subscribers').withIndex('by_box_tile_email', q => q.eq('boxId', box._id)).paginate(paginationOpts);
  },
});
async function remove(ctx, table, id) {
  const { box } = await requireOwnBox(ctx);
  const row = await ctx.db.get(id);
  if (!row) return;
  if (row.boxId !== box._id) throw new ConvexError(`That ${table === 'scribbles' ? 'scribble' : 'subscriber'} belongs to another box.`);
  await ctx.db.delete(id);
}
export const removeScribble = mutation({ args: { id: v.id('scribbles') }, handler: (ctx, { id }) => remove(ctx, 'scribbles', id) });
export const removeSubscriber = mutation({ args: { id: v.id('subscribers') }, handler: (ctx, { id }) => remove(ctx, 'subscribers', id) });

// Visitor keys are bearer capabilities. This removes only that browser's signup;
// knowing an email address alone does not grant permission to unsubscribe it.
export const unsubscribe = mutation({
  args: { boxId: v.id('boxes'), tileId: v.string(), visitorKey: v.string() },
  handler: async (ctx, { boxId, tileId, visitorKey }) => {
    if (visitorKey.length < 8 || visitorKey.length > 64) throw new ConvexError('Bad visitor key.');
    const rows = await ctx.db.query('subscribers').withIndex('by_box_visitor', q => q.eq('boxId', boxId).eq('visitorKey', visitorKey)).collect();
    for (const row of rows) if (row.tileId === tileId) await ctx.db.delete(row._id);
  },
});
