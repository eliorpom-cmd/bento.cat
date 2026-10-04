import { v } from 'convex/values';
import { internal } from './_generated/api';
import { internalAction, internalMutation, internalQuery, query } from './_generated/server';
import { queueLegacyMedia } from './files';

export async function eraseUser(ctx, user) {
  if (!user) return;
  const boxes = await ctx.db.query('boxes').withIndex('by_owner', q => q.eq('ownerId', user._id)).collect();
  await queueLegacyMedia(ctx, user._id, boxes);
  for (const box of boxes) {
    await ctx.db.delete(box._id);
    await ctx.scheduler.runAfter(0, internal.boxes.purge, { boxId: box._id });
    await ctx.scheduler.runAfter(0, internal.accounts.purgeViewerVisits, { boxId: box._id });
  }
  await ctx.scheduler.runAfter(0, internal.accounts.purgeMedia, { ownerId: user._id });
  await ctx.db.delete(user._id);
}

export const purgeMedia = internalMutation({
  args: { ownerId: v.id('users') },
  handler: async (ctx, { ownerId }) => {
    const rows = await ctx.db.query('uploads').withIndex('by_owner', q => q.eq('ownerId', ownerId)).take(100);
    for (const row of rows) {
      if (row.storageId && await ctx.db.system.get(row.storageId)) await ctx.storage.delete(row.storageId);
      await ctx.db.delete(row._id);
    }
    if (rows.length === 100) await ctx.scheduler.runAfter(0, internal.accounts.purgeMedia, { ownerId });
  },
});

// A deleted profile must disappear from other owners' recent visitor lists too.
export const purgeViewerVisits = internalMutation({
  args: { boxId: v.id('boxes') },
  handler: async (ctx, { boxId }) => {
    const rows = await ctx.db.query('visits').withIndex('by_viewer', q => q.eq('viewerBoxId', boxId)).take(400);
    for (const row of rows) await ctx.db.delete(row._id);
    if (rows.length === 400) await ctx.scheduler.runAfter(0, internal.accounts.purgeViewerVisits, { boxId });
  },
});

export const job = internalQuery({ args: { id: v.id('deletedUsers') }, handler: (ctx, { id }) => ctx.db.get(id) });

// Mutations are retried transactionally. Schedule the next check BEFORE running
// the external action, so even a crashed action leaves a durable retry behind.
export const processDeletion = internalMutation({
  args: { id: v.id('deletedUsers') },
  handler: async (ctx, { id }) => {
    const row = await ctx.db.get(id);
    if (!row || row.clerkDeleted) return;
    const now = Date.now();
    if (row.nextAttemptAt && row.nextAttemptAt > now) return;
    const delay = Math.min(60 * 60 * 1000, 60_000 * 2 ** Math.min(row.attempts, 6));
    await ctx.db.patch(id, { attempts: row.attempts + 1, lastAttemptAt: now, nextAttemptAt: now + delay });
    await ctx.scheduler.runAfter(delay, internal.accounts.processDeletion, { id });
    await ctx.scheduler.runAfter(0, internal.accounts.deleteClerk, { id });
  },
});

export const finishDeletion = internalMutation({
  args: { id: v.id('deletedUsers') },
  handler: async (ctx, { id }) => {
    if (await ctx.db.get(id)) await ctx.db.patch(id, { clerkDeleted: true, completedAt: Date.now(), lastError: undefined, nextAttemptAt: undefined });
  },
});

export const failDeletion = internalMutation({
  args: { id: v.id('deletedUsers'), error: v.string() },
  handler: async (ctx, { id, error }) => {
    const row = await ctx.db.get(id);
    // A webhook/another attempt may already have confirmed success.
    if (row && !row.clerkDeleted) await ctx.db.patch(id, { lastError: error.slice(0, 300) });
  },
});

// The opaque deletion ID is a receipt, returned only to the deleting browser.
// This stays readable after Clerk revokes the session and exposes no account data.
export const deletionStatus = query({
  args: { id: v.id('deletedUsers') },
  handler: async (ctx, { id }) => {
    const row = await ctx.db.get(id);
    if (!row) return null;
    return { status: row.clerkDeleted ? 'complete' : row.lastError ? 'retrying' : 'pending' };
  },
});

// A dashboard-visible backlog and a cron watchdog cover legacy/stalled jobs.
export const pendingDeletions = internalQuery({
  args: {},
  handler: async ctx => await ctx.db.query('deletedUsers').withIndex('by_pending', q => q.eq('clerkDeleted', false)).take(100),
});

export const retryDeletions = internalMutation({
  args: {},
  handler: async ctx => {
    const rows = await ctx.db.query('deletedUsers').withIndex('by_pending', q => q.eq('clerkDeleted', false).lte('nextAttemptAt', Date.now())).take(100);
    for (const row of rows) {
      if (row.lastError) console.error('Account deletion remains pending', { deletionId: row._id, attempts: row.attempts, error: row.lastError });
      await ctx.scheduler.runAfter(0, internal.accounts.processDeletion, { id: row._id });
    }
  },
});

export const deleteClerk = internalAction({
  args: { id: v.id('deletedUsers') },
  handler: async (ctx, { id }) => {
    const row = await ctx.runQuery(internal.accounts.job, { id });
    if (!row || row.clerkDeleted) return;
    const secret = process.env.CLERK_SECRET_KEY;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      if (!secret) throw new Error('Account deletion needs CLERK_SECRET_KEY');
      const response = await fetch(`https://api.clerk.com/v1/users/${encodeURIComponent(row.clerkId)}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${secret}` }, signal: controller.signal,
      });
      // A repeated DELETE, including one following a webhook, is successful too.
      if (response.ok || response.status === 404) await ctx.runMutation(internal.accounts.finishDeletion, { id });
      else throw new Error(`Clerk account deletion returned HTTP ${response.status}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Clerk account deletion failed';
      await ctx.runMutation(internal.accounts.failDeletion, { id, error: message });
      console.error('Clerk account deletion will retry', { deletionId: id, attempt: row.attempts, error: message });
      // Mark the scheduled action as failed in Convex instead of silently succeeding.
      throw new Error(`Account deletion ${id} failed; a durable retry is scheduled: ${message}`);
    }
    finally { clearTimeout(timeout); }
  },
});

export const deletedByClerk = internalMutation({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    let user = await ctx.db.query('users').withIndex('by_clerk', q => q.eq('clerkId', clerkId)).first();
    const tokenIdentifier = `${process.env.CLERK_JWT_ISSUER_DOMAIN}|${clerkId}`;
    // Existing users acquire clerkId next time they sign in; support them meanwhile.
    user ||= await ctx.db.query('users').withIndex('by_token', q => q.eq('tokenIdentifier', tokenIdentifier)).first();
    const deleted = await ctx.db.query('deletedUsers').withIndex('by_clerk', q => q.eq('clerkId', clerkId)).first();
    const completion = { clerkDeleted: true, completedAt: Date.now(), lastError: undefined, nextAttemptAt: undefined };
    if (deleted) await ctx.db.patch(deleted._id, completion);
    else await ctx.db.insert('deletedUsers', { tokenIdentifier: user?.tokenIdentifier || tokenIdentifier, clerkId, clerkDeleted: true, completedAt: Date.now(), attempts: 0 });
    await eraseUser(ctx, user);
  },
});
