// Only actual GET loads count. HEAD checks and explicit prefetches don't.
export async function recordPageView(boxId, request, increment) {
	if (request.method !== 'GET') return;
	const purpose = `${request.headers.get('purpose') || ''} ${request.headers.get('sec-purpose') || ''}`;
	if (/prefetch|prerender/i.test(purpose)) return;
	try { await increment(boxId); }
	catch { console.warn('A page view could not be counted.'); }
}
