import { internal } from './_generated/api';

// Browser uploads and downloaded link-preview images share ownership and quotas.
export async function storeOwned(ctx, blob) {
  const uploadId = await ctx.runMutation(internal.files.reserve, { bytes: blob.size, contentType: blob.type });
  let storageId;
  try {
    storageId = await ctx.storage.store(blob);
    return await ctx.runMutation(internal.files.attach, { uploadId, storageId });
  } catch (error) {
    if (storageId) await ctx.storage.delete(storageId);
    await ctx.runMutation(internal.files.release, { uploadId });
    throw error;
  }
}
