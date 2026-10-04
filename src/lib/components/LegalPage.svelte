<script>
	import Nav from '#lib/components/Nav.svelte';
	import Footer from '#lib/components/Footer.svelte';
	import { UPDATED } from '#lib/legal.js';

	let { title, lede = '', children } = $props();
</script>

<svelte:head><title>{title} — bento.cat</title></svelte:head>

<div class="land">
	<Nav />
	<article class="legal">
		<h1>{title}</h1>
		{#if lede}<p class="lede">{lede}</p>{/if}
		<p class="legal-date">Last updated {UPDATED}</p>
		{@render children()}
	</article>
	<Footer />
</div>
