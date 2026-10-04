<script>
	import { onMount } from 'svelte';
	import { mutation } from '#lib/api.js';
	import { VisitConsent } from '#lib/visit-consent.js';

	let ready = $state(false);
	let choice = $state(null);
	let editing = $state(false);
	let notice = $state('');

	onMount(() => {
		VisitConsent.load();
		const stop = VisitConsent.subscribe(value => { choice = value.choice; editing = value.editing; });
		const sync = event => {
			if (event.key === null || event.key?.startsWith('bento.cat/')) VisitConsent.load();
		};
		addEventListener('storage', sync);
		const timer = setInterval(() => VisitConsent.checkExpiry(), 60_000);
		ready = true;
		return () => { stop(); removeEventListener('storage', sync); clearInterval(timer); };
	});

	async function choose(allowed) {
		const key = VisitConsent.choose(allowed);
		notice = '';
		if (key) {
			try { await mutation('interactions:forgetVisits', { visitorKey: key }); }
			catch { notice = 'Statistics are off. Previous visits could not be removed right now. Contact hello@bento.cat for help.'; }
		}
	}
</script>

{#if ready}
	{#if choice === null || editing}
		<section class="privacy-choices" aria-labelledby="privacy-choice-title">
			<h2 id="privacy-choice-title">Count your visit?</h2>
			<p>With your permission, a random browser key counts visits for box owners. If you’re signed in, they can also see your box among their visitors. Records are kept for 30 days.</p>
			<p class="privacy-note">Purrs, scribbles and sign-ups work either way. Change it any time under Privacy settings.</p>
			<a href="/privacy">Read our privacy policy</a>
			<div class="privacy-actions">
				<button class="btn btn-line" onclick={() => choose(false)}>No thanks</button>
				<button class="btn btn-line" onclick={() => choose(true)}>Allow statistics</button>
			</div>
		</section>
	{/if}
	{#if notice}<p class="privacy-feedback" role="status">{notice}</p>{/if}
{/if}

<style>
	/* Bottom right: the owner's photo, name and bio live in the left column. */
	.privacy-choices { position: fixed; bottom: 20px; right: 20px; z-index: 1100; width: min(380px, calc(100vw - 40px)); max-height: calc(100dvh - 40px); overflow-y: auto; padding: 20px; border: 1px solid var(--line); border-radius: 18px; background: #fff; box-shadow: 0 8px 28px rgb(0 0 0 / 8%); }
	h2 { margin: 0 0 8px; font-size: 17px; font-weight: 600; line-height: 22px; letter-spacing: -.02em; }
	p { margin: 0 0 8px; font-size: 14px; line-height: 20px; color: var(--text2); }
	.privacy-note { font-size: 13px; line-height: 18px; color: var(--muted); }
	a { font-size: 13px; text-decoration: underline; text-underline-offset: 3px; }
	.privacy-actions { display: flex; gap: 8px; margin-top: 14px; }
	.privacy-actions button { flex: 1; height: 40px; padding: 0 10px; }
	.privacy-feedback { position: fixed; bottom: 12px; left: 12px; z-index: 1101; max-width: min(420px, calc(100vw - 24px)); padding: 16px; border: 1px solid var(--line); border-radius: 12px; background: #fff; }
	/* In the editor, sit above the dock. */
	:global(body:has(.dock)) .privacy-choices { bottom: 96px; max-height: calc(100dvh - 116px); }
	@media (max-width: 480px) { .privacy-choices { right: 12px; bottom: 12px; width: calc(100vw - 24px); max-height: calc(100dvh - 24px); padding: 16px; } }
</style>
