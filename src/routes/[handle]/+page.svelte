<script>
	import { onMount } from 'svelte';
	import Nav from '#lib/components/Nav.svelte';
	import Footer from '#lib/components/Footer.svelte';
	import { mutation, watch } from '#lib/api.js';
	import { auth } from '#lib/auth.svelte.js';
	import { Box } from '#lib/engine/box.js';
	import { Visitor } from '#lib/engine/state.js';
	import { VisitConsent } from '#lib/visit-consent.js';
	import { Cat, I, catLogo } from '#lib/engine/util.js';

	let { data } = $props();

	let live = $state.raw(undefined);
	const box = $derived(live === undefined ? data.box : live);
	const own = $derived(!!box?.isOwner || (auth.me?.box && auth.me.box.handle === data.handle));
	const empty = $derived(box && !box.tiles.length);
	const description = $derived(box ? box.bio?.replace(/<[^>]+>/g, '').slice(0, 160) || `${box.name || box.handle} on bento.cat` : 'An empty box on bento.cat.');

	let root = $state();
	const deviceNow = () => (typeof innerWidth === 'number' && innerWidth < 760 ? 'm' : 'd');
	let device = deviceNow();

	// Redraw whenever the box changes; tiles that moved slide to their new spot.
	let drawn = false;
	$effect(() => {
		if (!root || !box) return;
		Box.render(root, box, { mode: 'view', device, animate: drawn });
		drawn = true;
	});

	// Follow this box live. Runs again when you hop from one box to another.
	$effect(() => {
		const handle = data.handle;
		live = undefined;
		drawn = false;
		return watch('boxes:get', { handle, visitorKey: Visitor.key }, b => {
			Visitor.absorb(b);
			live = b;
		}, () => {});
	});

	let statisticsKey = $state('');
	onMount(() => VisitConsent.subscribe(value => {
		statisticsKey = value.choice === true ? value.key : '';
	}));

	// Public content refresh does not depend on optional statistics.
	let refreshed = '';
	$effect(() => {
		const id = box?._id;
		if (!id || refreshed === id) return;
		refreshed = id;
		mutation('interactions:refreshBox', { boxId: id }).catch(() => {});
	});

	// No visit is sent before opt-in, and withdrawal stops future visits immediately.
	let counted = '';
	$effect(() => {
		const id = box?._id;
		const key = statisticsKey;
		if (!id || !key || counted === `${id}/${key}`) return;
		counted = `${id}/${key}`;
		mutation('interactions:visit', { boxId: id, visitorKey: key, consent: true }).catch(() => {});
	});

	onMount(() => {
		const onResize = () => {
			const d = deviceNow();
			if (d !== device && root && box) {
				device = d;
				Box.render(root, box, { mode: 'view', device, animate: true });
			}
		};
		addEventListener('resize', onResize);
		const t = setTimeout(() => Cat.flash('wide', 1300), 500);
		return () => {
			removeEventListener('resize', onResize);
			clearTimeout(t);
		};
	});
</script>

<svelte:head>
	<title>{box ? `${box.name || box.handle} — bento.cat/${box.handle}` : `bento.cat/${data.handle}`}</title>
	<meta name="description" content={description} />
	<meta property="og:title" content={box ? box.name || `bento.cat/${box.handle}` : `bento.cat/${data.handle}`} />
	<meta property="og:description" content={description} />
	{#if box?.avatar}<meta property="og:image" content={box.avatar} />{/if}
</svelte:head>

{#if box}
	<div class="pf">
		<header class="pf-top">
			<a class="pf-handle" href="/">{@html catLogo(26, { live: true })}<span>bento.cat/{box.handle}</span>{#if box.demo}<span class="example-chip" title="A made-up person, to show what a box can hold">Example box</span>{/if}</a>
			{#if own}<a class="btn btn-line" href="/edit">Back to editing</a>{:else}<a class="btn btn-line" href="/">Make your own box</a>{/if}
		</header>
		<main class="pf-main">
			<div bind:this={root}></div>
			{#if empty}
				<p class="pf-empty">Nothing in the box yet. {#if own}<a href="/edit">Put something in it.</a>{:else}Check back soon.{/if}</p>
			{/if}
		</main>
		<footer class="pf-foot">
			<div>{@html I.sleepyLoaf(38)}<span>{box.footer || 'That’s the whole box.'}</span></div>
			<nav class="pf-foot-links" aria-label="Site links">
				<a href="/privacy">Privacy</a>
				<button onclick={() => VisitConsent.edit()}>Privacy settings</button>
				<a href="/terms">Terms</a>
				<a href="/imprint">Imprint</a>
				<a href="/">bento.cat</a>
			</nav>
		</footer>
	</div>
{:else}
	{@const state = data.status?.state}
	<div class="land">
		<Nav />
		<section class="empty-box">
			<svg class="ears" viewBox="0 0 280 196"><path d="M10 50 L26 6 L78 38 H202 L254 6 L270 50 V172 Q270 190 252 190 H28 Q10 190 10 172 Z" fill="none" stroke="#BDBDBD" stroke-width="1.5" stroke-linejoin="round" stroke-dasharray="6 6" /></svg>
			<h1>bento.cat/{data.handle}</h1>
			<p class="lede">
				{#if state === 'free'}An empty box. Nobody’s curled up in it yet.{:else if state === 'bad'}This one’s reserved for the cats who run the place, or it isn’t an address at all.{:else}Someone’s napping here, but they haven’t put anything out.{/if}
			</p>
			{#if state === 'free'}
				<a class="btn btn-dark lg" href="/login?claim={encodeURIComponent(data.handle)}">Claim it <span class="arr-up">↗</span></a>
			{:else}
				<a class="btn btn-line lg" href="/">Find your own spot</a>
			{/if}
		</section>
		<Footer />
	</div>
{/if}
