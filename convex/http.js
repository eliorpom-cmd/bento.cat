import { httpRouter } from 'convex/server';
import { ConvexError } from 'convex/values';
import { verifyWebhook } from '@clerk/backend/webhooks';
import { internal } from './_generated/api';
import { httpAction } from './_generated/server';
import { storeOwned } from './media';
import { MAX_UPLOAD_BYTES, mediaType, uploadError } from './mediaPolicy';

const http = httpRouter();
// Authentication uses an explicit bearer token, never ambient cookies.
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Authorization, Content-Type' };
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

http.route({ path: '/upload', method: 'OPTIONS', handler: httpAction(async () => new Response(null, { status: 204, headers: cors })) });
http.route({
  path: '/upload', method: 'POST',
  handler: httpAction(async (ctx, request) => {
    if (!(await ctx.auth.getUserIdentity())) return json({ error: 'Sign in first.' }, 401);
    const type = mediaType(request.headers.get('content-type'));
    const typeError = uploadError(1, type);
    if (typeError) return json({ error: typeError }, 415);
    const length = Number(request.headers.get('content-length'));
    if (length > MAX_UPLOAD_BYTES) return json({ error: uploadError(length, type) }, 413);
    if (!request.body) return json({ error: 'That file is empty.' }, 400);
    try {
      const reader = request.body.getReader();
      const chunks = [];
      let size = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > MAX_UPLOAD_BYTES) {
          await reader.cancel();
          return json({ error: uploadError(size, type) }, 413);
        }
        chunks.push(value);
      }
      const error = uploadError(size, type);
      if (error) return json({ error }, 400);
      const src = await storeOwned(ctx, new Blob(chunks, { type }));
      return json({ src });
    } catch (error) {
      if (error instanceof ConvexError) return json({ error: error.data }, 400);
      console.error('Media upload failed', error);
      return json({ error: 'Upload failed. Try again.' }, 500);
    }
  }),
});

http.route({
  path: '/clerk-webhook', method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const signingSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
    if (!signingSecret) return new Response('Webhook is not configured', { status: 503 });
    let event;
    try { event = await verifyWebhook(request, { signingSecret }); }
    catch { return new Response('Invalid signature', { status: 400 }); }
    // Return 500 if cleanup fails so Clerk retries. Only verification errors are 400.
    if (event.type === 'user.deleted' && event.data.id)
      await ctx.runMutation(internal.accounts.deletedByClerk, { clerkId: event.data.id });
    return new Response('OK');
  }),
});

export default http;
