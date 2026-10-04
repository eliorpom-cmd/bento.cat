export function handleError({ error, event, status }) {
	const errorId = crypto.randomUUID();
	console.error('Unhandled browser error', { errorId, status, route: event.route.id, error });
	return { message: 'Something went wrong. Please try again.', errorId };
}
