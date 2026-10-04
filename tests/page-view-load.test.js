import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/lib/api.js', () => ({ httpQuery: vi.fn() }));
vi.mock('../src/lib/server/page-views.js', () => ({ countPageView: vi.fn() }));

import { httpQuery } from '../src/lib/api.js';
import { countPageView } from '../src/lib/server/page-views.js';
import { load } from '../src/routes/[handle]/+page.server.js';

const event = () => ({ params: { handle: 'Owner' }, request: new Request('https://bento.cat/Owner'), fetch: vi.fn() });
beforeEach(() => { vi.clearAllMocks(); });

describe('public box server loads', () => {
  it('counts one existing box per load, before returning data for hydration', async () => {
    const box = { _id: 'box-id', handle: 'owner' };
    httpQuery.mockResolvedValueOnce(box);
    const request = event();
    expect(await load(request)).toEqual({ handle: 'owner', box, status: null });
    expect(httpQuery).toHaveBeenCalledWith('boxes:get', { handle: 'owner' }, request.fetch);
    expect(countPageView.mock.calls).toEqual([['box-id', request.request]]);
  });

  it('does not count missing boxes', async () => {
    httpQuery.mockResolvedValueOnce(null).mockResolvedValueOnce({ state: 'free' });
    expect(await load(event())).toEqual({ handle: 'owner', box: null, status: { state: 'free' } });
    expect(countPageView).not.toHaveBeenCalled();
  });

  it('does not count failed reads', async () => {
    httpQuery.mockRejectedValue(new Error('unavailable'));
    expect(await load(event())).toEqual({ handle: 'owner', box: null, status: { state: 'bad' } });
    expect(countPageView).not.toHaveBeenCalled();
  });
});
