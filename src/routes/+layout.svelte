<script>
	// Served from our own domain so no page load reaches Google.
	import '@fontsource-variable/instrument-sans/wght.css';
	import '../app.css';
	import { onMount } from 'svelte';
	import { browser } from '$app/env';
	import { page } from '$app/state';
	import { beforeNavigate } from '$app/navigation';
	import { startAuth } from '#lib/auth.svelte.js';
	import { mutation, watch } from '#lib/api.js';
	import { initEngine, leavePage } from '#lib/engine/init.js';
	import { setAssets } from '#lib/engine/data.js';
	import { clearOptInLeftovers } from '#lib/visit-consent.js';

	let { children } = $props();

	// Before any page mounts: pages read the visitor key and auth state straight away.
	if (browser) {
		initEngine();
		startAuth();
	}

	onMount(() => {
		void clearOptInLeftovers(key => mutation('interactions:forgetVisits', { visitorKey: key }));
		return watch('files:assets', {}, setAssets, () => {});
	});

	beforeNavigate(() => leavePage());

	// A few pages restyle the whole body (editor toasts, the curb-coloured sign-in page).
	$effect(() => {
		const id = page.route.id || '';
		document.body.className = id === '/edit' ? 'pg-edit' : id.startsWith('/login') ? 'pg-auth' : id === '/[handle]' ? 'pg-profile' : '';
	});
</script>

{@render children()}
<div id="layer"></div>
<div id="toasts" aria-live="polite"></div>
