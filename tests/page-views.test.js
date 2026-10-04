import { describe, expect, it, vi } from 'vitest';
import { convexTest } from 'convex-test';
import { api, internal } from '../convex/_generated/api.js';
import schema from '../convex/schema.js';
import { recordPageView } from '../src/lib/page-views.js';

const modules = import.meta.glob('../convex/**/*.js');
const rows = (t, table) => t.run(ctx => ctx.db.query(table).collect());

async function setup() {
  const t = convexTest(schema, modules);
  const owner = t.withIdentity({ subject: 'owner', issuer: 'https://clerk.example', tokenIdentifier: 'https://clerk.example|owner' });
  await owner.mutation(api.users.store);
  await owner.mutation(api.boxes.claim, { handle: 'owner' });
  return { t, owner, box: await owner.query(api.boxes.mine) };
}

describe('anonymous page views', () => {
  it('stores only one aggregate row, including repeat and signed-in owner loads', async () => {
    const { t, owner, box } = await setup();
    await t.mutation(api.interactions.pageView, { boxId: box._id });
    await t.mutation(api.interactions.pageView, { boxId: box._id });
    await owner.mutation(api.interactions.pageView, { boxId: box._id });
    const totals = await rows(t, 'views');
    expect(totals).toHaveLength(1);
    expect(totals[0]).toEqual({ _id: expect.any(String), _creationTime: expect.any(Number), boxId: box._id, count: 3 });
    expect(await rows(t, 'visits')).toEqual([]);
    expect(await rows(t, 'revokedVisitKeys')).toEqual([]);
    expect(await owner.query(api.stats.visits)).toMatchObject({ pageViews: 3, times: [], viewers: [] });
    expect(await t.query(api.stats.visits)).toBeNull();
  });

  it('keeps opt-in visits and withdrawal separate from page-view totals', async () => {
    const { t, box } = await setup();
    await t.mutation(api.interactions.pageView, { boxId: box._id });
    await t.mutation(api.interactions.visit, { boxId: box._id, visitorKey: 'visitor-key', consent: true });
    await t.mutation(api.interactions.visit, { boxId: box._id, visitorKey: 'visitor-key', consent: true });
    expect((await rows(t, 'views'))[0].count).toBe(1);
    expect(await rows(t, 'visits')).toHaveLength(1);
    await t.mutation(api.interactions.forgetVisits, { visitorKey: 'visitor-key' });
    expect(await rows(t, 'visits')).toEqual([]);
    expect((await rows(t, 'views'))[0].count).toBe(1);
    await t.mutation(api.interactions.pageView, { boxId: box._id });
    expect((await rows(t, 'views'))[0].count).toBe(2);
  });

  it('never overwrites anonymous totals when backfilling old visits', async () => {
    const { t, box } = await setup();
    await t.mutation(api.interactions.visit, { boxId: box._id, visitorKey: 'visitor-key', consent: true });
    await t.mutation(internal.boxes.backfillViews);
    await t.mutation(api.interactions.pageView, { boxId: box._id });
    await t.mutation(internal.boxes.backfillViews);
    expect((await rows(t, 'views'))[0].count).toBe(2);
  });

  it('reveals a signed-in visitor’s box only after they opt in', async () => {
    const { t, owner, box } = await setup();
    const visitor = t.withIdentity({ subject: 'visitor', issuer: 'https://clerk.example', tokenIdentifier: 'https://clerk.example|visitor' });
    await visitor.mutation(api.users.store);
    await visitor.mutation(api.boxes.claim, { handle: 'visitor' });
    await visitor.mutation(api.interactions.pageView, { boxId: box._id });
    expect(await owner.query(api.stats.visits)).toMatchObject({ pageViews: 1, times: [], viewers: [], signedInCount: 0 });
    await expect(visitor.mutation(api.interactions.visit, { boxId: box._id, visitorKey: 'visitor-key', consent: false })).rejects.toThrow();
    await visitor.mutation(api.interactions.visit, { boxId: box._id, visitorKey: 'visitor-key', consent: true });
    expect(await owner.query(api.stats.visits)).toMatchObject({ pageViews: 1, viewers: [{ handle: 'visitor' }], signedInCount: 1 });
  });

  it('ignores deleted boxes and bounds abuse without keeping visitor data', async () => {
    const { t, box } = await setup();
    await t.run(ctx => ctx.db.insert('limits', { key: `view:${box._id}`, windowStart: Date.now(), count: 1000 }));
    await expect(t.mutation(api.interactions.pageView, { boxId: box._id })).rejects.toThrow();
    expect(await rows(t, 'views')).toEqual([]);
    await t.run(ctx => ctx.db.delete(box._id));
    await t.mutation(api.interactions.pageView, { boxId: box._id });
    expect(await rows(t, 'views')).toEqual([]);
    expect(await rows(t, 'visits')).toEqual([]);
  });
});

describe('server page requests', () => {
  it('passes only the box ID to the counter, never request identifiers', async () => {
    const increment = vi.fn();
    const request = new Request('https://bento.cat/owner', { headers: { Cookie: 'session=secret', Authorization: 'Bearer secret', 'X-Forwarded-For': '192.0.2.1', 'User-Agent': 'visitor-browser' } });
    await recordPageView('box-id', request, increment);
    expect(increment.mock.calls).toEqual([['box-id']]);
  });

  it.each([
    { method: 'HEAD' },
    { method: 'POST' },
    { headers: { purpose: 'prefetch' } },
    { headers: { 'sec-purpose': 'prefetch;prerender' } },
  ])('does not count probes or prefetches: %j', async options => {
    const increment = vi.fn();
    await recordPageView('box-id', new Request('https://bento.cat/owner', options), increment);
    expect(increment).not.toHaveBeenCalled();
  });

  it('keeps pages working when statistics are unavailable', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const increment = vi.fn().mockRejectedValue(new Error('backend unavailable'));
    await expect(recordPageView('box-id', new Request('https://bento.cat/owner'), increment)).resolves.toBeUndefined();
    expect(console.warn).toHaveBeenCalledWith('A page view could not be counted.');
  });
});
