import { internal } from './_generated/api';
import { internalMutation } from './_generated/server';

export const VISIT_RETENTION = 30 * 24 * 60 * 60 * 1000;
const BATCH = 400;

// All-time aggregate views remain; identifiable visit records expire.
export const cleanup = internalMutation({
  args: {},
  handler: async ctx => {
    const visits = await ctx.db.query('visits').withIndex('by_at', q => q.lte('at', Date.now() - VISIT_RETENTION)).take(BATCH);
    for (const row of visits) await ctx.db.delete(row._id);
    // Rate-limit keys may contain visitor identifiers. Every current window is
    // at most an hour, so none of these old counters is still needed.
    const limits = await ctx.db.query('limits').withIndex('by_window', q => q.lte('windowStart', Date.now() - 24 * 60 * 60 * 1000)).take(BATCH);
    for (const row of limits) await ctx.db.delete(row._id);
    const hours = await ctx.db.query('viewHours').withIndex('by_hour', q => q.lte('hour', Date.now() - VISIT_RETENTION)).take(BATCH);
    for (const row of hours) await ctx.db.delete(row._id);
    const revoked = await ctx.db.query('revokedVisitKeys').withIndex('by_expiry', q => q.lte('expiresAt', Date.now())).take(BATCH);
    for (const row of revoked) await ctx.db.delete(row._id);
    if (visits.length === BATCH || limits.length === BATCH || hours.length === BATCH || revoked.length === BATCH) await ctx.scheduler.runAfter(0, internal.retention.cleanup, {});
  },
});
