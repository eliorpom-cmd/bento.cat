import { httpQuery } from '#lib/api.js';

// First paint and link previews; the page then follows the box live.
export async function load({ params, fetch }) {
	const handle = params.handle.toLowerCase();
	const box = await httpQuery('boxes:get', { handle }, fetch).catch(() => null);
	const status = box ? null : await httpQuery('boxes:handleStatus', { handle }, fetch).catch(() => ({ state: 'bad' }));
	return { handle, box, status };
}
