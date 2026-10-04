<script>
	import { onMount } from 'svelte';
	import Nav from '#lib/components/Nav.svelte';
	import Footer from '#lib/components/Footer.svelte';
	import { watch } from '#lib/api.js';
	import { Box } from '#lib/engine/box.js';
	import { bg } from '#lib/engine/tiles.js';
	import { plural } from '#lib/engine/util.js';

	let boxes = $state.raw(null);

	// Miniatures: each card is the real box drawn at desktop size, then scaled to fit.
	const mini = b => el => Box.render(el, b, { mode: 'static', device: 'd' });
	const fit = el => {
		const ro = new ResizeObserver(() => el.style.setProperty('--s', el.clientWidth / 1240));
		ro.observe(el);
		return () => ro.disconnect();
	};

	onMount(() => watch('boxes:explore', {}, b => (boxes = b), () => (boxes = [])));
</script>

<svelte:head><title>Explore boxes — bento.cat</title></svelte:head>

<div class="land">
	<Nav />
	<header class="xp-head"><h1>Boxes worth a sniff</h1><p class="lede">The most visited pages people made. Borrow an idea or two.</p></header>
	<div class="xp-grid">
		{#each boxes || [] as b (b.handle)}
			<a class="xp-card" href="/{b.handle}">
				<div class="xp-shot" {@attach fit}><div class="xp-frame"><div class="xp-root" {@attach mini(b)}></div></div></div>
				<div class="xp-meta">
					{#if b.avatar}<span class="xp-av av-{b.avatarShape || 'circle'}" style={bg(b.avatar, b.avatarPos)}></span>{:else}<span class="xp-av empty">{(b.name || b.handle)[0].toUpperCase()}</span>{/if}
					<span class="xp-who"><b>{b.name || b.handle}</b><small>bento.cat/{b.handle}{#if b.demo}<span class="example-chip">Example</span>{/if}</small></span>
					<span class="xp-n tnum">{plural(b.tiles.filter(t => t.type !== 'section').length, 'tile')}</span>
				</div>
			</a>
		{/each}
	</div>
	<Footer />
</div>
