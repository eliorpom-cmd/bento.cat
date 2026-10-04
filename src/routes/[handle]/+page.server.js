import { httpQuery } from '#lib/api.js';
import { countPageView } from '#lib/server/page-views.js';

// Server loads cover both document requests and client-side navigation.
export async function load({ params, fetch, request }) {
	const handle = params.handle.toLowerCase();
	const box = await httpQuery('boxes:get', { handle }, fetch).catch(() => null);
	const status = box ? null : await httpQuery('boxes:handleStatus', { handle }, fetch).catch(() => ({ state: 'bad' }));
	if (box) await countPageView(box._id, request);
	return { handle, box, status };
}
