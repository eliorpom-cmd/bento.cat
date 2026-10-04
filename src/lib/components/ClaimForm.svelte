<script>
	import { goto } from '$app/navigation';
	import { I, handleCheck } from '#lib/engine/util.js';

	let { idle } = $props();

	let value = $state('');
	let res = $state({ state: 'empty', msg: '' });
	let form, input, timer, seq = 0;

	async function check() {
		const n = ++seq;
		const r = await handleCheck(value, null);
		if (n === seq) res = r;
		return r;
	}

	function onInput() {
		value = value.toLowerCase().replace(/\s/g, '');
		clearTimeout(timer);
		timer = setTimeout(check, 220);
	}

	function useAlt(alt) {
		value = alt;
		check();
		input.focus();
	}

	async function submit(e) {
		e.preventDefault();
		clearTimeout(timer);
		const r = await check();
		if (r.state === 'free') return goto(`/login?claim=${encodeURIComponent(value.trim())}`);
		input.focus();
		form.animate([{ transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(-3px)' }, { transform: 'none' }], { duration: 280 });
	}
</script>

<form class="claim" data-state={res.state} novalidate bind:this={form} onsubmit={submit}>
	<label class="claim-in">
		<span class="claim-pre">bento.cat/</span>
		<input bind:this={input} bind:value oninput={onInput} placeholder="yourname" autocomplete="off" spellcheck="false" maxlength="24" aria-label="Pick your address" />
		<i class="claim-ok">{@html I.check('#161616', 14, 2.2)}</i>
	</label>
	<button class="btn btn-dark">Claim your box <span class="arr-up">↗</span></button>
</form>
<small class="claim-note" data-state={res.state}>
	{#if res.state === 'empty'}{idle}{:else}{res.msg}{#if res.alt}{' '}<button type="button" class="chip-btn" onclick={() => useAlt(res.alt)}>{res.alt}</button>{/if}{/if}
</small>
