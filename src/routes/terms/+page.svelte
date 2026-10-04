<script>
	import LegalPage from '#lib/components/LegalPage.svelte';
	import { OPERATOR as O } from '#lib/legal.js';
</script>

<LegalPage title="Terms" lede="The rules for making a box and visiting other people’s. Mostly: be nice to the cats.">
	<h2>Who we are</h2>
	<p>bento.cat is run by {O.name} (see the <a href="/imprint">imprint</a>). These terms apply when you use bento.cat, whether you have a box or are just visiting one. How we handle your data is explained in the <a href="/privacy">privacy policy</a>.</p>

	<h2>Your box</h2>
	<ul>
		<li>You need to be at least 16 to make a box.</li>
		<li>One box per person. Keep your sign-in to yourself; you’re responsible for what happens in your box.</li>
		<li>Addresses are first come, first served. We may take back an address that pretends to be someone else, misleads people or infringes someone’s name or trademark.</li>
		<li>bento.cat is free. If that ever changes for a feature, we’ll say so clearly before you pay for anything.</li>
	</ul>

	<h2>What you put in it</h2>
	<p>What you put in your box stays yours. You give us permission to store it, show it to anyone who visits your box or the Explore page, and make the copies that takes (resized pictures, link previews, backups). This permission is free, worldwide and ends when you delete the content or your box, apart from backups that run out on their own schedule.</p>
	<p>Only add things you have the right to share. Boxes are public, so think before you add something you wouldn’t want strangers to see.</p>

	<h2>Be nice to the cats</h2>
	<p>On your box, in guestbooks, and anywhere else on bento.cat, don’t:</p>
	<ul>
		<li>post anything illegal, or link to it;</li>
		<li>harass, threaten or bully anyone, or stir up hatred against people for who they are;</li>
		<li>post sexual content involving minors, or any sexual or graphically violent content at all;</li>
		<li>pretend to be someone you’re not;</li>
		<li>share other people’s personal details without their permission;</li>
		<li>use material that infringes someone’s copyright, trademark or other rights;</li>
		<li>send spam, scams, phishing or malware, or use links to trick people;</li>
		<li>scrape bento.cat in bulk, get around its limits, or do anything that harms the service or the people using it.</li>
	</ul>

	<h2>Email addresses you collect</h2>
	<p>If your box has a subscribe tile, the addresses people leave are for telling them about what they signed up for. Don’t sell or pass them on, don’t add them to anything else, and stop writing to anyone who asks. You’re responsible for following the law when you email them.</p>

	<h2>Reporting a box</h2>
	<p>If you find something on bento.cat that’s illegal or breaks these terms, write to <a href="mailto:{O.email}">{O.email}</a> with the link and what’s wrong with it. We’ll look at every report, act quickly on illegal content, and tell you what we did. This address is also our point of contact for authorities and users under the Digital Services Act. You can write to us in English or German.</p>
	<p>If we remove something from your box or limit your box, we’ll tell you what and why, unless the law stops us. If you think we got it wrong, reply and we’ll look again.</p>

	<h2>Ending things</h2>
	<p>You can delete your box at any time from the editor. We may remove content, or suspend or delete a box, that breaks these terms or the law. Unless it’s urgent or serious, we’ll warn you first and give you a chance to fix it or download your data.</p>

	<h2>Keeping the lights on</h2>
	<p>We look after bento.cat with care, but it’s a small free service. We can’t promise it will always be available or free of mistakes, and we may change features over time. If we ever shut it down, we’ll tell box owners at least 30 days ahead so they can download their data.</p>

	<h2>Liability</h2>
	<p>Because bento.cat is free, we’re liable only for intent and gross negligence. This doesn’t limit our liability for injury to life, body or health, under the Product Liability Act, or where the law doesn’t allow it to be limited.</p>

	<h2>Changes to these terms</h2>
	<p>If we change these terms in a way that matters, we’ll tell box owners by email at least 30 days before the change applies. If you don’t agree, you can download your data and delete your box before then.</p>

	<h2>Law</h2>
	<p>German law applies. If you use bento.cat as a consumer and live in another country, you keep the protection of the mandatory laws of that country. If any part of these terms isn’t valid, the rest still applies.</p>
</LegalPage>
