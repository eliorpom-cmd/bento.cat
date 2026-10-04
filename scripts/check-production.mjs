export function productionErrors(env) {
  const errors = [];
  let url;
  try { url = new URL(env.PUBLIC_CONVEX_URL); } catch { errors.push('PUBLIC_CONVEX_URL must be a deployment URL.'); }
  if (url && url.protocol !== 'https:') errors.push('PUBLIC_CONVEX_URL must use HTTPS in production.');
  if (!env.VITE_CLERK_PUBLISHABLE_KEY?.startsWith('pk_live_')) errors.push('VITE_CLERK_PUBLISHABLE_KEY must be a production Clerk key.');
  if (url && !url.hostname.endsWith('.convex.cloud') && !env.PUBLIC_CONVEX_SITE_URL)
    errors.push('Custom or self-hosted Convex deployments need PUBLIC_CONVEX_SITE_URL for HTTP uploads.');
  if (env.PUBLIC_CONVEX_SITE_URL) {
    try { if (new URL(env.PUBLIC_CONVEX_SITE_URL).protocol !== 'https:') throw new Error(); }
    catch { errors.push('PUBLIC_CONVEX_SITE_URL must use HTTPS in production.'); }
  }
  return errors;
}

if (import.meta.main) {
  const errors = productionErrors(process.env);
  if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
  else console.log('Frontend production configuration is valid. Confirm the Convex secrets and Clerk webhook separately as described in README.md.');
}
