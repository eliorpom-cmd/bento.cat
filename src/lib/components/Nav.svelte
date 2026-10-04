<script>
	import { auth } from '#lib/auth.svelte.js';
	import { catLogo } from '#lib/engine/util.js';

	const hasBox = $derived(!!auth.me?.box);
</script>

<nav class="nav">
	<a href="/" class="brand" aria-label="bento.cat home">{@html catLogo(36, { live: true })}<span>bento.cat</span></a>
	<div class="nav-r">
		<a href="/explore">Explore boxes</a>
		{#if hasBox}<a href="/edit">Your box</a>{:else if !auth.signedIn}<a href="/login">Log in</a>{/if}
		<a class="btn btn-dark lg" href={auth.signedIn ? '/edit' : '/login'}>Make your own box <span class="arr-up">↗</span></a>
	</div>
</nav>
