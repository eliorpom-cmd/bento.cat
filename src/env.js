import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	PUBLIC_GOOGLE_SIGN_IN_ENABLED: {
		public: true,
		static: true,
		schema: value => value || 'true',
		description: 'Set to false until production Google OAuth credentials are configured.'
	},
	PUBLIC_CONVEX_URL: {
		public: true,
		static: true,
		description: 'Convex deployment URL. `npx convex dev` writes it to .env.local.'
	},
	PUBLIC_CONVEX_SITE_URL: {
		public: true,
		static: true,
		schema: value => value || '',
		description: 'Convex HTTP action URL; defaults to the .convex.site version of PUBLIC_CONVEX_URL.'
	},
	VITE_CLERK_PUBLISHABLE_KEY: {
		public: true,
		static: true,
		description: 'Clerk publishable key. `clerk env pull` writes it to .env.local.'
	}
});
