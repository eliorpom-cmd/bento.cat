import { ConvexError } from 'convex/values';

// Allow `max` hits per `windowMs` for a key, or refuse with a friendly message.
export async function limit(ctx, key, max, windowMs, msg = 'That’s a lot at once. Try again in a little while.') {
  const now = Date.now();
  const row = await ctx.db.query('limits').withIndex('by_key', q => q.eq('key', key)).unique();
  if (!row) {
    await ctx.db.insert('limits', { key, windowStart: now, count: 1 });
    return;
  }
  if (now - row.windowStart >= windowMs) {
    await ctx.db.patch(row._id, { windowStart: now, count: 1 });
    return;
  }
  if (row.count >= max) throw new ConvexError(msg);
  await ctx.db.patch(row._id, { count: row.count + 1 });
}
