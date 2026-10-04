<script>
	import LegalPage from '#lib/components/LegalPage.svelte';
	import { OPERATOR as O } from '#lib/legal.js';
</script>

<LegalPage title="Imprint">
	<h2>Who runs bento.cat</h2>
	<p>Information according to § 5 DDG.</p>
	<address>
		<p>{O.name}{#each O.address as line}<br />{line}{/each}</p>
	</address>

	<h2>Contact</h2>
	<p>Email: <a href="mailto:{O.email}">{O.email}</a></p>

	<h2>Responsible for content</h2>
	<p>Responsible for the content of bento.cat according to § 18 (2) MStV: {O.name}, address as above.</p>
	<p>Each box is written by the person who owns it. They are responsible for what they put there. If you find something on a box that breaks the law or our <a href="/terms">terms</a>, write to us and we’ll look at it.</p>

	<h2>Disputes</h2>
	<p>We are neither willing nor obliged to take part in dispute resolution proceedings before a consumer arbitration board.</p>
</LegalPage>
