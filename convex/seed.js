import { v } from 'convex/values';
import { internalMutation } from './_generated/server';
import { demoBoxes } from './demo';
import { boxByHandle } from './lib';

// Used by scripts/seed.mjs: hand out an upload URL for each demo image.
export const uploadUrl = internalMutation({
  args: {},
  handler: async ctx => await ctx.storage.generateUploadUrl(),
});

const resolve = (value, urls) => {
  if (typeof value === 'string' && value.startsWith('@')) return urls[value.slice(1)] ?? '';
  if (Array.isArray(value)) return value.map(v => resolve(v, urls));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolve(v, urls)]));
  return value;
};

// Registers uploaded images, creates missing example boxes and refreshes existing ones. Safe to run twice.
export const run = internalMutation({
  args: { assets: v.array(v.object({ key: v.string(), storageId: v.id('_storage') })) },
  handler: async (ctx, { assets }) => {
    const urls = {};
    for (const { key, storageId } of assets) {
      const url = await ctx.storage.getUrl(storageId);
      const existing = await ctx.db.query('assets').withIndex('by_key', q => q.eq('key', key)).unique();
      if (existing) {
        if (existing.storageId !== storageId) await ctx.storage.delete(existing.storageId);
        await ctx.db.patch(existing._id, { storageId, url });
      } else await ctx.db.insert('assets', { key, storageId, url });
      urls[key] = url;
    }
    for (const row of await ctx.db.query('assets').collect()) urls[row.key] ??= row.url;

    let created = 0, updated = 0;
    const now = Date.now();
    for (const demo of demoBoxes(now)) {
      const existing = await boxByHandle(ctx, demo.handle);
      const box = resolve(demo, urls);
      if (existing) {
        // Example boxes follow the code. A real person's box with the same address is left alone.
        if (existing.demo) { await ctx.db.patch(existing._id, { ...box, demo: true }); updated++; }
        continue;
      }
      const boxId = await ctx.db.insert('boxes', { ...box, demo: true, onboarding: false, shared: true, updatedAt: now - created * 60000 });
      for (const t of box.tiles.filter(t => t.type === 'purr')) {
        await ctx.db.insert('counters', { boxId, tileId: t.id, count: t.count ?? 0 });
      }
      created++;
    }
    return { assets: assets.length, created, updated };
  },
});
