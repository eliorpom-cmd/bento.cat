import { mutation, query } from './_generated/server';
import { boxOfUser, currentUser } from './lib';

// Called once the browser has a Clerk session, so the user has a row to own things with.
export const store = mutation({
  args: {},
  handler: async ctx => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    if (await ctx.db.query('deletedUsers').withIndex('by_clerk', q => q.eq('clerkId', identity.subject)).first()) return null;
    const existing = await currentUser(ctx);
    const fields = { clerkId: identity.subject, email: identity.email ?? undefined, name: identity.name ?? undefined };
    if (existing) {
      if (existing.clerkId !== fields.clerkId || existing.email !== fields.email || existing.name !== fields.name) await ctx.db.patch(existing._id, fields);
      return existing._id;
    }
    return await ctx.db.insert('users', { tokenIdentifier: identity.tokenIdentifier, ...fields });
  },
});

export const me = query({
  args: {},
  handler: async ctx => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { signedIn: false };
    if (await ctx.db.query('deletedUsers').withIndex('by_clerk', q => q.eq('clerkId', identity.subject)).first()) return { signedIn: false };
    const user = await currentUser(ctx);
    if (!user) return { signedIn: true, ready: false, email: identity.email ?? null };
    const box = await boxOfUser(ctx, user._id);
    return {
      signedIn: true,
      ready: true,
      email: user.email ?? null,
      box: box ? { handle: box.handle, name: box.name, avatar: box.avatar ?? null, avatarShape: box.avatarShape ?? 'circle' } : null,
    };
  },
});
