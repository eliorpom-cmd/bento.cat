import { PUBLIC_CONVEX_URL } from '$app/env/public';
import { ConvexHttpClient } from 'convex/browser';
import { anyApi } from 'convex/server';
import { recordPageView } from '../page-views.js';

export function countPageView(boxId, request) {
	return recordPageView(boxId, request, async id => {
		// A fresh server client never carries the visitor's cookies or auth token.
		const client = new ConvexHttpClient(PUBLIC_CONVEX_URL, {
			fetch: (url, options) => fetch(url, { ...options, credentials: 'omit', signal: AbortSignal.timeout(1500) }),
		});
		await client.mutation(anyApi.interactions.pageView, { boxId: id });
	});
}
